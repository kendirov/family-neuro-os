import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import type { PilotBaseScreenUiModel, PilotHeroUiModel, PilotBaseTimeBlock } from '../lib/pilot-base-ui-model'
import { buildBaseSchedule, getCurrentTimeBlock, levelFromXp } from '../lib/pilot-base-ui-model'
import { PILOT_HOME_MOCKS } from './pilotHome.mock'

type TaskSeed = {
  id: string
  label: string
  emoji: string
  time_block: 'morning' | 'afternoon' | 'evening' | 'anytime'
  category: 'routine' | 'food' | 'school' | 'bonus' | string
  sort_order: number
}

const PILOTS: Array<{ pilotId: 'kirill' | 'roma'; name: string; accent: 'purple' | 'cyan' }> = [
  { pilotId: 'kirill', name: 'Кирилл', accent: 'purple' },
  { pilotId: 'roma', name: 'Рома', accent: 'cyan' },
]

function nextTimeBlock(block: PilotBaseTimeBlock): PilotBaseTimeBlock {
  if (block === 'morning') return 'afternoon'
  if (block === 'afternoon') return 'evening'
  return 'evening'
}

function pickDayKeyMissions(): TaskSeed[] {
  const tasks = taskDefinitions as unknown as TaskSeed[]
  return tasks
    .filter((t) => ['routine', 'food', 'school', 'bonus'].includes(t.category))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, 5)
}

export function makePilotBaseMock(): PilotBaseScreenUiModel {
  const now = new Date()
  const block = getCurrentTimeBlock(now)
  const nextBlock = nextTimeBlock(block)

  const dayTasks = pickDayKeyMissions()
  const doneIds = new Set(PILOTS.flatMap((p) => PILOT_HOME_MOCKS[p.pilotId].dailyMissions.completed.map((m) => m.id)))

  const done = dayTasks.filter((t) => doneIds.has(t.id)).length
  const total = dayTasks.length
  const waitingLabels = dayTasks
    .filter((t) => !doneIds.has(t.id))
    .slice(0, 2)
    .map((t) => t.label)

  const nowTask = dayTasks.find((t) => t.time_block === block && !doneIds.has(t.id)) ?? dayTasks.find((t) => !doneIds.has(t.id)) ?? dayTasks[0]
  const nextTask =
    dayTasks.find((t) => t.time_block === nextBlock && !doneIds.has(t.id)) ??
    dayTasks.find((t) => t.time_block === 'anytime' && !doneIds.has(t.id)) ??
    nowTask

  const schedule = buildBaseSchedule({
    now,
    timeBlock: block,
    nowAction: nowTask ? `${nowTask.emoji} ${nowTask.label}` : 'Выбери миссию и начинай!',
    nextAction: nextTask ? `${nextTask.emoji} ${nextTask.label}` : 'Дальше — свободный режим',
    prepAction: done >= total ? 'Забери награду в Арене' : undefined,
  })

  const pilots: PilotHeroUiModel[] = PILOTS.map((p) => {
    const mock = PILOT_HOME_MOCKS[p.pilotId].profile
    const { level } = levelFromXp(mock.xpTotal)
    const badge =
      mock.xpTodayNet >= 120
        ? { label: 'На бусте', tone: 'boost' as const }
        : mock.xpTodayNet > 0
          ? { label: 'В деле', tone: 'active' as const }
          : { label: 'Ждёт миссию', tone: 'neutral' as const }
    return {
      pilotId: p.pilotId,
      name: p.name,
      accent: p.accent,
      level,
      xpTotal: mock.xpTotal,
      coins: mock.xpTotal,
      badge,
    }
  })

  return {
    schedule,
    pilots,
    today: {
      done,
      total,
      waitingLabels,
      state: done >= total ? 'complete' : 'in_progress',
    },
    isMock: true,
  }
}

