import { motion, useReducedMotion } from 'motion/react'
import type { RaidPhaseDisplay } from '../../lib/raid-ui-model'

export function BossPhaseBadge({ phase }: { phase: RaidPhaseDisplay }) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
      initial={false}
      animate={shouldReduceMotion ? undefined : { opacity: [0.9, 1, 0.95] }}
      transition={shouldReduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      aria-label={`Boss phase: ${phase.label}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">PHASE</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-200">{phase.id.replace('PHASE_', '')}</span>
    </motion.div>
  )
}

