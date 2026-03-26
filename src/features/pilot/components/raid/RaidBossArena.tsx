import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { RaidBossDisplayModel, RaidDamageEvent } from '../../lib/raid-ui-model'
import { BossHpBar } from './BossHpBar'
import { BossPhaseBadge } from './BossPhaseBadge'
import { RaidDamageBurst } from './RaidDamageBurst'
import { pickPhase } from '../../mocks/raid.mock'
import { tgText } from '@/i18n/tgMessages'

function phaseBackdrop(phaseId: string) {
  if (phaseId === 'PHASE_1') {
    return 'bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(34,211,238,0.10)_0%,transparent_60%)]'
  }
  if (phaseId === 'PHASE_2') {
    return 'bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(251,146,60,0.10)_0%,transparent_60%)]'
  }
  return 'bg-[radial-gradient(ellipse_120%_80%_at_50%_0%,rgba(248,113,113,0.12)_0%,transparent_60%)]'
}

export function RaidBossArena({
  open,
  boss,
  onClose,
  pendingDamageEvent,
}: {
  open: boolean
  boss: RaidBossDisplayModel
  onClose: () => void
  pendingDamageEvent: RaidDamageEvent | null
}) {
  const shouldReduceMotion = useReducedMotion()
  const [localDamage, setLocalDamage] = useState<RaidDamageEvent | null>(null)
  const prevHpRef = useRef(boss.hp)

  useEffect(() => {
    // When parent sends a damage event, show burst.
    if (!pendingDamageEvent) return
    setLocalDamage(pendingDamageEvent)
    const t = window.setTimeout(() => setLocalDamage(null), 900)
    return () => window.clearTimeout(t)
  }, [pendingDamageEvent])

  const phase = useMemo(() => pickPhase(boss.hp, boss.maxHp), [boss.hp, boss.maxHp])
  const isWin = boss.hp <= 0

  const hitShake =
    !shouldReduceMotion && boss.hp < prevHpRef.current
      ? { x: [0, -8, 8, -6, 6, 0], rotate: [0, -1.2, 1.2, 0] }
      : undefined

  useEffect(() => {
    prevHpRef.current = boss.hp
  }, [boss.hp])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={tgText('kid', 'raid.arena.aria')}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

          <motion.div
            className={[
              'relative w-full max-w-[980px] rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden',
              'shadow-[0_12px_48px_rgba(0,0,0,0.55)]',
              phaseBackdrop(phase.id),
            ].join(' ')}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
          >
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-gaming text-lg uppercase tracking-wider text-slate-200">
                    {tgText('kid', 'raid.arena.title')}
                  </h3>
                  <BossPhaseBadge phase={phase} />
                  <span className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-200">
                    {boss.rarity}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-slate-400/90">
                  {phase.description}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-slate-200 hover:bg-white/10 active:scale-[0.98] touch-manipulation"
                aria-label={tgText('kid', 'raid.arena.closeAria')}
              >
                {tgText('kid', 'raid.arena.close')}
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative">
              <div className="relative rounded-3xl border border-white/10 bg-slate-900/35 p-5 overflow-hidden">
                <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-20 bg-purple-500/40 blur-3xl" aria-hidden />
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{tgText('kid', 'raid.bossLabel')}</div>
                    <div className="mt-1 font-gaming text-xl uppercase tracking-wider text-slate-200">
                      {boss.emoji} {boss.name}
                    </div>
                  </div>
                  {isWin && (
                    <span className="rounded-2xl border border-emerald-500/45 bg-emerald-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-emerald-200">
                      {tgText('kid', 'raid.victory')}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <BossHpBar boss={{ ...boss, phase }} />
                </div>

                <motion.div
                  className="mt-5 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-slate-900/70 to-slate-950/60 p-6 flex items-center justify-center"
                  initial={false}
                  animate={hitShake ?? { x: 0, rotate: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.5, ease: 'easeInOut' }}
                  aria-label={tgText('kid', 'raid.bossLabel')}
                >
                  <span
                    className="text-[96px] leading-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.6)]"
                    aria-hidden
                  >
                    {boss.emoji}
                  </span>
                </motion.div>

                <RaidDamageBurst event={localDamage} />
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/35 p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{tgText('kid', 'raid.reward')}</div>
                <div className="mt-2 rounded-3xl border border-amber-500/25 bg-amber-500/5 p-4">
                  <div className="font-gaming text-base uppercase tracking-wider text-amber-200">{tgText('kid', 'raid.unlock')}</div>
                  <div className="mt-1 font-mono text-xs text-slate-300/90">{boss.rewardLabel}</div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'raid.lootboxId')}</span>
                      <span className="font-mono text-[10px] tabular-nums text-slate-200">{boss.rewardLootboxId}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {tgText('kid', 'raid.tip')}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

