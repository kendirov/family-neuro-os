import { cn } from '@/lib/utils'
import type { DayOfWeek, ScheduleSlot } from '@/types/schedule'
import { WeekdayLessonsCompact } from './WeekdayLessonsCompact'

const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS: Record<DayOfWeek, string> = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт' }

function parseClockToMinutes(clock: string) {
  const [hhRaw, mmRaw] = String(clock ?? '').split(':')
  const hh = Number(hhRaw)
  const mm = Number(mmRaw)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0
  return Math.max(0, Math.min(24 * 60, hh * 60 + mm))
}

function getTodayKey(now: Date): DayOfWeek | null {
  const d = now.getDay()
  if (d === 1) return 'mon'
  if (d === 2) return 'tue'
  if (d === 3) return 'wed'
  if (d === 4) return 'thu'
  if (d === 5) return 'fri'
  return null
}

function sortByTime(a: ScheduleSlot, b: ScheduleSlot) {
  const am = parseClockToMinutes(a.startTime)
  const bm = parseClockToMinutes(b.startTime)
  if (am !== bm) return am - bm
  return String(a.id).localeCompare(String(b.id))
}

function getTodayLessonsForPilot(now: Date, schedule: any, pilotId: 'kirill' | 'roma') {
  const dayKey = getTodayKey(now)
  if (!dayKey) return { dayKey: null as DayOfWeek | null, lessons: [] as ScheduleSlot[] }
  const list = (schedule?.[dayKey]?.[pilotId] ?? []).slice().sort(sortByTime)
  return { dayKey, lessons: list }
}

function computeNowNext(now: Date, lessons: ScheduleSlot[]) {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const current = lessons.find((l) => {
    const s = parseClockToMinutes(l.startTime)
    const e = parseClockToMinutes(l.endTime)
    return nowMin >= s && nowMin < e
  })
  const next = lessons
    .filter((l) => parseClockToMinutes(l.startTime) > nowMin)
    .sort(sortByTime)[0]
  return { current: current ?? null, next: next ?? null }
}

function accentChip(accent: 'cyan' | 'purple') {
  return accent === 'cyan'
    ? 'border-cyan-500/25 bg-cyan-500/8 text-cyan-100'
    : 'border-purple-500/25 bg-purple-500/8 text-purple-100'
}

export function PilotWeeklyScheduleCard({
  title,
  accent,
  pilotId,
  schedule,
  now,
}: {
  title: string
  accent: 'cyan' | 'purple'
  pilotId: 'kirill' | 'roma'
  schedule: any
  now: Date
}) {
  const todayKey = getTodayKey(now)
  const today = getTodayLessonsForPilot(now, schedule, pilotId)
  const { current, next } = computeNowNext(now, today.lessons)

  const summary =
    todayKey == null || today.lessons.length === 0
      ? 'Сегодня уроков нет'
      : current
        ? `Сейчас: ${current.subject} · ${current.startTime}–${current.endTime}`
        : next
          ? `Дальше: ${next.subject} · ${next.startTime}–${next.endTime}`
          : 'Сегодня уроки закончились'

  return (
    <section
      className={cn(
        'rounded-3xl border border-white/10 bg-slate-900/45 backdrop-blur-xl overflow-hidden',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_36px_rgba(0,0,0,0.32)]'
      )}
      aria-label={`Расписание: ${title}`}
    >
      <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-gaming text-sm sm:text-base font-black uppercase tracking-wider text-slate-100 truncate">{title}</h3>
            <span className={cn('rounded-xl border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]', accentChip(accent))}>
              ПН–ПТ
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-400/90 truncate">{summary}</div>
        </div>
        <span className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
          {todayKey ? DAY_LABELS[todayKey] : '—'}
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-5 gap-2">
          {DAY_KEYS.map((key) => {
            const isToday = key === todayKey
            const dayLessons = (schedule?.[key]?.[pilotId] ?? []).slice().sort(sortByTime)
            return (
              <div key={key} className="min-w-0">
                <div
                  className={cn(
                    'rounded-xl border px-2 py-1.5 text-center',
                    isToday ? 'border-white/20 bg-white/[0.06]' : 'border-white/10 bg-white/[0.02]'
                  )}
                >
                  <div className={cn('font-mono text-[10px] uppercase tracking-[0.18em]', isToday ? 'text-slate-100' : 'text-slate-500')}>
                    {DAY_LABELS[key]}
                  </div>
                </div>
                <div className="mt-2">
                  <WeekdayLessonsCompact
                    lessons={dayLessons.map((l: ScheduleSlot) => ({ id: l.id, subject: l.subject, startTime: l.startTime, endTime: l.endTime }))}
                    highlight={isToday}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

