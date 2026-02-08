import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'

const WEEKDAY_CONFIG = [
  { label: 'ПН', short: 'Пн', name: 'Понедельник', type: 'budni', emoji: '📚' },
  { label: 'ВТ', short: 'Вт', name: 'Вторник', type: 'budni', emoji: '📚' },
  { label: 'СР', short: 'Ср', name: 'Среда', type: 'budni', emoji: '📚' },
  { label: 'ЧТ', short: 'Чт', name: 'Четверг', type: 'budni', emoji: '📚' },
  { label: 'ПТ', short: 'Пт', name: 'Пятница', type: 'budni', emoji: '📚' },
  { label: 'СБ', short: 'Сб', name: 'Суббота', type: 'weekend', emoji: '🎮' },
  { label: 'ВС', short: 'Вс', name: 'Воскресенье', type: 'weekend', emoji: '🏖' },
]

/** Норма: 1 час в будни. До 45 мин — зелёный, 45–60 — жёлтый, 60+ — красный (×2 списание). */
const FUSE_LIMIT_MIN = 60
const FUSE_WARN_MIN = 45
const FUSE_DISPLAY_MAX = 90

/**
 * Фитилёк: прогресс 0–60 мин (норма), 60+ (перебор).
 * 0–45 зелёный, 45–60 жёлтый, 60+ красный.
 */
function DayFuse({ minutes }) {
  const capped = Math.min(minutes, FUSE_DISPLAY_MAX)
  const fillPct = (capped / FUSE_DISPLAY_MAX) * 100
  const total = Math.max(1, minutes)
  const greenPct = (Math.min(FUSE_WARN_MIN, minutes) / total) * 100
  const yellowPct = (Math.max(0, Math.min(FUSE_LIMIT_MIN, minutes) - FUSE_WARN_MIN) / total) * 100
  const redPct = (Math.max(0, minutes - FUSE_LIMIT_MIN) / total) * 100
  const zone =
    minutes <= FUSE_WARN_MIN ? 'ok' : minutes <= FUSE_LIMIT_MIN ? 'warn' : 'over'

  return (
    <div className="w-full mt-1.5 space-y-0.5">
      <div
        className="h-2.5 rounded-full overflow-hidden border-2 border-slate-600/60 bg-slate-900/80"
        role="progressbar"
        aria-valuenow={minutes}
        aria-valuemin={0}
        aria-valuemax={FUSE_DISPLAY_MAX}
        aria-label={`Игры сегодня: ${minutes} мин. Норма 1 ч.`}
      >
        <div
          className="h-full rounded-full min-w-[6px] transition-[width] duration-500 ease-out flex"
          style={{ width: `${fillPct}%` }}
        >
          {minutes > 0 && greenPct > 0 && (
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              style={{ width: `${greenPct}%`, minWidth: 4 }}
            />
          )}
          {yellowPct > 0 && (
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              style={{ width: `${yellowPct}%`, minWidth: 4 }}
            />
          )}
          {redPct > 0 && (
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              style={{ width: `${redPct}%`, minWidth: 4 }}
            />
          )}
        </div>
      </div>
      <div className="flex justify-between items-center text-[10px]">
        <span className="font-mono text-slate-500 tabular-nums">
          {minutes} мин
        </span>
        <span
          className={cn(
            'font-gaming uppercase',
            zone === 'ok' && 'text-emerald-400',
            zone === 'warn' && 'text-amber-400',
            zone === 'over' && 'text-red-400 font-bold'
          )}
        >
          {zone === 'ok' && 'норма'}
          {zone === 'warn' && 'скоро лимит'}
          {zone === 'over' && '×2 списание'}
        </span>
      </div>
    </div>
  )
}

/**
 * Week Progress Bar — по-детски и познавательно.
 * Дни недели с подсказкой «Будни»/«Выходной», у сегодня — фитилёк (0–60 зелёный, 45–60 жёлтый, 60+ красный).
 */
export function WeekProgressBar() {
  const getDisplayMinutesToday = useAppStore((s) => s.getDisplayMinutesToday)
  const today = new Date()
  const dayIndex = today.getDay()
  const currentWeekdayIndex = dayIndex === 0 ? 6 : dayIndex - 1
  const minutesToday = getDisplayMinutesToday()

  return (
    <div className="shrink-0 px-3 py-4">
      <p className="font-gaming text-[10px] text-cyan-400/90 uppercase tracking-wider mb-2 text-center">
        🗓 Неделя · 1 ч в будни — норма, дальше ×2
      </p>
      <div className="flex items-stretch gap-1.5 sm:gap-2">
        {WEEKDAY_CONFIG.map((day, i) => {
          const isPast = i < currentWeekdayIndex
          const isCurrent = i === currentWeekdayIndex
          const isFuture = i > currentWeekdayIndex

          return (
            <motion.div
              key={day.label}
              className={cn(
                'flex flex-1 flex-col min-w-0 max-w-[56px] sm:max-w-[72px] rounded-2xl border-[3px] p-2 transition-colors',
                isPast &&
                  'border-slate-700 bg-slate-800/50 text-slate-500 opacity-70',
                isCurrent &&
                  'border-cyan-500 bg-slate-800/90 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.4)]',
                isFuture && 'border-slate-600 bg-slate-900/50 text-slate-500'
              )}
              animate={
                isCurrent
                  ? {
                      boxShadow: [
                        '0 0 20px rgba(34,211,238,0.4)',
                        '0 0 28px rgba(34,211,238,0.55)',
                        '0 0 20px rgba(34,211,238,0.4)',
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
              aria-current={isCurrent ? 'date' : undefined}
              aria-label={
                isPast
                  ? `${day.name} — прошло`
                  : isCurrent
                    ? `${day.name} — сегодня`
                    : `${day.name} — ещё будет`
              }
            >
              <span
                className="text-base sm:text-lg leading-none"
                aria-hidden
              >
                {day.emoji}
              </span>
              <span className="font-gaming text-xs sm:text-sm font-bold uppercase tracking-wider mt-0.5 truncate">
                {day.label}
              </span>
              <span
                className={cn(
                  'font-mono text-[9px] uppercase mt-0.5',
                  day.type === 'weekend' ? 'text-emerald-400/80' : 'text-slate-500'
                )}
              >
                {day.type === 'weekend' ? 'Выходной' : 'Будни'}
              </span>
              {isCurrent && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-600/50">
                  <DayFuse minutes={minutesToday} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
