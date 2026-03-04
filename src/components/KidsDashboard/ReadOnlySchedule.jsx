/**
 * ReadOnlySchedule — расписание на неделю для одного ребёнка.
 * Клон визуала Admin (WallSchedule): glassmorphism, активный день, подсветка выходных.
 * Строго read-only. UI: русский.
 */
import { cn } from '@/lib/utils'

/** ПН–ПТ: уроки. СБ, ВС: выходной. Keys: 1=ПН .. 5=ПТ, 6=СБ, 0=ВС */
const WEEKLY_SCHEDULE = {
  1: { roma: ['Алгебра', 'Русский', 'Физра', 'Английский', 'Физика'], kirill: ['Окр. мир', 'Матем', 'Чтение', 'ИЗО'] },
  2: { roma: ['Русский', 'Алгебра', 'Литература', 'Физра', 'Английский'], kirill: ['Матем', 'Окр. мир', 'Чтение', 'ИЗО'] },
  3: { roma: ['Физика', 'Алгебра', 'Русский', 'Английский', 'Физра'], kirill: ['Чтение', 'Матем', 'Окр. мир', 'ИЗО'] },
  4: { roma: ['Английский', 'Русский', 'Алгебра', 'Литература', 'Физика'], kirill: ['ИЗО', 'Матем', 'Чтение', 'Окр. мир'] },
  5: { roma: ['Литература', 'Алгебра', 'Русский', 'Английский', 'Физра'], kirill: ['Окр. мир', 'Матем', 'Чтение', 'ИЗО'] },
  6: { roma: [], kirill: [] }, // СБ
  0: { roma: [], kirill: [] }, // ВС
}

const DAY_LABELS = { 1: 'ПН', 2: 'ВТ', 3: 'СР', 4: 'ЧТ', 5: 'ПТ', 6: 'СБ', 0: 'ВС' }
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const TITLES = {
  roma: 'РАСПИСАНИЕ: РОМА (1-я смена 08:00)',
  kirill: 'РАСПИСАНИЕ: КИРИЛЛ (2-я смена 13:20)',
}

export function ReadOnlySchedule({ childId, accentColor = 'cyan' }) {
  const today = new Date().getDay()
  const currentDay = today
  const isPurple = accentColor === 'purple'
  const headerText = isPurple ? 'text-purple-200' : 'text-cyan-200'
  const scheduleByDay = {}
  DISPLAY_ORDER.forEach((d) => {
    scheduleByDay[d] = WEEKLY_SCHEDULE[d]?.[childId] ?? []
  })

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden flex flex-col min-w-0',
        'bg-white/5 backdrop-blur-xl border-white/10',
        isPurple
          ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25),0_0_0_1px_rgba(168,85,247,0.2)]'
          : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25),0_0_0_1px_rgba(34,211,238,0.2)]'
      )}
      aria-label="Расписание на неделю"
    >
      <h3
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 border-b border-white/10 bg-white/5',
          headerText
        )}
      >
        {TITLES[childId] ?? 'Расписание'}
      </h3>
      <div className="px-2 pb-2 pt-1 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 min-w-0">
          {DISPLAY_ORDER.map((dayNum) => {
            const lessons = scheduleByDay[dayNum] ?? []
            const isToday = currentDay === dayNum
            const isWeekend = dayNum === 6 || dayNum === 0
            return (
              <div key={dayNum} className="flex flex-col gap-1 min-w-0">
                <div
                  className={cn(
                    'rounded-md px-1.5 sm:px-2 py-1.5 font-mono text-[10px] sm:text-sm font-bold uppercase tracking-wide text-center border border-white/10',
                    isToday && isWeekend && 'week-slot-active',
                    isToday && !isWeekend && (isPurple ? 'bg-purple-500/20 text-purple-50 border-purple-400/50' : 'bg-cyan-500/20 text-cyan-50 border-cyan-400/50'),
                    !isToday && isWeekend && 'week-slot-weekend bg-white/5 text-amber-400/90',
                    !isToday && !isWeekend && 'bg-white/5 text-slate-400'
                  )}
                >
                  {DAY_LABELS[dayNum]}
                </div>
                <div className="flex flex-col gap-0.5">
                  {isWeekend ? (
                    <div className="rounded-md border border-dashed border-amber-500/30 px-1.5 py-1 font-mono text-[10px] text-amber-400/80 text-center italic">
                      Выходной
                    </div>
                  ) : (
                    lessons.map((lesson, i) => (
                      <div
                        key={`${dayNum}-${i}`}
                        className={cn(
                          'rounded-md border border-white/10 px-1.5 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs leading-tight text-white break-words tracking-wide',
                          i % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.03]'
                        )}
                      >
                        {lesson}
                      </div>
                    ))
                  )}
                  {!isWeekend && lessons.length === 0 && (
                    <div className="rounded-md bg-white/5 border border-dashed border-white/10 px-1.5 py-1 font-mono text-[10px] text-slate-500 text-center">
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
