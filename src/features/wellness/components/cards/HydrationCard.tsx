import { motion, useReducedMotion } from 'motion/react'
import { Droplets } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { HydrationModel } from '../../lib/wellness-ui-model'

function fmtMl(x: number) {
  return `${Math.max(0, Math.round(x))} ml`
}

export function HydrationCard({
  model,
  onQuickAdd,
}: {
  model: HydrationModel
  onQuickAdd: (amountMl: 250 | 500) => void
}) {
  const reduce = useReducedMotion()
  const pct = model.targetMl <= 0 ? 0 : Math.min(1, model.todayMl / model.targetMl)
  const done = model.todayMl >= model.targetMl

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center">
              <Droplets className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
              Hydration
            </h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-50">
              {fmtMl(model.todayMl)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              / {fmtMl(model.targetMl)}
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            done ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
          )}
        >
          {done ? 'on track' : 'today'}
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-950/40 border border-white/10 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: reduce ? 0.01 : 0.25, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-slate-200/35 via-slate-50/35 to-emerald-200/35"
            style={{
              boxShadow: done ? '0 0 12px rgba(16,185,129,0.18)' : '0 0 10px rgba(255,255,255,0.08)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <motion.button
          type="button"
          onClick={() => onQuickAdd(250)}
          className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation"
          whileTap={reduce ? undefined : { scale: 0.98 }}
          aria-label="Add 250 ml"
        >
          <span className="font-mono text-[12px] uppercase tracking-widest text-slate-100">+250</span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">ml</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onQuickAdd(500)}
          className="min-h-[48px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation"
          whileTap={reduce ? undefined : { scale: 0.98 }}
          aria-label="Add 500 ml"
        >
          <span className="font-mono text-[12px] uppercase tracking-widest text-slate-100">+500</span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">ml</span>
        </motion.button>
      </div>
    </GlassCard>
  )
}

