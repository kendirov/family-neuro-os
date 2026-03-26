import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { RaidDamageEvent } from '../../lib/raid-ui-model'

export function RaidDamageBurst({ event }: { event: RaidDamageEvent | null }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          <motion.div
            className="rounded-3xl border border-amber-500/40 bg-amber-500/10 px-6 py-4 shadow-[0_0_28px_rgba(251,191,36,0.18)]"
            initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92, y: 10 }}
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, scale: [1, 1.05, 1], y: [0, -10, -6] }
            }
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -18 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, ease: 'easeOut' }}
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-200/90 text-center">
              {event.sourceLabel}
            </div>
            <div className="mt-1 font-mono text-4xl font-black tabular-nums text-amber-200 text-center drop-shadow-[0_0_20px_rgba(251,191,36,0.28)]">
              −{event.amount}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

