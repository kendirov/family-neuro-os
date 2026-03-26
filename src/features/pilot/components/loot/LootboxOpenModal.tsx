import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { InventoryItemDisplayModel, InventoryRarity, LootboxRewardDisplayModel } from '../../lib/inventory-ui-model'
import { tgText } from '@/i18n/tgMessages'
import {
  INVENTORY_MOCK_REWARD_CATALOG,
  INVENTORY_MOCK_REWARD_TABLES,
  pickWeightedRewardRewardId,
} from '../../mocks/inventory.mock'
import { RewardReveal } from './RewardReveal'
import { LootParticles } from './LootParticles'
import { RarityBadge } from './RarityBadge'

type ModalPhase = 'anticipation' | 'flash' | 'reveal' | 'done'

function modalDurationForRarity(rarity: InventoryRarity): { anticipationMs: number; flashMs: number; revealMs: number } {
  if (rarity === 'COMMON') return { anticipationMs: 520, flashMs: 180, revealMs: 650 }
  if (rarity === 'RARE') return { anticipationMs: 620, flashMs: 200, revealMs: 720 }
  if (rarity === 'EPIC') return { anticipationMs: 720, flashMs: 230, revealMs: 820 }
  return { anticipationMs: 820, flashMs: 260, revealMs: 980 }
}

export function LootboxOpenModal({
  open,
  accent,
  pilotId,
  lootbox,
  onClose,
  onReward,
}: {
  open: boolean
  accent: 'cyan' | 'purple'
  pilotId: string
  lootbox: InventoryItemDisplayModel | null
  onClose: () => void
  onReward: (reward: LootboxRewardDisplayModel) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<ModalPhase>('anticipation')
  const [reward, setReward] = useState<LootboxRewardDisplayModel | null>(null)
  const committedRef = useRef(false)
  const timeoutsRef = useRef<number[]>([])

  const rarity: InventoryRarity = lootbox?.rarity ?? 'COMMON'
  const accentText = accent === 'cyan' ? 'text-cyan-200' : 'text-purple-200'

  const clearTimers = () => {
    for (const t of timeoutsRef.current) window.clearTimeout(t)
    timeoutsRef.current = []
  }

  useEffect(() => {
    if (!open) return

    committedRef.current = false
    clearTimers()
    setPhase('anticipation')
    setReward(null)

    if (!lootbox) {
      // nothing to open
      setPhase('done')
      return
    }

    // Roll reward once at open.
    const rewardId = pickWeightedRewardRewardId(lootbox.id, INVENTORY_MOCK_REWARD_TABLES)
    const catalog = INVENTORY_MOCK_REWARD_CATALOG[rewardId]

    if (!catalog) {
      setReward({
        rewardId: 'reward-unknown',
        itemType: 'BOOST',
        rarity: 'COMMON',
        name: tgText('kid', 'lootbox.unknownReward'),
        emoji: '❓',
        quantity: 1,
        subtitle: tgText('kid', 'lootbox.subtitleMock'),
      })
      return
    }

    const table = INVENTORY_MOCK_REWARD_TABLES.find((t) => t.lootboxId === lootbox.id)
    const opt = table?.options.find((o) => o.rewardId === rewardId)
    const quantity = opt?.quantity ?? 1

    const nextReward: LootboxRewardDisplayModel = {
      ...catalog,
      rewardId: rewardId,
      quantity,
    }
    setReward(nextReward)

    if (shouldReduceMotion) {
      setPhase('done')
      return
    }

    const durations = modalDurationForRarity(lootbox.rarity)
    const t1 = window.setTimeout(() => setPhase('flash'), durations.anticipationMs)
    const t2 = window.setTimeout(() => setPhase('reveal'), durations.anticipationMs + durations.flashMs)
    const t3 = window.setTimeout(() => setPhase('done'), durations.anticipationMs + durations.flashMs + durations.revealMs)
    timeoutsRef.current = [t1, t2, t3]

    return () => clearTimers()
  }, [open, lootbox, shouldReduceMotion])

  useEffect(() => {
    if (!open) return
    if (phase !== 'done') return
    if (committedRef.current) return
    if (!reward) return
    committedRef.current = true
    onReward(reward)
  }, [phase, open, reward, onReward])

  const handleSkip = () => {
    clearTimers()
    setPhase('done')
    if (reward && !committedRef.current) {
      committedRef.current = true
      onReward(reward)
    }
  }

  const canSkip = open && (phase === 'anticipation' || phase === 'flash' || phase === 'reveal') && !shouldReduceMotion

  return (
    <AnimatePresence>
      {open && lootbox && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label={tgText('kid', 'lootbox.modal.aria')}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="relative panel-glass w-full max-w-[520px] border border-white/10 rounded-3xl p-5 overflow-hidden"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={shouldReduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  layoutId={`inv-item-${lootbox.id}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 flex items-center gap-3"
                  aria-hidden
                >
                  <span className="text-[28px]">{lootbox.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-gaming text-sm uppercase tracking-wider truncate">{lootbox.name}</div>
                    <div className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{tgText('kid', 'lootbox.opening')}</div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center gap-2">
                <RarityBadge rarity={rarity} />
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-slate-200 hover:bg-white/10 active:scale-[0.98] touch-manipulation"
                  aria-label={tgText('kid', 'ui.close')}
                >
                  {tgText('kid', 'lootbox.close')}
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="mt-4">
              <div className="relative">
                <LootParticles rarity={rarity} enabled={phase !== 'done' && !shouldReduceMotion} />
                {reward ? (
                  <RewardReveal reward={reward} phase={phase} rarity={rarity} showParticles />
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-6 text-center font-mono text-slate-400 text-sm">
                    {tgText('kid', 'lootbox.rolling')}
                  </div>
                )}
              </div>

              {/* Skip */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className={`font-mono text-[10px] uppercase tracking-widest ${accentText} opacity-90`}>
                  {phase === 'done' ? tgText('kid', 'lootbox.ready') : tgText('kid', 'lootbox.wait')}
                </span>
                {canSkip && (
                  <motion.button
                    type="button"
                    onClick={handleSkip}
                    className="rounded-2xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-amber-200 hover:bg-amber-500/25 active:scale-[0.98] touch-manipulation"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={tgText('kid', 'lootbox.skipAria')}
                  >
                    {tgText('kid', 'lootbox.skip')}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

