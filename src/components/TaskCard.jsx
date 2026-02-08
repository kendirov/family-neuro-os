import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mission Card: strict To-Do vs Done HUD states.
 * To-Do: Bright border (cyan/purple), glow, 3D shadow, subtle float.
 * Done: opacity 0.5, grayscale, massive stamp overlay, inset (sunk) shadow.
 * Transition: on complete → scale 0.98, flash white, then settle.
 */
export function TaskCard({
  id,
  label,
  reward,
  icon,
  status,
  disabled,
  variant = 'default',
  accentColor,
  onComplete,
  className,
}) {
  const isCompleted = status === 'completed'
  const isPending = status === 'pending'

  const [showCompleteFlash, setShowCompleteFlash] = useState(false)
  const wasCompletedRef = useRef(false)

  useEffect(() => {
    if (isCompleted && !wasCompletedRef.current) {
      wasCompletedRef.current = true
      setShowCompleteFlash(true)
      const t = setTimeout(() => setShowCompleteFlash(false), 280)
      return () => clearTimeout(t)
    }
    if (!isCompleted) wasCompletedRef.current = false
  }, [isCompleted])

  const handleClick = (e) => {
    if (isCompleted || disabled) return
    onComplete?.(e)
  }

  const borderColorClass =
    accentColor === 'purple'
      ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35),0_4px_12px_rgba(0,0,0,0.3)]'
      : accentColor === 'cyan'
        ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35),0_4px_12px_rgba(0,0,0,0.3)]'
        : variant === 'food'
          ? 'border-amber-500/60 shadow-[0_0_16px_rgba(251,191,36,0.25),0_4px_12px_rgba(0,0,0,0.3)]'
          : variant === 'morning'
            ? 'border-cyan-500/60 shadow-[0_0_16px_rgba(34,211,238,0.3),0_4px_12px_rgba(0,0,0,0.3)]'
            : 'border-emerald-500/60 shadow-[0_0_16px_rgba(52,211,153,0.25),0_4px_12px_rgba(0,0,0,0.3)]'

  const bgActiveClass =
    accentColor === 'purple'
      ? 'bg-purple-500/15 hover:bg-purple-500/25'
      : accentColor === 'cyan'
        ? 'bg-cyan-500/15 hover:bg-cyan-500/25'
        : variant === 'food'
          ? 'bg-amber-500/10 hover:bg-amber-500/20'
          : variant === 'morning'
            ? 'bg-cyan-500/10 hover:bg-cyan-500/20'
            : 'bg-emerald-500/10 hover:bg-emerald-500/20'

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isCompleted || disabled}
      className={cn(
        'relative flex items-center justify-between gap-2 w-full min-h-[52px] px-4 py-3 rounded-2xl border-[3px] text-left touch-manipulation select-none overflow-hidden',
        !isCompleted && !disabled && 'cursor-pointer',
        isCompleted && 'cursor-default',
        isPending && !disabled && borderColorClass,
        isPending && !disabled && bgActiveClass,
        isCompleted &&
          'opacity-50 grayscale border-slate-600/40 bg-slate-800/50 shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)]',
        className
      )}
      initial={false}
      animate={{
        scale: isCompleted ? 0.98 : 1,
        boxShadow: isCompleted
          ? 'inset 0 4px 12px rgba(0,0,0,0.4)'
          : undefined,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 28, scale: { duration: 0.15 } }}
      whileHover={
        !isCompleted && !disabled
          ? {
              scale: 1.02,
              y: -1,
              boxShadow:
                accentColor === 'purple'
                  ? '0 0 24px rgba(168,85,247,0.45), 0 6px 16px rgba(0,0,0,0.35)'
                  : accentColor === 'cyan'
                    ? '0 0 24px rgba(34,211,238,0.45), 0 6px 16px rgba(0,0,0,0.35)'
                    : '0 6px 16px rgba(0,0,0,0.35)',
            }
          : undefined
      }
      whileTap={!isCompleted && !disabled ? { scale: 0.98 } : undefined}
      aria-pressed={isCompleted}
      aria-label={isCompleted ? `${label} — выполнено` : `${label} — +${reward} кр`}
    >
      {/* Completion flash overlay (only on transition to done) */}
      {showCompleteFlash && (
        <motion.span
          className="absolute inset-0 bg-white pointer-events-none z-10 rounded-2xl"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden
        />
      )}

      {/* Left: Icon + Task name */}
      <div className="flex items-center gap-2 min-w-0 flex-1 relative z-0">
        <span className="text-lg shrink-0" aria-hidden>
          {icon}
        </span>
        <span
          className={cn(
            'font-gaming text-base font-bold truncate text-pop',
            isCompleted ? 'text-slate-500' : 'text-slate-200'
          )}
        >
          {label}
        </span>
      </div>

      {/* Right: Reward badge */}
      <span
        className={cn(
          'shrink-0 font-gaming text-sm font-extrabold tabular-nums px-3 py-1 rounded-xl border-2 relative z-0 text-pop',
          isCompleted
            ? 'border-slate-600/50 text-slate-500 bg-slate-800/60'
            : 'border-amber-500/40 text-amber-300 bg-amber-500/20'
        )}
      >
        +{reward} кр
      </span>

      {/* Done: massive stamped overlay */}
      {isCompleted && (
        <motion.span
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          initial={{ scale: 1.1, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          aria-hidden
        >
          <span
            className="flex flex-col items-center justify-center gap-0.5 text-emerald-400/95 drop-shadow-[0_0_8px_rgba(52,211,153,0.8),0_2px_4px_rgba(0,0,0,0.5)]"
            style={{ textShadow: '0 0 12px rgba(52,211,153,0.9), 0 2px 6px rgba(0,0,0,0.6)' }}
          >
            <Check className="h-10 w-10 sm:h-12 sm:w-12 stroke-[3]" strokeWidth={3} />
            <span className="font-gaming text-[10px] sm:text-xs uppercase tracking-widest text-emerald-300/90">
              Миссия выполнена
            </span>
          </span>
        </motion.span>
      )}

      {/* Subtle inner glow pulse when active */}
      {isPending && !disabled && (
        <motion.span
          className="absolute inset-0 rounded-2xl pointer-events-none z-0"
          aria-hidden
          animate={{
            boxShadow: [
              'inset 0 0 20px rgba(255,255,255,0.02)',
              'inset 0 0 28px rgba(255,255,255,0.06)',
              'inset 0 0 20px rgba(255,255,255,0.02)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  )
}
