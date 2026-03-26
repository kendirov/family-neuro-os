import { motion, useReducedMotion } from 'motion/react'
import { Moon } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { SleepModel } from '../../lib/wellness-ui-model'

function fmtHours(hours: number) {
  const h = Math.max(0, hours)
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  const mm = String(mins).padStart(2, '0')
  return `${whole}h ${mm}m`
}

function qualityLabel(q: SleepModel['quality']) {
  if (q === 'good') return 'Good'
  if (q === 'ok') return 'OK'
  return 'Poor'
}

export function SleepCard({
  model,
  onQuickLog,
}: {
  model: SleepModel
  onQuickLog: (payload: { hours: number; quality: SleepModel['quality'] }) => void
}) {
  const reduce = useReducedMotion()
  const good = model.quality === 'good' && model.lastNightHours >= 7

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center">
              <Moon className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
              Sleep
            </h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-50">
              {fmtHours(model.lastNightHours)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              · {qualityLabel(model.quality)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            good ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
          )}
        >
          last night
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { k: 'ok', label: '7h · OK', hours: 7.0, quality: 'ok' as const },
          { k: 'good', label: '8h · Good', hours: 8.0, quality: 'good' as const },
        ].map((x) => (
          <motion.button
            key={x.k}
            type="button"
            onClick={() => onQuickLog({ hours: x.hours, quality: x.quality })}
            className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation"
            whileTap={reduce ? undefined : { scale: 0.98 }}
            aria-label={`Log sleep ${x.label}`}
          >
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-100">
              {x.label}
            </span>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}

