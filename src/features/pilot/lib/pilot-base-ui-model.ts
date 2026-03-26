export type PilotBaseTimeBlock = 'morning' | 'afternoon' | 'evening'

export type PilotBaseScheduleBadgeTone = 'info' | 'success' | 'warning'

export interface PilotBaseScheduleUiModel {
  now: Date
  timeBlock: PilotBaseTimeBlock
  timeBlockLabel: string
  badge: { label: string; tone: PilotBaseScheduleBadgeTone }
  nowTitle: string
  nowAction: string
  nextTitle: string
  nextAction: string
  prepTitle?: string
  prepAction?: string
}

export type PilotHeroAccent = 'cyan' | 'purple'

export interface PilotHeroUiModel {
  pilotId: 'kirill' | 'roma'
  name: string
  accent: PilotHeroAccent
  level: number
  xpTotal: number
  coins: number
  badge: { label: string; tone: 'neutral' | 'boost' | 'active' }
}

export interface TodaySummaryUiModel {
  done: number
  total: number
  waitingLabels: string[]
  state: 'complete' | 'in_progress'
}

export interface PilotBaseScreenUiModel {
  schedule: PilotBaseScheduleUiModel
  pilots: PilotHeroUiModel[]
  today: TodaySummaryUiModel
  isMock: boolean
}

const XP_PER_LEVEL = 500

export function getCurrentTimeBlock(now = new Date()): PilotBaseTimeBlock {
  const hour = now.getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

export function timeBlockLabel(block: PilotBaseTimeBlock): string {
  if (block === 'morning') return 'Утро'
  if (block === 'afternoon') return 'День'
  return 'Вечер'
}

export function levelFromXp(xpTotal: number) {
  const level = Math.floor(Math.max(0, xpTotal) / XP_PER_LEVEL) + 1
  return { level }
}

export function formatClock(now: Date) {
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function buildBaseSchedule({
  now,
  timeBlock,
  nowAction,
  nextAction,
  prepAction,
}: {
  now: Date
  timeBlock: PilotBaseTimeBlock
  nowAction: string
  nextAction: string
  prepAction?: string
}): PilotBaseScheduleUiModel {
  const blockLabel = timeBlockLabel(timeBlock)

  return {
    now,
    timeBlock,
    timeBlockLabel: blockLabel,
    badge: { label: `На линии · ${formatClock(now)}`, tone: 'info' },
    nowTitle: 'Сейчас',
    nowAction,
    nextTitle: 'Дальше',
    nextAction,
    ...(prepAction
      ? { prepTitle: 'Готовься', prepAction }
      : {}),
  }
}

