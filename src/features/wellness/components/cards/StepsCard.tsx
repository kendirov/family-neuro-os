import { motion, useReducedMotion } from 'motion/react'
import { Footprints } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { StepsModel } from '../../lib/wellness-ui-model'

function fmtSteps(x: number) {
  const v = Math.max(0, Math.round(x))
  return v.toLocaleString('en-US')
}

export function StepsCard({
  model,
  onQuickLog,
}: {
  model: StepsModel
  onQuickLog: (deltaSteps: number) => void
}) {
  const reduce = useReducedMotion()
  const pct = model.targetSteps <= 0 ? 0 : Math.min(1, model.todaySteps / model.targetSteps)
  const done = model.todaySteps >= model.targetSteps

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center">
              <Footprints className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
              Steps
            </h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-50">
              {fmtSteps(model.todaySteps)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              / {fmtSteps(model.targetSteps)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            done ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
          )}
        >
          {done ? 'target' : 'today'}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-950/40 border border-white/10 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: reduce ? 0.01 : 0.25, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-slate-200/30 via-slate-50/30 to-emerald-200/30"
            style={{
              boxShadow: done ? '0 0 12px rgba(16,185,129,0.18)' : '0 0 10px rgba(255,255,255,0.08)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { k: 'walk', label: '+1k', steps: 1000 },
          { k: 'long', label: '+2k', steps: 2000 },
        ].map((x) => (
          <motion.button
            key={x.k}
            type="button"
            onClick={() => onQuickLog(x.steps)}
            className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation"
            whileTap={reduce ? undefined : { scale: 0.98 }}
            aria-label={`Log ${x.steps} steps`}
          >
            <span className="font-mono text-[12px] uppercase tracking-widest text-slate-100">
              {x.label}
            </span>
            <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              steps
            </span>
          </motion.button>
        ))}
      </div>
    </GlassCard>
  )
}

