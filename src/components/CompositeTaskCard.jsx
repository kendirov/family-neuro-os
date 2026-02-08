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
      {/* Row 1: Main — полная ширина, «сочный» градиент (оранж/янтарь). [ 🍳 ЗАВТРАК +15 ] */}
      <motion.button
        type="button"
        onClick={handleMain}
        disabled={mainCompleted || disabled}
        className={cn(
          'relative w-full min-h-[52px] rounded-none border-b-[2px] flex items-center justify-center gap-2 font-gaming font-bold text-base uppercase tracking-wider transition touch-manipulation overflow-hidden',
          mainCompleted
            ? 'border-slate-600/40 bg-slate-800/50 text-slate-500 cursor-default opacity-50 grayscale shadow-[inset_0_3px_10px_rgba(0,0,0,0.4)]'
            : 'border-amber-500/70 bg-gradient-to-b from-amber-400/35 via-amber-500/30 to-orange-600/35 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] hover:from-amber-400/45 hover:via-amber-500/40 hover:to-orange-600/45 active:scale-[0.99]'
        )}
        animate={{ scale: mainCompleted ? 0.98 : 1 }}
        whileHover={!mainCompleted && !disabled ? { scale: 1.01 } : undefined}
        whileTap={!mainCompleted && !disabled ? { scale: 0.99 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        aria-label={`${main.label}, +${main.reward} кр`}
      >
        {mainCompleted && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Check className="h-7 w-7 text-emerald-400/90 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" strokeWidth={2.5} />
          </span>
        )}
        <span className={cn('relative z-0 flex items-center gap-2', mainCompleted && 'opacity-0')}>
          <span aria-hidden>{main.emoji}</span>
          <span>{main.label.toUpperCase()}</span>
          <span className="font-mono tabular-nums">+{main.reward}</span>
        </span>
      </motion.button>

      {/* Row 2: Модификаторы — как физические переключатели (объёмная рамка, вдавленность при нажатии). */}
      <div className="flex border-t-0">
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
                'flex-1 min-h-[44px] rounded-none border-r-2 last:border-r-0 font-gaming text-xs font-bold tabular-nums transition touch-manipulation flex items-center justify-center gap-1.5',
                modCompleted
                  ? 'bg-slate-800/70 text-slate-500 opacity-60 grayscale cursor-default border-slate-600/50 shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] border-b-0'
                  : 'bg-amber-700/40 text-amber-200 border-amber-800/80 border-b-4 border-r-amber-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_3px_0_rgba(0,0,0,0.25)] hover:bg-amber-700/50 active:border-b-[2px] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)] active:translate-y-[2px]'
              )}
              whileTap={!modCompleted && !disabled ? { scale: 0.98 } : undefined}
              aria-pressed={modCompleted}
            >
              <span className="shrink-0" aria-hidden>
                {mod.emoji}
              </span>
              <span className="truncate">{mod.label}</span>
              <span className="tabular-nums">+{mod.reward}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
