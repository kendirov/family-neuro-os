/**
 * SmartSchedule — горизонтальная неделя с фокусом на текущий день.
 * 7 блоков (ПН–ВС). Текущий день расширен + glow + предметы.
 * Остальные — компактные dim-кнопки.
 * 2026 terminal aesthetics.
 */
import { useMemo } from 'react'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { getDayLabelShort } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

/** Порядок отображения: ПН, ВТ, СР, ЧТ, ПТ, СБ, ВС. getDay(): 0=ВС, 1=ПН...6=СБ */
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun

const SCHEDULE_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function SmartSchedule() {
  const schedule = useScheduleStore((s) => s.schedule)
  const today = useMemo(() => new Date().getDay(), [])

  const days = useMemo(() => {
    return DISPLAY_ORDER.map((dayOfWeek, idx) => {
      const isToday = dayOfWeek === today
      const key = SCHEDULE_KEYS[idx]
      const dayData = schedule[key]
      const subjects = dayData
        ? [...new Set([
            ...(dayData.roma?.map((s) => s.subject) ?? []),
            ...(dayData.kirill?.map((s) => s.subject) ?? []),
          ])]
        : []
      return {
        dayOfWeek,
        label: getDayLabelShort(dayOfWeek),
        isToday,
        subjects,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      }
    })
  }, [today, schedule])

  return (
    <div
      className="flex gap-1 sm:gap-2 w-full overflow-x-auto pb-1 px-4"
      role="tablist"
      aria-label="Расписание на неделю"
    >
      {days.map((d) => (
        <div
          key={d.dayOfWeek}
          className={cn(
            'flex flex-col shrink-0 rounded-xl border transition-all duration-300',
            d.isToday
              ? 'flex-grow min-w-[140px] sm:min-w-[200px] ring-2 ring-cyan-500/80 bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
              : 'w-10 h-10 sm:w-12 sm:h-12 bg-white/5 border-white/5 text-slate-500'
          )}
          role="tab"
          aria-selected={d.isToday}
        >
          {d.isToday ? (
            <>
              <div className="px-3 py-2 border-b border-cyan-500/20">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/90">
                  {d.label}
                </span>
              </div>
              <div className="flex-1 px-3 py-2 min-h-[44px]">
                {d.isWeekend ? (
                  <span className="font-mono text-xs text-slate-500 italic">Выходной</span>
                ) : d.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {d.subjects.map((name) => (
                      <span
                        key={name}
                        className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300/90 border border-cyan-500/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-mono text-xs text-slate-500">—</span>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-[10px] font-medium tabular-nums">
                {d.label}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
