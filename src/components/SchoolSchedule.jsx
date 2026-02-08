import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WEEKLY_SCHEDULE, DAY_KEYS, DAY_LABELS, getScheduleKey } from '@/data/weeklySchedule'

/** "HH:mm" -> minutes since midnight */
function timeToMinutes(str) {
  const [h, m] = str.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function isCurrentLesson(now, start, end) {
  const mins = now.getHours() * 60 + now.getMinutes()
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)
  return mins >= s && mins < e
}

function isPastLesson(now, end) {
  const mins = now.getHours() * 60 + now.getMinutes()
  return mins >= timeToMinutes(end)
}

function ScheduleColumn({ title, accent, lessons, now, isWeekend }) {
  if (isWeekend) {
    return (
      <div
        className={cn(
          'schedule-column flex flex-col rounded-xl border overflow-hidden',
          accent === 'purple' && 'border-purple-500/40',
          accent === 'cyan' && 'border-cyan-500/40'
        )}
      >
        <div
          className={cn(
            'schedule-header px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest',
            accent === 'purple' && 'bg-purple-500/20 text-purple-300 border-b border-purple-500/30',
            accent === 'cyan' && 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-500/30'
          )}
        >
          {title}
        </div>
        <div className="schedule-body flex-1 flex items-center justify-center px-3 py-8 bg-slate-900/30">
          <p className="font-gaming text-sm text-slate-400 text-center">
            ВЫХОДНОЙ! Уроков нет 🎮
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'schedule-column flex flex-col rounded-xl border overflow-hidden',
        accent === 'purple' && 'border-purple-500/40',
        accent === 'cyan' && 'border-cyan-500/40'
      )}
    >
      <div
        className={cn(
          'schedule-header px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest',
          accent === 'purple' && 'bg-purple-500/20 text-purple-300 border-b border-purple-500/30',
          accent === 'cyan' && 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-500/30'
        )}
      >
        {title}
      </div>
      <div className="schedule-body min-h-0 flex-1 bg-slate-900/30">
        <ul className="divide-y divide-slate-700/50" role="list">
          {lessons.map((lesson, i) => {
            const current = isCurrentLesson(now, lesson.start, lesson.end)
            const past = isPastLesson(now, lesson.end)
            return (
              <li
                key={i}
                className={cn(
                  'schedule-row flex items-center gap-3 px-3 py-2.5 transition-colors border-l-2',
                  past && 'opacity-50 border-transparent',
                  current && accent === 'purple' && 'bg-purple-500/15 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
                  current && accent === 'cyan' && 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
                  !current && !past && 'border-transparent'
                )}
                aria-current={current ? 'time' : undefined}
              >
                <span className="font-mono text-[10px] tabular-nums text-slate-500 shrink-0 w-11">
                  {lesson.start}
                </span>
                <span className="text-slate-400 font-mono" aria-hidden>—</span>
                <span
                  className={cn(
                    'font-sans-data text-sm flex-1 min-w-0',
                    current ? 'font-semibold text-slate-100' : 'text-slate-300'
                  )}
                >
                  {lesson.name}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function SchoolSchedule() {
  const [now, setNow] = useState(() => new Date())
  const todayWeekday = now.getDay()
  const isWeekend = todayWeekday === 0 || todayWeekday === 6
  const defaultSelected = todayWeekday >= 1 && todayWeekday <= 5 ? todayWeekday : 1
  const [selectedDay, setSelectedDay] = useState(defaultSelected)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const scheduleKey = getScheduleKey(selectedDay)
  const daySchedule = scheduleKey ? WEEKLY_SCHEDULE[scheduleKey] : null
  const romaLessons = daySchedule?.roma ?? []
  const kirillLessons = daySchedule?.kirill ?? []

  return (
    <section
      className="school-schedule shrink-0 flex flex-col gap-3 px-4 py-3 md:px-6"
      aria-label="Расписание на неделю"
    >
      {/* Day navigator: ПН … ПТ */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DAY_KEYS.map((_, i) => {
          const dayNum = i + 1
          const isSelected = selectedDay === dayNum
          const isToday = todayWeekday === dayNum
          return (
            <button
              key={DAY_KEYS[i]}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              className={cn(
                'min-h-[40px] min-w-[44px] px-3 py-2 rounded-lg font-mono text-xs font-bold tabular-nums transition touch-manipulation',
                isSelected && 'bg-cyan-500/25 text-cyan-200 border-2 border-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
                !isSelected && 'bg-slate-800/60 text-slate-400 border-2 border-slate-600/60 hover:bg-slate-700/60 hover:text-slate-300',
                isToday && !isSelected && 'ring-1 ring-cyan-400/40'
              )}
              aria-pressed={isSelected}
              aria-label={`${DAY_LABELS[i]}, ${isToday ? 'сегодня' : ''}`}
            >
              {DAY_LABELS[i]}
            </button>
          )
        })}
      </div>

      {/* Split view: Left = Kirill (2-я смена), Right = Roma (1-я смена) */}
      <div className="grid grid-cols-2 gap-3 min-h-0">
        <ScheduleColumn
          title="2-я Смена (13:20)"
          accent="purple"
          lessons={kirillLessons}
          now={now}
          isWeekend={isWeekend}
        />
        <ScheduleColumn
          title="1-я Смена (08:00)"
          accent="cyan"
          lessons={romaLessons}
          now={now}
          isWeekend={isWeekend}
        />
      </div>
    </section>
  )
}
