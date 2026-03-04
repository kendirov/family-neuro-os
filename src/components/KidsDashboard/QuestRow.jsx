/**
 * QuestRow — горизонтальная строка задачи в QuestTimeline.
 * Layout: [Emoji Container] → [Checkmark?] → [Title] → [+X Points Badge]
 * PENDING: dormant, muted. COMPLETED: gradient, neon badge, animated checkmark.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * @param {Object} props
 * @param {Object} props.task - { id, emoji, title, reward, description }
 * @param {boolean} props.isDone
 */
export function QuestRow({ task, isDone }) {
  return (
    <div
      className={cn(
        'group relative flex items-center w-full min-h-[44px] gap-3 py-2 rounded-lg px-2 -mx-2',
        'transition-all duration-300 ease-out',
        isDone
          ? 'bg-gradient-to-r from-emerald-500/10 to-transparent'
          : 'bg-transparent hover:bg-slate-800/20'
      )}
      role="listitem"
      aria-label={isDone ? `Выполнено: ${task.title}` : `Ожидает: ${task.title}`}
    >
      {/* Emoji Container — PENDING: desaturated/low opacity, COMPLETED: full opacity */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 shrink-0 rounded-lg transition-all duration-300 ease-out',
          isDone ? 'opacity-100' : 'opacity-60 saturate-50'
        )}
      >
        <span className="text-xl">{task.emoji}</span>
      </div>

      {/* Checkmark — анимируется при completed (fade + scale) */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="shrink-0"
          >
            <Check
              className="w-5 h-5 text-emerald-400"
              strokeWidth={2.5}
              style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.6))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title — PENDING: text-slate-400, COMPLETED: text-slate-50 */}
      <span
        className={cn(
          'flex-1 min-w-0 truncate font-medium text-sm transition-colors duration-300 ease-out',
          isDone ? 'text-slate-50' : 'text-slate-400'
        )}
      >
        {task.title}
      </span>

      {/* Points Badge — PENDING: muted, COMPLETED: neon glow */}
      <span
        className={cn(
          'shrink-0 tabular-nums font-mono text-sm font-medium px-2 py-1 rounded-md transition-all duration-300 ease-out',
          isDone
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            : 'bg-slate-800/40 text-slate-500 border border-slate-700/40'
        )}
      >
        +{task.reward} ⚡
      </span>

      {/* Tooltip — glassmorphism, group-hover */}
      <div
        className={cn(
          'absolute left-0 top-full mt-2 z-20',
          'px-3 py-2.5 rounded-lg',
          'bg-white/10 backdrop-blur-md border border-white/5',
          'text-sm font-medium text-slate-300 leading-relaxed',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-all duration-300 ease-out',
          'shadow-xl shadow-black/30',
          'max-w-[min(280px,90vw)] whitespace-normal'
        )}
      >
        {task.description}
      </div>
    </div>
  )
}
