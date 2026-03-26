import { motion, useReducedMotion } from 'motion/react'
import type { InventoryRarity, LootboxRewardDisplayModel } from '../../lib/inventory-ui-model'
import { LootParticles } from './LootParticles'
import { RarityBadge } from './RarityBadge'
import { tgText } from '@/i18n/tgMessages'

type RevealPhase = 'anticipation' | 'flash' | 'reveal' | 'done'

function rarityVisual(rarity: InventoryRarity) {
  if (rarity === 'COMMON') return { halo: 'rgba(34,211,238,0.25)', border: 'border-cyan-500/45', bg: 'bg-cyan-500/10' }
  if (rarity === 'RARE') return { halo: 'rgba(59,130,246,0.25)', border: 'border-blue-500/55', bg: 'bg-blue-500/10' }
  if (rarity === 'EPIC') return { halo: 'rgba(168,85,247,0.25)', border: 'border-purple-500/60', bg: 'bg-purple-500/10' }
  return { halo: 'rgba(251,191,36,0.30)', border: 'border-amber-500/65', bg: 'bg-amber-500/10' }
}

export function RewardReveal({
  reward,
  phase,
  rarity,
  showParticles,
}: {
  reward: LootboxRewardDisplayModel
  phase: RevealPhase
  rarity: InventoryRarity
  showParticles: boolean
}) {
  const shouldReduceMotion = useReducedMotion()
  const visual = rarityVisual(rarity)

  const showReward = phase === 'reveal' || phase === 'done'
  const isDone = phase === 'done'
  const isFlash = phase === 'flash'

  const rewardKinematics =
    rarity === 'COMMON'
      ? { scale: [0.98, 1.02, 1], rotate: [0, 0.6, 0] }
      : rarity === 'RARE'
        ? { scale: [0.95, 1.08, 1], rotate: [0, -1.2, 0] }
        : rarity === 'EPIC'
          ? { scale: [0.9, 1.15, 1], rotate: [0, 2, -0.5, 0] }
          : { scale: [0.85, 1.22, 1], rotate: [0, -3, 1, 0] }

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* Anticipation halo */}
      {phase === 'anticipation' && (
        <div
          className="absolute inset-0 rounded-3xl blur-xl opacity-90 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${visual.halo} 0%, transparent 60%)` }}
        />
      )}

      {/* Flash */}
      <AnimateFlash
        isVisible={isFlash && !shouldReduceMotion}
        rarity={rarity}
        ariaHidden
      />

      <motion.div
        className={[
          'relative rounded-3xl border p-4 sm:p-5 backdrop-blur-xl',
          visual.border,
          'bg-slate-950/40',
        ].join(' ')}
        layout
        initial={false}
        animate={{
          opacity: showReward ? 1 : phase === 'flash' ? 0.4 : 0,
          scale: showReward ? (shouldReduceMotion ? 1 : rewardKinematics.scale) : 0.96,
          rotate: showReward ? (shouldReduceMotion ? 0 : rewardKinematics.rotate) : 0,
          y: showReward ? 0 : phase === 'anticipation' ? 6 : 0,
        }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : isDone ? 0.25 : 0.5,
          ease: 'easeOut',
        }}
        aria-label={tgText('kid', 'rewardReveal.aria')}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={[
                'shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center relative',
                visual.bg,
              ].join(' ')}
              style={{
                width: 56,
                height: 56,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 26px ${visual.halo}`,
              }}
              aria-hidden
            >
              <span className="text-[28px]">{reward.emoji}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-gaming text-sm sm:text-base uppercase tracking-wider truncate">
                  {reward.name}
                </h4>
                <RarityBadge rarity={rarity} compact />
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400/90 leading-tight">
                {reward.subtitle ?? reward.itemType} · x{reward.quantity}
              </p>
            </div>
          </div>
          {rarity === 'LEGENDARY' && showReward && !shouldReduceMotion && (
            <motion.span
              className="shrink-0 inline-flex items-center justify-center rounded-full h-10 w-10 border border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
              initial={false}
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 0.7, repeat: isDone ? 0 : 1, repeatDelay: 0.1 }}
              aria-hidden
            >
              👑
            </motion.span>
          )}
        </div>

        <LootParticles rarity={rarity} enabled={showParticles && showReward} />
      </motion.div>
    </div>
  )
}

function AnimateFlash({ isVisible, rarity, ariaHidden }: { isVisible: boolean; rarity: InventoryRarity; ariaHidden?: boolean }) {
  const visual = rarityVisual(rarity)
  if (!isVisible) return null
  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
      aria-hidden={ariaHidden ? true : undefined}
      initial={false}
      animate={{ opacity: [0, 1, 0], scale: [0.98, 1.02, 1] }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, ${visual.halo} 18%, transparent 55%)`,
        boxShadow: `0 0 30px ${visual.halo}`,
      }}
    />
  )
}

