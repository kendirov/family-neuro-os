import { motion, useReducedMotion } from 'motion/react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { TodayChecklistModel } from '../../lib/wellness-ui-model'

function CheckRow({
  label,
  ok,
  hint,
}: {
  label: string
  ok: boolean
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'h-2 w-2 rounded-full shrink-0',
              ok ? 'bg-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.35)]' : 'bg-slate-600'
            )}
            aria-hidden
          />
          <span className="font-sans-data text-[13px] text-slate-100 truncate">
            {label}
          </span>
        </div>
        {hint && <div className="mt-0.5 font-sans-data text-[11px] text-slate-400 truncate">{hint}</div>}
      </div>
      <span
        className={cn(
          'shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
          ok ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
        )}
      >
        {ok ? 'done' : 'open'}
      </span>
    </div>
  )
}

export function TodayWellnessChecklist({
  model,
}: {
  model: TodayChecklistModel
}) {
  const reduce = useReducedMotion()
  const ideal = model.idealDay

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-sans-data text-[14px] font-semibold text-slate-50">
            Today checklist
          </h2>
          <p className="mt-1 font-sans-data text-[12px] text-slate-400 leading-snug">
            One-tap logging. No forms.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.2 }}
          className={cn(
            'shrink-0 rounded-xl border px-3 py-2',
            ideal
              ? 'border-emerald-500/35 bg-emerald-500/10'
              : 'border-white/10 bg-white/5'
          )}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
            ideal day
          </div>
          <div className={cn('mt-0.5 font-mono text-sm font-semibold tabular-nums', ideal ? 'text-emerald-200' : 'text-slate-200')}>
            {ideal ? 'ready' : 'in progress'}
          </div>
        </motion.div>
      </div>

      <div className="mt-4 space-y-3">
        <CheckRow label="Hydration" ok={model.waterOk} hint="Target reached" />
        <CheckRow label="Steps" ok={model.stepsOk} hint="Daily movement" />
        <CheckRow label="Vitamins" ok={model.vitaminsOk} hint="Taken today" />
        <CheckRow label="Sleep" ok={model.sleepOk} hint="Last night" />
      </div>
    </GlassCard>
  )
}

