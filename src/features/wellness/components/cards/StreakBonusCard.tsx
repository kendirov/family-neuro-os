import { motion, useReducedMotion } from 'motion/react'
import { Shield, Sparkles } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import type { StreakModel } from '../../lib/wellness-ui-model'

export function StreakBonusCard({
  model,
  onOpenHistory,
}: {
  model: StreakModel
  onOpenHistory: () => void
}) {
  const reduce = useReducedMotion()
  const pct = model.targetDays <= 0 ? 0 : Math.min(1, model.currentDays / model.targetDays)
  const armed = model.remainingToTarget === 0

  const chipClass =
    model.familyBonus.status === 'active'
      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
      : model.familyBonus.status === 'arming'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
        : 'border-white/10 bg-white/5 text-slate-300'

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl border border-white/10 bg-slate-950/40 flex items-center justify-center">
              <Shield className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
            </span>
            <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">
              Streak & Family bonus
            </h3>
          </div>
          <p className="mt-2 font-sans-data text-[12px] text-slate-400 leading-snug">
            5-day ideal streak arms a weekend family XP multiplier. UI shows preview only.
          </p>
        </div>
        <span className={cn('shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest', chipClass)}>
          {model.familyBonus.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">current streak</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-slate-50">
            {model.currentDays}
            <span className="ml-1 text-[12px] text-slate-400">days</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">to arm</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-slate-50">
            {Math.max(0, model.remainingToTarget)}
            <span className="ml-1 text-[12px] text-slate-400">days</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">progress</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300">
            {model.currentDays}/{model.targetDays}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-950/40 border border-white/10 overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: reduce ? 0.01 : 0.25, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              armed
                ? 'bg-gradient-to-r from-amber-200/25 via-amber-200/30 to-emerald-200/25'
                : 'bg-gradient-to-r from-slate-50/15 via-slate-50/18 to-slate-50/15'
            )}
            style={{ boxShadow: armed ? '0 0 14px rgba(251,191,36,0.16)' : '0 0 10px rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
              <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                family bonus preview
              </div>
            </div>
            <div className="mt-2 font-sans-data text-[13px] text-slate-100 leading-snug">
              {model.familyBonus.previewText}
            </div>
            {model.familyBonus.windowLabel && (
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                window: {model.familyBonus.windowLabel}
              </div>
            )}
          </div>
          <span className={cn('shrink-0 rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest', chipClass)}>
            {model.familyBonus.label}
          </span>
        </div>
      </div>

      <motion.button
        type="button"
        onClick={onOpenHistory}
        className="mt-4 w-full min-h-[52px] rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation"
        whileTap={reduce ? undefined : { scale: 0.985 }}
        aria-label="Open history and insights"
      >
        <span className="font-mono text-[12px] uppercase tracking-widest text-slate-100">History & insights</span>
      </motion.button>
    </GlassCard>
  )
}

