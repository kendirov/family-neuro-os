import { motion, useReducedMotion } from 'motion/react'
import { GlassCard } from '@/components/GlassCard'

export function WellnessHero({
  title = 'Wellness',
  subtitle = 'Premium daily health cockpit',
  rightLabel,
}: {
  title?: string
  subtitle?: string
  rightLabel?: string
}) {
  const reduce = useReducedMotion()

  return (
    <GlassCard className="p-4 sm:p-5 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.25, ease: 'easeOut' }}
        className="flex items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="font-sans-data text-[18px] sm:text-[20px] font-semibold tracking-tight text-slate-50">
              {title}
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
              adult module
            </span>
          </div>
          <p className="mt-1 font-sans-data text-[12px] sm:text-[13px] text-slate-300/85 leading-snug">
            {subtitle}
          </p>
        </div>
        {rightLabel && (
          <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300/90">
              {rightLabel}
            </span>
          </div>
        )}
      </motion.div>

      {/* Calm premium accent band (no neon) */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { k: 'focus', label: 'Focus', v: 'Today' },
          { k: 'clarity', label: 'Clarity', v: 'Weekly' },
          { k: 'reward', label: 'Bonus', v: 'Family' },
        ].map((x) => (
          <div
            key={x.k}
            className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
                {x.label}
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-200">
                {x.v}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

