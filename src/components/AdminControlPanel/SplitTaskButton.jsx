/**
 * SplitTaskButton — кнопка с двумя действиями.
 * Левая/основная область: base_reward.
 * Правая/иконка: base_reward + bonus_reward (напр. «Съел всё»).
 * Если bonus_reward = 0 — одна кнопка (только base).
 */
import { motion } from 'framer-motion'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SplitTaskButton({
  task,
  status,
  onBaseComplete,
  onBonusComplete,
  disabled,
  accentColor,
  onUndo,
  isGodMode = false,
  className,
}) {
  const completed = status === 'completed'
  const hasBonus = (task.bonus_reward ?? 0) > 0
  const baseAmount = task.base_reward ?? task.credits ?? 0
  const bonusAmount = task.bonus_reward ?? 0
  const totalAmount = baseAmount + bonusAmount

  const handleMainClick = (e) => {
    if (completed || disabled) return
    e.stopPropagation()
    onBaseComplete?.(task, baseAmount, false, e)
  }

  const handleBonusClick = (e) => {
    if (completed || disabled) return
    e.stopPropagation()
    if (hasBonus) {
      onBonusComplete?.(task, totalAmount, true, e)
    } else {
      onBaseComplete?.(task, baseAmount, false, e)
    }
  }

  const handleUndoClick = (e) => {
    e.stopPropagation()
    if (completed && onUndo && isGodMode && !disabled) onUndo(task, e)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleMainClick(e)
    }
  }

  const isCyan = accentColor === 'cyan'

  return (
    <motion.div
      className={cn(
        'relative flex items-stretch min-h-[44px] rounded-xl border border-white/10 overflow-hidden',
        'bg-slate-900/40 backdrop-blur-xl',
        completed && 'bg-emerald-500/20 border-emerald-400/40',
        !completed && 'hover:bg-slate-800/60 hover:border-white/20',
        className
      )}
      whileTap={!completed && !disabled ? { scale: 0.98 } : undefined}
    >
      {/* Основная область — base_reward */}
      <motion.div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleMainClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 min-w-0 cursor-pointer touch-manipulation',
          completed && 'cursor-default'
        )}
        aria-pressed={completed}
        aria-label={completed ? `${task.label} — выполнено` : `${task.label} — +${baseAmount} XP`}
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
          +{baseAmount}
        </span>
      </motion.div>

      {/* Правая область — bonus (если есть) */}
      {hasBonus && (
        <>
          <div className="w-px bg-white/10 shrink-0" aria-hidden />
          <motion.button
            type="button"
            onClick={handleBonusClick}
            disabled={completed || disabled}
            className={cn(
              'shrink-0 w-12 flex flex-col items-center justify-center gap-0 px-2 py-1.5',
              'border-l border-white/10 bg-amber-500/15 hover:bg-amber-500/25',
              'text-amber-300 text-[10px] font-bold tabular-nums touch-manipulation transition',
              (completed || disabled) && 'opacity-50 cursor-default'
            )}
            aria-label={`${task.label} — бонус +${totalAmount} XP`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span>+{totalAmount}</span>
          </motion.button>
        </>
      )}

      {/* Undo — только в god mode */}
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
