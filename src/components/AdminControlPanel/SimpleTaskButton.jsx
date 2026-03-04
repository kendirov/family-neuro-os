/**
 * SimpleTaskButton — одна кнопка для задач без bonus_reward.
 */
import { motion } from 'framer-motion'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SimpleTaskButton({
  task,
  status,
  onComplete,
  disabled,
  onUndo,
  isGodMode = false,
  className,
}) {
  const completed = status === 'completed'
  const amount = (task.base_reward ?? task.credits ?? 0) || (task.bonus_reward ?? 0)

  const handleClick = (e) => {
    if (completed || disabled) return
    onComplete?.(task, amount, e)
  }

  const handleUndoClick = (e) => {
    e.stopPropagation()
    if (completed && onUndo && isGodMode && !disabled) onUndo(task, e)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick(e)
    }
  }

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex items-center justify-center gap-2 min-h-[44px] px-3 py-2 rounded-xl',
        'border border-white/10 bg-slate-900/40 backdrop-blur-xl',
        'cursor-pointer touch-manipulation',
        completed && 'bg-emerald-500/20 border-emerald-400/40 cursor-default',
        !completed && !disabled && 'hover:bg-slate-800/60 hover:border-white/20',
        className
      )}
      whileTap={!completed && !disabled ? { scale: 0.98 } : undefined}
      aria-pressed={completed}
      aria-label={completed ? `${task.label} — выполнено` : `${task.label} — +${amount} XP`}
    >
      <span className="shrink-0 text-lg leading-none" aria-hidden>
        {task.emoji}
      </span>
      <span
        className={cn(
          'min-w-0 truncate text-sm font-semibold',
          completed ? 'text-emerald-100' : 'text-slate-200'
        )}
      >
        {task.label}
      </span>
      <span
        className={cn(
          'shrink-0 tabular-nums text-xs font-semibold',
          completed ? 'text-emerald-200' : 'text-amber-400/90'
        )}
      >
        +{amount}
      </span>
      {completed && isGodMode && onUndo && !disabled && (
        <button
          type="button"
          onClick={handleUndoClick}
          className="absolute top-1 right-1 z-10 w-6 h-6 rounded flex items-center justify-center bg-red-500/80 text-white hover:bg-red-500 border border-red-400/60 transition"
          aria-label="Отменить"
        >
          <X className="w-3 h-3" strokeWidth={2.5} />
        </button>
      )}
    </motion.div>
  )
}
