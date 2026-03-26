import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { RaidBossDisplayModel } from '../../lib/raid-ui-model'
import { tgText } from '@/i18n/tgMessages'

export function RaidVictoryModal({
  open,
  boss,
  onClose,
  onOpenWeekendLootbox,
}: {
  open: boolean
  boss: RaidBossDisplayModel
  onClose: () => void
  onOpenWeekendLootbox: () => void
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={tgText('kid', 'raid.victory.aria')}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

          <motion.div
            className="relative w-full max-w-[520px] rounded-3xl border border-amber-500/30 bg-slate-950/60 backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(251,191,36,0.12)] overflow-hidden"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
          >
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl opacity-60" aria-hidden />

            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-amber-300/90">{tgText('kid', 'raid.victory.title')}</div>
                  <h3 className="mt-1 font-gaming text-lg uppercase tracking-wider text-amber-200">
                    {boss.emoji} {tgText('kid', 'raid.victory.defeated', { name: boss.name })}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-slate-300/90">
                    {tgText('kid', 'raid.victory.unlockLine', { label: boss.rewardLabel })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-slate-200 hover:bg-white/10 active:scale-[0.98] touch-manipulation"
                  aria-label={tgText('kid', 'ui.close')}
                >
                  {tgText('kid', 'ui.close')}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                  onClick={onOpenWeekendLootbox}
                  className="rounded-2xl border border-amber-500/45 bg-amber-500/15 px-3 py-3 font-mono text-[11px] uppercase tracking-widest text-amber-200 hover:bg-amber-500/25 active:scale-[0.98] touch-manipulation"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  aria-label={tgText('kid', 'raid.victory.openLootbox')}
                >
                  {tgText('kid', 'raid.victory.openLootbox')}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 font-mono text-[11px] uppercase tracking-widest text-slate-200 hover:bg-white/10 active:scale-[0.98] touch-manipulation"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  aria-label={tgText('kid', 'raid.victory.backToGarage')}
                >
                  {tgText('kid', 'raid.victory.backToGarage')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

