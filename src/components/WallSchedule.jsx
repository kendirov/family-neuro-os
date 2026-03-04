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
  const headerText = isPurple ? 'text-purple-200' : 'text-cyan-200'

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden flex flex-col min-w-0 bg-white/5 backdrop-blur-xl border-white/10',
        isPurple ? 'shadow-[0_0_0_1px_rgba(168,85,247,0.2)]' : 'shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
      )}
    >
      <h3
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 border-b border-white/10 bg-white/5',
          headerText
        )}
      >
        {title}
      </h3>
      <div className="px-2 pb-2 pt-1 overflow-x-auto">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
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
                    'rounded-md px-2 py-1.5 font-mono text-sm font-bold uppercase tracking-wide text-center border border-white/10',
                    isToday
                      ? isPurple
                        ? 'bg-purple-500/20 text-purple-50 border-purple-400/50'
                        : 'bg-cyan-500/20 text-cyan-50 border-cyan-400/50'
                      : 'bg-white/5 text-slate-400'
                  )}
                >
                  {DAY_LABELS[index]}
                </div>
                <div className="flex flex-col gap-0.5">
                  {lessons.map((lesson, i) => (
                    <div
                      key={`${dayNum}-${i}`}
                      className={cn(
                        'rounded-md border border-white/10 px-2 py-1 font-mono text-xs leading-tight text-white break-words tracking-wide',
                        i % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.03]'
                      )}
                    >
                      {lesson}
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <div className="rounded-md bg-white/5 border border-dashed border-white/10 px-2 py-1 font-mono text-xs text-slate-500 text-center">
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
      className="wall-schedule shrink-0 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-4 overflow-x-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]"
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
