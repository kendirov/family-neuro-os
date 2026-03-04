/**
 * Централизованная структура дневных квестов.
 * Группировка по временным блокам: УТРО, ДЕНЬ, ВЕЧЕР.
 * Используется QuestTimeline и другими компонентами.
 */

/** Одна задача в логе квестов */
export interface DailyQuest {
  id: string
  emoji: string
  title: string
  reward: number
  description: string
  isCompleted: boolean
}

/** Временной блок дня */
export type TimeBlockId = 'morning' | 'afternoon' | 'evening'

/** Задача в секции (без isCompleted — вычисляется при рендере) */
export interface QuestTaskInSection {
  id: string
  emoji: string
  title: string
  reward: number
  description: string
  reasonTemplate?: string
  bonusReward?: number
}

/** Секция с заголовком и задачами */
export interface QuestSection {
  id: TimeBlockId
  label: string
  emoji: string
  tasks: QuestTaskInSection[]
}

/** Статическое определение задачи (без isCompleted — вычисляется в runtime) */
export interface DailyQuestDefinition {
  id: string
  emoji: string
  title: string
  reward: number
  description: string
  timeBlock: TimeBlockId
  sortOrder: number
  reasonTemplate?: string
  bonusReward?: number /** Для isTaskCompleteFromTransactions (бонус → "reason — бонус") */
}

// Импортируем сырые данные и маппим в нашу структуру
import taskDefinitionsSeed from './taskDefinitionsSeed.json'

const BLOCK_META: Record<TimeBlockId, { label: string; emoji: string }> = {
  morning: { label: 'УТРО', emoji: '🌅' },
  afternoon: { label: 'ДЕНЬ', emoji: '☀️' },
  evening: { label: 'ВЕЧЕР', emoji: '🌙' },
}

/** Описания для tooltip — время, критерии качества */
const TASK_DESCRIPTIONS: Record<string, string> = {
  wake_on_time: 'До 07:30',
  make_bed: 'Без напоминаний',
  teeth_morning: 'Умылся и почистил зубы',
  breakfast: 'Съел завтрак',
  lunch: 'Обед в школе или дома',
  dinner: 'Ужин',
  snack: 'Полдник',
  pack_bag: 'Собрал портфель с вечера',
  school_leave: 'Вышел из дома вовремя',
  homework_done: 'Сделал уроки',
  extra_study: 'Чтение или доп. занятия',
  help_clean: 'Помог с уборкой',
  take_trash: 'Вынес мусор',
  sleep_on_time: 'Лёг до 21:30',
}

/** Преобразуем JSON в DailyQuestDefinition[] */
function buildDefinitions(): DailyQuestDefinition[] {
  const items = taskDefinitionsSeed as Array<{
    id: string
    label: string
    emoji: string
    time_block: string
    base_reward?: number
    bonus_reward?: number
    sort_order?: number
    reason_template?: string
  }>

  return items.map((t) => {
    const block = (t.time_block === 'anytime' ? 'afternoon' : t.time_block) as TimeBlockId
    const reward = (t.base_reward ?? 0) + (t.bonus_reward ?? 0)
    return {
      id: t.id,
      emoji: t.emoji,
      title: t.label,
      reward,
      description: TASK_DESCRIPTIONS[t.id] ?? t.label,
      timeBlock: block,
      sortOrder: t.sort_order ?? 0,
      reasonTemplate: t.reason_template,
      bonusReward: (t as { bonus_reward?: number }).bonus_reward ?? 0,
    }
  })
}

const DEFINITIONS = buildDefinitions()

/**
 * Возвращает секции квестов, сгруппированные по временным блокам.
 * isCompleted не включён — его нужно передать при рендере.
 */
export function getDailyQuestsSections(): QuestSection[] {
  const byBlock: Record<TimeBlockId, DailyQuestDefinition[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  }

  DEFINITIONS.forEach((d) => {
    byBlock[d.timeBlock].push(d)
  })

  ;(['morning', 'afternoon', 'evening'] as TimeBlockId[]).forEach((block) => {
    byBlock[block].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  return (['morning', 'afternoon', 'evening'] as TimeBlockId[]).map((id) => {
    const meta = BLOCK_META[id]
    return {
      id,
      label: meta.label,
      emoji: meta.emoji,
      tasks: byBlock[id].map((t) => ({
        id: t.id,
        emoji: t.emoji,
        title: t.title,
        reward: t.reward,
        description: t.description,
        reasonTemplate: t.reasonTemplate ?? t.title,
        bonusReward: t.bonusReward ?? 0,
      })),
    }
  })
}

/** Сырые определения для сопоставления с store (isTaskCompleteFromTransactions) */
export function getTaskDefinitionById(id: string): DailyQuestDefinition | undefined {
  return DEFINITIONS.find((d) => d.id === id)
}

/** Все определения задач — для передачи в isTaskCompleteFromTransactions */
export function getAllTaskDefinitions(): Array<{ id: string; reason_template?: string; label?: string }> {
  return DEFINITIONS.map((d) => ({
    id: d.id,
    reason_template: d.reasonTemplate,
    label: d.title,
  }))
}
