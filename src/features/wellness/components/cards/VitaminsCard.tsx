import { motion, useReducedMotion } from 'motion/react'
import { Pill } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { VitaminsModel } from '../../lib/wellness-ui-model'

export function VitaminsCard({
  model,
  onMarkTaken,
}: {
  model: VitaminsModel
  onMarkTaken: () => void
}) {
  const reduce = useReducedMotion()
  const taken = model.takenToday

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center">
              <Pill className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
              Vitamins
            </h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('font-mono text-2xl font-semibold tabular-nums', taken ? 'text-emerald-200' : 'text-slate-50')}>
              {taken ? 'Taken' : 'Open'}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
              today
            </span>
          </div>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest',
            taken ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'
          )}
        >
          {taken ? 'done' : 'tap'}
        </span>
      </div>

      <div className="mt-4">
        <motion.button
          type="button"
          onClick={onMarkTaken}
          disabled={taken}
          className={cn(
            'w-full min-h-[52px] rounded-xl border transition touch-manipulation',
            taken
              ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-200/70 cursor-default'
              : 'border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 text-slate-100'
          )}
          whileTap={!taken && !reduce ? { scale: 0.985 } : undefined}
          aria-label={taken ? 'Vitamins already taken' : 'Mark vitamins taken'}
        >
          <span className="font-mono text-[12px] uppercase tracking-widest">
            {taken ? 'Marked' : 'Mark as taken'}
          </span>
        </motion.button>
      </div>
    </GlassCard>
  )
}

