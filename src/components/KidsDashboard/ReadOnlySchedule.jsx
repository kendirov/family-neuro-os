/**
 * ReadOnlySchedule — расписание на неделю для одного ребёнка.
 * Только ПН–ПТ (без выходных). Данные из useScheduleStore.
 * Expensive Minimalism: glassmorphism, 1px borders.
 */
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useScheduleStore } from '@/stores/useScheduleStore'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ']

const TITLES = {
  roma: 'РАСПИСАНИЕ: РОМА (1-я смена 08:00)',
  kirill: 'РАСПИСАНИЕ: КИРИЛЛ (2-я смена 13:20)',
}

export function ReadOnlySchedule({ childId, accentColor = 'cyan' }) {
  const schedule = useScheduleStore((s) => s.schedule)
  const today = new Date().getDay()
  const currentDay = today >= 1 && today <= 5 ? today : null
  const isPurple = accentColor === 'purple'
  const headerText = isPurple ? 'text-purple-200' : 'text-cyan-200'

  const scheduleByDay = useMemo(() => {
    const out = {}
    DAY_KEYS.forEach((key, i) => {
      const dayNum = i + 1
      const daySchedule = schedule[key]
      out[dayNum] = (daySchedule?.[childId] ?? []).map((s) => s.subject)
    })
    return out
  }, [schedule, childId])

  return (
    <div
      className={cn(
        'h-full min-h-full rounded-xl border overflow-hidden flex flex-col min-w-0',
        'bg-white/5 backdrop-blur-xl border-white/10',
        isPurple
          ? 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25),0_0_0_1px_rgba(168,85,247,0.2)]'
          : 'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25),0_0_0_1px_rgba(34,211,238,0.2)]'
      )}
      aria-label="Расписание на неделю"
    >
      <h3
        className={cn(
          'font-mono text-xs font-bold uppercase tracking-widest px-3 py-2 border-b border-white/10 bg-white/5 shrink-0',
          headerText
        )}
      >
        {TITLES[childId] ?? 'Расписание'}
      </h3>
      <div className="px-2 pb-2 pt-1 overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 min-w-0">
          {DAY_KEYS.map((_, i) => {
            const dayNum = i + 1
            const lessons = scheduleByDay[dayNum] ?? []
            const isToday = currentDay === dayNum
            return (
              <div key={dayNum} className="flex flex-col gap-1 min-w-0">
                <div
                  className={cn(
                    'rounded-md px-1.5 sm:px-2 py-1.5 font-mono text-[10px] sm:text-sm font-bold uppercase tracking-wide text-center border border-white/10',
                    isToday
                      ? isPurple
                        ? 'bg-purple-500/20 text-purple-50 border-purple-400/50'
                        : 'bg-cyan-500/20 text-cyan-50 border-cyan-400/50'
                      : 'bg-white/5 text-slate-400'
                  )}
                >
                  {DAY_LABELS[i]}
                </div>
                <div className="flex flex-col gap-0.5">
                  {lessons.map((lesson, j) => (
                    <div
                      key={`${dayNum}-${j}`}
                      className={cn(
                        'rounded-md border border-white/10 px-1.5 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs leading-tight text-white break-words tracking-wide',
                        j % 2 === 0 ? 'bg-white/5' : 'bg-white/[0.03]'
                      )}
                    >
                      {lesson}
                    </div>
                  ))}
                  {lessons.length === 0 && (
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
