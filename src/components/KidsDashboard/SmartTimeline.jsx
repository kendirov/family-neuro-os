/**
 * SmartTimeline — компактный вертикальный stepper расписания на сегодня.
 * Past: dimmed + check | Current: glowing border | Future: standard.
 */
import { useMemo, useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { WEEKLY_SCHEDULE, getScheduleKey } from '@/data/weeklySchedule'
import { cn } from '@/lib/utils'

/** Парсит "HH:MM" в минуты с полуночи. */
function parseTime(str) {
  const [h, m] = str.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Текущее время в минутах с полуночи. */
function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function SmartTimeline({ childId, accentColor = 'cyan' }) {
  const [now, setNow] = useState(() => nowMinutes())

  // Обновление раз в минуту для смены статуса уроков
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { lessons } = useMemo(() => {
    const day = new Date().getDay()
    const key = getScheduleKey(day)
    if (!key) return { lessons: [] }

    const daySchedule = WEEKLY_SCHEDULE[key]
    if (!daySchedule) return { lessons: [] }

    const list = daySchedule[childId] ?? []
    const currentMin = now

    const withStatus = list.map((lesson) => {
      const startMin = parseTime(lesson.start)
      const endMin = parseTime(lesson.end)
      const isPast = currentMin >= endMin
      const isNow = currentMin >= startMin && currentMin < endMin
      const isFuture = currentMin < startMin
      return {
        ...lesson,
        status: isPast ? 'past' : isNow ? 'current' : 'future',
      }
    })

    return { lessons: withStatus }
  }, [childId, now])

  const isPurple = accentColor === 'purple'
  const accentBorder = isPurple ? 'border-purple-500/50' : 'border-cyan-500/50'
  const accentGlow = isPurple ? 'shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'shadow-[0_0_12px_rgba(6,182,212,0.4)]'

  if (lessons.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-xl px-3 py-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          Расписание
        </h3>
        <p className="text-slate-600 text-xs">— уроков нет</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-xl px-3 py-3">
      <h3
        className={cn(
          'font-mono text-[10px] uppercase tracking-widest mb-3',
          isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
        )}
      >
        Расписание
      </h3>

      {/* Vertical stepper timeline */}
      <ul className="relative space-y-0">
        {lessons.map((lesson, i) => (
          <li
            key={`${lesson.start}-${lesson.name}-${i}`}
            className="relative flex items-start gap-2"
          >
            {/* Vertical line (except last) */}
            {i < lessons.length - 1 && (
              <div
                className="absolute left-[5px] top-5 bottom-0 w-px -mb-1"
                style={{
                  background: lesson.status === 'past'
                    ? 'rgba(100, 116, 139, 0.4)'
                    : 'rgba(100, 116, 139, 0.2)',
                }}
              />
            )}

            {/* Node: dot or check */}
            <div
              className={cn(
                'relative z-10 mt-1.5 shrink-0 w-3 h-3 rounded-full flex items-center justify-center transition-colors',
                lesson.status === 'past' && 'bg-emerald-500/60',
                lesson.status === 'current' && (isPurple ? 'bg-purple-500' : 'bg-cyan-500'),
                lesson.status === 'future' && 'bg-slate-600'
              )}
            >
              {lesson.status === 'past' ? (
                <Check className="w-2 h-2 text-white" strokeWidth={3} />
              ) : lesson.status === 'current' ? (
                <span className="absolute inset-0 rounded-full animate-ping opacity-40 bg-inherit" />
              ) : null}
            </div>

            {/* Content */}
            <div
              className={cn(
                'flex-1 min-w-0 py-1.5 px-2 rounded-lg border transition-all',
                lesson.status === 'past' && 'border-transparent bg-transparent',
                lesson.status === 'current' && `border ${accentBorder} ${accentGlow}`,
                lesson.status === 'future' && 'border border-slate-700/40 bg-slate-900/20'
              )}
            >
              <span
                className={cn(
                  'tabular-nums text-[10px] shrink-0 mr-2',
                  lesson.status === 'past' && 'text-slate-600',
                  lesson.status === 'current' && (isPurple ? 'text-purple-300' : 'text-cyan-300'),
                  lesson.status === 'future' && 'text-slate-500'
                )}
              >
                {lesson.start}
              </span>
              <span
                className={cn(
                  'text-xs font-medium truncate block',
                  lesson.status === 'past' && 'text-slate-600',
                  lesson.status === 'current' && (isPurple ? 'text-purple-200' : 'text-cyan-200'),
                  lesson.status === 'future' && 'text-slate-400'
                )}
              >
                {lesson.name}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
