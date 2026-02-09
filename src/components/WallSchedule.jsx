import { cn } from '@/lib/utils'

/**
 * Full-week timetable. Keys 1 (Mon) .. 5 (Fri).
 * Roma: 1-я смена 08:00, 5 lessons/day. Kirill: 2-я смена 13:20, 4 lessons/day.
 */
const WEEKLY_SCHEDULE = {
  1: {
    roma: ['Алгебра', 'Русский', 'Физра', 'Английский', 'Физика'],
    kirill: ['Окр. мир', 'Матем', 'Чтение', 'ИЗО'],
  },
  2: {
    roma: ['Русский', 'Алгебра', 'Литература', 'Физра', 'Английский'],
    kirill: ['Матем', 'Окр. мир', 'Чтение', 'ИЗО'],
  },
  3: {
    roma: ['Физика', 'Алгебра', 'Русский', 'Английский', 'Физра'],
    kirill: ['Чтение', 'Матем', 'Окр. мир', 'ИЗО'],
  },
  4: {
    roma: ['Английский', 'Русский', 'Алгебра', 'Литература', 'Физика'],
    kirill: ['ИЗО', 'Матем', 'Чтение', 'Окр. мир'],
  },
  5: {
    roma: ['Литература', 'Алгебра', 'Русский', 'Английский', 'Физра'],
    kirill: ['Окр. мир', 'Матем', 'Чтение', 'ИЗО'],
  },
}

const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ']
const MAX_ROWS = 5

function SchedulePanel({ title, accent, scheduleByDay, currentDay }) {
  const isPurple = accent === 'purple'
  const headerBg = isPurple ? 'bg-purple-600/30' : 'bg-cyan-600/30'
  const headerBorder = isPurple ? 'border-purple-500/50' : 'border-cyan-500/50'
  const headerText = isPurple ? 'text-purple-200' : 'text-cyan-200'

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden flex flex-col min-w-0',
        isPurple ? 'border-purple-500/40 bg-slate-900/70' : 'border-cyan-500/40 bg-slate-900/70'
      )}
    >
      <h3
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 border-b border-slate-600/60',
          headerBg,
          headerText
        )}
      >
        {title}
      </h3>
      <div className="px-2 pb-2 pt-1">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5].map((dayNum, index) => {
            const lessons = scheduleByDay[dayNum] ?? []
            const isToday = currentDay === dayNum
            return (
              <div
                key={dayNum}
                className="flex flex-col gap-1 min-w-0"
              >
                <div
                  className={cn(
                    'rounded-md px-1.5 py-1 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-center border border-slate-600/60',
                    isToday
                      ? isPurple
                        ? 'bg-purple-500/40 text-purple-50 border-purple-400/70'
                        : 'bg-cyan-500/40 text-cyan-50 border-cyan-400/70'
                      : 'bg-slate-800/80 text-slate-300'
                  )}
                >
                  {DAY_LABELS[index]}
                </div>
                <div className="flex flex-col gap-0.5">
                  {lessons.map((lesson, i) => (
                    <div
                      key={`${dayNum}-${i}`}
                      className="rounded-md bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] leading-tight text-slate-100 break-words"
                    >
                      {lesson}
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <div className="rounded-md bg-slate-900/60 border border-dashed border-slate-700/60 px-1.5 py-1 font-mono text-[9px] text-slate-500 text-center">
                      —
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function WallSchedule() {
  const today = new Date().getDay()
  const currentDay = today >= 1 && today <= 5 ? today : null

  const romaByDay = {}
  const kirillByDay = {}
  for (let d = 1; d <= 5; d++) {
    romaByDay[d] = WEEKLY_SCHEDULE[d].roma
    kirillByDay[d] = WEEKLY_SCHEDULE[d].kirill
  }

  return (
    <section
      className="wall-schedule shrink-0 w-full rounded-xl bg-slate-900 border border-slate-700/60 px-4 py-4"
      aria-label="Расписание на неделю"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
        <SchedulePanel
          title="РАСПИСАНИЕ: КИРИЛЛ (2-я смена 13:20)"
          accent="purple"
          scheduleByDay={kirillByDay}
          currentDay={currentDay}
        />
        <SchedulePanel
          title="РАСПИСАНИЕ: РОМА (1-я смена 08:00)"
          accent="cyan"
          scheduleByDay={romaByDay}
          currentDay={currentDay}
        />
      </div>
    </section>
  )
}
