import { motion, useReducedMotion } from 'motion/react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { WeeklyWellnessModel } from '../../lib/wellness-ui-model'

function sparkPath(values: number[], w: number, h: number) {
  if (values.length === 0) return ''
  const max = Math.max(1, ...values)
  const min = Math.min(...values)
  const span = Math.max(1, max - min)
  const stepX = values.length <= 1 ? w : w / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * stepX
    const y = h - ((v - min) / span) * h
    return { x, y }
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  return d
}

export function WeeklyTrendCard({
  model,
}: {
  model: WeeklyWellnessModel
}) {
  const reduce = useReducedMotion()
  const idealCount = model.days.reduce((acc, d) => acc + (d.idealDay ? 1 : 0), 0)
  const adherence = model.adherencePct
  const series = model.days.map((d) => (d.idealDay ? 1 : 0))
  const path = sparkPath(series, 180, 28)

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
            Weekly trend
          </h3>
          <p className="mt-1 font-sans-data text-[12px] text-slate-400 leading-snug">
            Compact adherence view (not BI).
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
          <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">adherence</div>
          <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-50">{adherence}%</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {model.days.map((d) => (
          <motion.div
            key={d.dateKey}
            layout
            className={cn(
              'rounded-xl border px-2 py-2 flex flex-col items-center justify-center gap-1',
              'bg-slate-950/30 border-white/10'
            )}
          >
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{d.label}</span>
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                d.idealDay
                  ? 'bg-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-700'
              )}
              aria-label={d.idealDay ? 'Ideal day' : 'Not ideal'}
            />
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
            ideal days
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">
            {idealCount}/{model.days.length}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="h-2 rounded-full bg-slate-950/40 border border-white/10 overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${Math.min(100, adherence)}%` }}
                transition={{ duration: reduce ? 0.01 : 0.25, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-slate-50/12 via-slate-50/18 to-emerald-200/18"
                style={{ boxShadow: '0 0 10px rgba(255,255,255,0.08)' }}
              />
            </div>
          </div>

          <svg width="180" height="28" viewBox="0 0 180 28" className="shrink-0 opacity-80" aria-hidden>
            <path d={path} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" />
            <path d={path} fill="none" stroke="rgba(16,185,129,0.18)" strokeWidth="5.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </GlassCard>
  )
}

