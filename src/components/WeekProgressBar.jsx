import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

/**
 * Week Progress Bar — Level Select aesthetic.
 * 7 blocks Mon–Sun. Past: dimmed. Current: highlighted + pulsing. Future: outlined (locked).
 */
export function WeekProgressBar() {
  const today = new Date()
  const dayIndex = today.getDay()
  const currentWeekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1

  return (
    <div className="shrink-0 px-4 py-3">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((label, i) => {
          const isPast = i < currentWeekdayIndex
          const isCurrent = i === currentWeekdayIndex
          const isFuture = i > currentWeekdayIndex

          return (
            <motion.div
              key={label}
              className={cn(
                'flex flex-1 min-w-0 max-w-[52px] sm:max-w-[64px] aspect-square rounded-2xl border-[3px] flex items-center justify-center font-gaming text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors text-pop',
                isPast &&
                  'border-slate-700 bg-slate-800/60 text-slate-500 opacity-60',
                isCurrent &&
                  'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.5)]',
                isFuture &&
                  'border-slate-600 bg-slate-900/40 text-slate-500'
              )}
              animate={
                isCurrent
                  ? {
                      boxShadow: [
                        '0 0 16px rgba(34,211,238,0.5)',
                        '0 0 24px rgba(34,211,238,0.7)',
                        '0 0 16px rgba(34,211,238,0.5)',
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              aria-current={isCurrent ? 'date' : undefined}
              aria-label={
                isPast
                  ? `${label} — пройден`
                  : isCurrent
                    ? `${label} — сегодня`
                    : `${label} — заблокирован`
              }
            >
              <span className="truncate">{label}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
