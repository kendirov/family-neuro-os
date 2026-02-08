import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Composite Task: Main action (hero) + Bonus modifiers (sidekicks).
 * Used for Nutrition: e.g. "Завтрак" with main "Съел +15" and bonuses "Вовремя +5", "Много +10".
 */
function normalizeTask(raw) {
  return {
    id: raw.id,
    label: raw.label,
    reward: raw.credits ?? raw.reward,
    emoji: raw.emoji,
    reason: raw.reason,
    isDaily: true,
    credits: raw.credits ?? raw.reward,
  }
}

export function CompositeTaskCard({
  mainTask,
  modifierTasks = [],
  getStatus,
  onTaskComplete,
  disabled,
  className,
}) {
  const main = normalizeTask(mainTask)
  const modifiers = modifierTasks.map(normalizeTask)

  const mainStatus = getStatus(main.id)
  const mainCompleted = mainStatus === 'completed'
  const mainPending = mainStatus === 'pending'

  const handleMain = (e) => {
    if (mainCompleted || disabled) return
    onTaskComplete(main, e)
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-[3px] border-amber-500/40 bg-slate-800/90 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-amber-600/10">
        <span className="text-2xl shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" aria-hidden>
          {main.emoji}
        </span>
        <span className="font-gaming text-base uppercase tracking-wider text-amber-100 text-pop">
          {main.label}
        </span>
      </div>

      {/* Body: Hero (main) + Bonus zone */}
      <div className="p-2 flex flex-col sm:flex-row gap-2 items-stretch">
        {/* Left: ONE big primary button — "Съел +15 кр" */}
        <div className="flex-1 min-w-0">
          <motion.button
            type="button"
            onClick={handleMain}
            disabled={mainCompleted || disabled}
            className={cn(
              'relative w-full min-h-[56px] rounded-2xl border-[3px] flex items-center justify-center gap-2 font-gaming font-bold text-base transition touch-manipulation overflow-hidden',
              mainCompleted
                ? 'border-slate-600/40 bg-slate-800/50 text-slate-500 cursor-default opacity-50 grayscale shadow-[inset_0_3px_10px_rgba(0,0,0,0.4)]'
                : 'border-amber-500/60 bg-amber-500/20 text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.25),0_4px_10px_rgba(0,0,0,0.3)] hover:bg-amber-500/30 hover:shadow-[0_0_18px_rgba(251,191,36,0.35),0_5px_12px_rgba(0,0,0,0.35)] active:scale-[0.98]'
            )}
            animate={{
              scale: mainCompleted ? 0.98 : 1,
              boxShadow: mainCompleted
                ? 'inset 0 3px 10px rgba(0,0,0,0.4)'
                : undefined,
            }}
            whileHover={!mainCompleted && !disabled ? { scale: 1.02 } : undefined}
            whileTap={!mainCompleted && !disabled ? { scale: 0.98 } : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {mainCompleted && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Check className="h-8 w-8 text-emerald-400/90 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" strokeWidth={2.5} />
              </span>
            )}
            <span className={cn('relative z-0', mainCompleted && 'opacity-0')}>
              <span>Съел</span>
              <span className="font-mono tabular-nums">+{main.reward} кр</span>
            </span>
          </motion.button>
        </div>

        {/* Right: Bonus zone — small toggle badges */}
        <div className="flex flex-wrap gap-1.5 items-center justify-end sm:justify-start min-w-0">
          {modifiers.map((mod) => {
            const modStatus = getStatus(mod.id)
            const modCompleted = modStatus === 'completed'
            const handleMod = (e) => {
              if (modCompleted || disabled) return
              onTaskComplete(mod, e)
            }
            return (
              <motion.button
                key={mod.id}
                type="button"
                onClick={handleMod}
                disabled={modCompleted || disabled}
                className={cn(
                  'shrink-0 min-h-[40px] px-3 rounded-2xl border-[3px] font-gaming text-xs font-bold tabular-nums transition touch-manipulation flex items-center gap-1.5 text-pop',
                  modCompleted
                    ? 'border-slate-600/40 bg-slate-800/50 text-slate-500 opacity-50 grayscale shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)] cursor-default'
                    : 'border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-[0_2px_6px_rgba(0,0,0,0.25)] hover:bg-amber-500/25 hover:shadow-[0_3px_8px_rgba(0,0,0,0.3)] active:scale-95'
                )}
                whileHover={!modCompleted && !disabled ? { scale: 1.05 } : undefined}
                whileTap={!modCompleted && !disabled ? { scale: 0.95 } : undefined}
                aria-pressed={modCompleted}
              >
                <span className="shrink-0" aria-hidden>
                  {mod.emoji}
                </span>
                <span className="truncate max-w-[72px]">{mod.label}</span>
                <span className="tabular-nums">+{mod.reward} кр</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
