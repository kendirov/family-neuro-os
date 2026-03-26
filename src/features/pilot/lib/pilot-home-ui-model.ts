import type { WeeklySchedule, DayOfWeek, PilotId, ScheduleSlot } from '@/types/schedule'
import type { DailyGroupSectionModel, PilotId as AdminPilotId } from '@/features/admin/lib/admin-dashboard-grouped-ui-model'
import type { AdminDashboardTask } from '@/features/admin/lib/admin-dashboard-ui-model'

export type PilotHomeLessonModel = {
  id: string
  pilotId: PilotId
  pilotName: string
  subject: string
  startTime: string
  endTime: string
  startMinutes: number
  endMinutes: number
  state: 'past' | 'current' | 'next' | 'future'
}

export type SchoolScheduleCardModel = {
  title: 'Расписание'
  dayTitle: string
  dayKey: DayOfWeek | null
  lessons: PilotHomeLessonModel[]
  emptyStateText: string
}

export type PilotProgressTaskModel = {
  id: string
  label: string
  emoji: string
  completed: boolean
  kind: 'core' | 'bonus'
}

export type PilotProgressGroupModel = {
  id: string
  title: string
  completedCount: number
  totalCount: number
  tasks: PilotProgressTaskModel[]
}

export type PilotProgressPilotSectionModel = {
  pilotId: AdminPilotId
  pilotName: string
  accent: 'cyan' | 'purple'
  groups: PilotProgressGroupModel[]
  done: number
  total: number
}

export type PilotHomeUiModel = {
  schedule: SchoolScheduleCardModel
  progressByPilot: PilotProgressPilotSectionModel[]
}

const RU_WEEKDAY_SHORT: Record<number, string> = {
  0: 'ВС',
  1: 'ПН',
  2: 'ВТ',
  3: 'СР',
  4: 'ЧТ',
  5: 'ПТ',
  6: 'СБ',
}

const RU_MONTH_GENITIVE: string[] = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function getTodayDayKey(now: Date): DayOfWeek | null {
  const d = now.getDay() // 0..6
  if (d === 1) return 'mon'
  if (d === 2) return 'tue'
  if (d === 3) return 'wed'
  if (d === 4) return 'thu'
  if (d === 5) return 'fri'
  return null
}

export function formatRuDayTitle(now: Date) {
  const dd = now.getDate()
  const mm = now.getMonth()
  const weekday = RU_WEEKDAY_SHORT[now.getDay()] ?? '—'
  const month = RU_MONTH_GENITIVE[mm] ?? ''
  return `Сегодня · ${weekday}, ${dd} ${month}`
}

export function parseClockToMinutes(clock: string): number {
  const [hhRaw, mmRaw] = String(clock ?? '').split(':')
  const hh = Number(hhRaw)
  const mm = Number(mmRaw)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0
  return Math.max(0, Math.min(24 * 60, hh * 60 + mm))
}

function stableSortByTime(a: ScheduleSlot, b: ScheduleSlot) {
  const am = parseClockToMinutes(a.startTime)
  const bm = parseClockToMinutes(b.startTime)
  if (am !== bm) return am - bm
  return String(a.id).localeCompare(String(b.id))
}

function computeLessonState(nowMinutes: number, startMinutes: number, endMinutes: number, nextStartMinutes: number | null): PilotHomeLessonModel['state'] {
  if (nowMinutes >= startMinutes && nowMinutes < endMinutes) return 'current'
  if (nowMinutes < startMinutes && (nextStartMinutes == null || startMinutes === nextStartMinutes)) return 'next'
  if (nowMinutes >= endMinutes) return 'past'
  return 'future'
}

export function buildSchoolScheduleCardModel({
  now,
  schedule,
  pilots,
}: {
  now: Date
  schedule: WeeklySchedule
  pilots: Array<{ pilotId: PilotId; name: string; accent: 'cyan' | 'purple' }>
}): SchoolScheduleCardModel {
  const dayKey = getTodayDayKey(now)
  const dayTitle = formatRuDayTitle(now)
  if (!dayKey) {
    return { title: 'Расписание', dayTitle, dayKey: null, lessons: [], emptyStateText: 'Сегодня уроков нет' }
  }

  const day = schedule?.[dayKey]
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const merged: Array<{ pilotId: PilotId; pilotName: string; slot: ScheduleSlot }> = []
  pilots.forEach((p) => {
    const list = (day?.[p.pilotId] ?? []).slice().sort(stableSortByTime)
    list.forEach((slot) => merged.push({ pilotId: p.pilotId, pilotName: p.name, slot }))
  })

  const sorted = merged
    .slice()
    .sort((a, b) => {
      const am = parseClockToMinutes(a.slot.startTime)
      const bm = parseClockToMinutes(b.slot.startTime)
      if (am !== bm) return am - bm
      // tie-breaker: pilotId then id (stable, predictable)
      const pid = String(a.pilotId).localeCompare(String(b.pilotId))
      if (pid !== 0) return pid
      return String(a.slot.id).localeCompare(String(b.slot.id))
    })

  const nextStartMinutes =
    sorted
      .map((x) => parseClockToMinutes(x.slot.startTime))
      .filter((m) => m > nowMinutes)
      .sort((a, b) => a - b)[0] ?? null

  const lessons: PilotHomeLessonModel[] = sorted.map(({ pilotId, pilotName, slot }) => {
    const startMinutes = parseClockToMinutes(slot.startTime)
    const endMinutes = parseClockToMinutes(slot.endTime)
    return {
      id: slot.id,
      pilotId,
      pilotName,
      subject: slot.subject,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startMinutes,
      endMinutes,
      state: computeLessonState(nowMinutes, startMinutes, endMinutes, nextStartMinutes),
    }
  })

  return { title: 'Расписание', dayTitle, dayKey, lessons, emptyStateText: 'Сегодня уроков нет' }
}

function asEmoji(task: AdminDashboardTask) {
  const e = task.emoji
  return typeof e === 'string' && e.trim().length ? e : '•'
}

function asTaskModel(task: AdminDashboardTask, completed: boolean, kind: 'core' | 'bonus'): PilotProgressTaskModel {
  return {
    id: task.id,
    label: task.label ?? task.id,
    emoji: asEmoji(task),
    completed,
    kind,
  }
}

export function buildPilotProgressByGroups({
  groups,
  pilots,
  isTaskDone,
}: {
  groups: DailyGroupSectionModel[]
  pilots: Array<{ pilotId: AdminPilotId; name: string; accent: 'cyan' | 'purple' }>
  isTaskDone: (pilotId: AdminPilotId, task: AdminDashboardTask) => boolean
}): PilotProgressPilotSectionModel[] {
  return pilots.map((p) => {
    const pilotGroups: PilotProgressGroupModel[] = groups.map((g) => {
      const core = (g.coreTasks ?? []).map((t) => asTaskModel(t, isTaskDone(p.pilotId, t), 'core'))

      const bonuses = (g.bonusAttachments ?? [])
        .map((b) => b.task)
        .filter(Boolean)
        .map((t) => asTaskModel(t, isTaskDone(p.pilotId, t), 'bonus'))

      const tasks = [...core, ...bonuses]
      const done = tasks.filter((t) => t.completed).length
      const total = tasks.length

      return {
        id: g.id,
        title: g.title,
        completedCount: done,
        totalCount: total,
        tasks,
      }
    })

    const doneTotal = pilotGroups.reduce((acc, g) => acc + g.completedCount, 0)
    const totalTotal = pilotGroups.reduce((acc, g) => acc + g.totalCount, 0)

    return {
      pilotId: p.pilotId,
      pilotName: p.name,
      accent: p.accent,
      groups: pilotGroups,
      done: doneTotal,
      total: totalTotal,
    }
  })
}

