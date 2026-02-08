import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Static weekly schedule. Keys: 1 (Mon) .. 5 (Fri).
 * Roma: 1-я смена 08:00, 5–6 lessons. Kirill: 2-я смена 13:20, 4–5 lessons.
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
    roma: ['Английский', 'Русский', 'Алгебра', 'Литература', 'Физика', 'Физра'],
    kirill: ['ИЗО', 'Матем', 'Чтение', 'Окр. мир'],
  },
  5: {
    roma: ['Литература', 'Алгебра', 'Русский', 'Английский', 'Физра'],
    kirill: ['Окр. мир', 'Матем', 'Чтение', 'ИЗО', 'Физра'],
  },
}

const TAB_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ']

function LessonList({ items, accent }) {
  return (
    <ul className="space-y-0">
      {items.map((name, i) => (
        <li
          key={i}
          className={cn(
            'py-1 px-1.5 font-mono text-[10px] sm:text-xs truncate',
            i % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-800/30',
            accent === 'purple' && 'text-slate-300',
            accent === 'cyan' && 'text-slate-300'
          )}
        >
          {name}
        </li>
      ))}
    </ul>
  )
}

export function SchoolWidget() {
  const [selectedDay, setSelectedDay] = useState(1)

  useEffect(() => {
    const day = new Date().getDay()
    if (day >= 1 && day <= 5) setSelectedDay(day)
    else setSelectedDay(1)
  }, [])

  const daySchedule = WEEKLY_SCHEDULE[selectedDay]

  return (
    <section
      className="school-widget shrink-0 rounded-xl border border-slate-600/60 bg-slate-800/50 overflow-hidden h-48 flex flex-col"
      aria-label="Расписание на неделю"
    >
      <div className="flex gap-0.5 px-2 py-1.5 border-b border-slate-600/50 shrink-0">
        {TAB_LABELS.map((label, i) => {
          const dayNum = i + 1
          const isActive = selectedDay === dayNum
          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              className={cn(
                'min-h-[28px] flex-1 min-w-0 rounded px-1 py-1 font-mono text-[10px] font-bold transition touch-manipulation',
                isActive
                  ? 'bg-cyan-500/40 text-cyan-100 border border-cyan-400/60'
                  : 'bg-slate-700/40 text-slate-500 border border-transparent hover:text-slate-400'
              )}
              aria-pressed={isActive}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-px flex-1 min-h-0 overflow-hidden bg-slate-600/40">
        <div className="flex flex-col min-w-0 bg-slate-900/60 overflow-hidden">
          <p className="font-mono text-[9px] text-purple-400/90 uppercase tracking-wider px-2 py-1 border-b border-slate-600/50 shrink-0">
            2-я Смена (13:20)
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {daySchedule?.kirill?.length ? (
              <LessonList items={daySchedule.kirill} accent="purple" />
            ) : (
              <p className="py-1 px-2 font-mono text-[10px] text-slate-500">—</p>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-0 bg-slate-900/60 overflow-hidden">
          <p className="font-mono text-[9px] text-cyan-400/90 uppercase tracking-wider px-2 py-1 border-b border-slate-600/50 shrink-0">
            1-я Смена (08:00)
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {daySchedule?.roma?.length ? (
              <LessonList items={daySchedule.roma} accent="cyan" />
            ) : (
              <p className="py-1 px-2 font-mono text-[10px] text-slate-500">—</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
