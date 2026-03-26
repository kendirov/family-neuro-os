import type { ContractCadence, ContractStatus, FamilyContractsUiModel } from '../lib/contracts-ui-model'

export interface ContractMockDef {
  id: string
  cadence: ContractCadence
  title: string
  shortTitle: string
  description: string
  damage: number
  rewardLabel: string
  /**
   * Evaluation keys used by UI selector (no backend logic here).
   */
  rules:
    | { kind: 'BOTH_TASK_DONE'; taskId: string; label: string }
    | { kind: 'BOTH_MEALS_DONE'; meals: Array<'breakfast' | 'lunch' | 'dinner'>; label: string }
    | { kind: 'BOTH_NO_PENALTY'; penaltyReason: string; label: string }
    | { kind: 'BOTH_REQUIRED_DONE'; requiredTaskIds: string[]; label: string }
  statusHint?: ContractStatus
}

export const FAMILY_CONTRACTS_MOCK: ContractMockDef[] = [
  {
    id: 'daily_clean_room',
    cadence: 'DAILY',
    title: 'Оба убрали комнату',
    shortTitle: 'Уборка ×2',
    description: 'Кооператив: каждый закрывает “Уборка”.',
    damage: 180,
    rewardLabel: 'Урон по боссу + шанс на weekend lootbox',
    rules: { kind: 'BOTH_TASK_DONE', taskId: 'help_clean', label: 'Уборка' },
  },
  {
    id: 'daily_no_meltdown',
    cadence: 'DAILY',
    title: 'Оба без истерик',
    shortTitle: 'Без истерик',
    description: 'Командный спокойный день — боссу больно.',
    damage: 140,
    rewardLabel: 'Урон по боссу',
    rules: { kind: 'BOTH_NO_PENALTY', penaltyReason: 'Штраф: Крик/Истерика', label: 'Нет “Крик/Истерика”' },
  },
  {
    id: 'daily_meals_ok',
    cadence: 'DAILY',
    title: 'Оба поели нормально',
    shortTitle: 'Питание',
    description: 'Оба закрыли 2 приёма пищи (завтрак/обед/ужин).',
    damage: 160,
    rewardLabel: 'Fuel boost + урон по боссу',
    rules: { kind: 'BOTH_MEALS_DONE', meals: ['breakfast', 'lunch', 'dinner'], label: '2 приёма пищи' },
  },
  {
    id: 'weekly_required',
    cadence: 'WEEKLY',
    title: 'Оба закрыли обязательные дела',
    shortTitle: 'Обязательное',
    description: 'Неделя: режим дня + сон. Для обоих.',
    damage: 420,
    rewardLabel: 'Большой урон + weekend lootbox',
    rules: { kind: 'BOTH_REQUIRED_DONE', requiredTaskIds: ['wake_up', 'teeth_morning', 'sleep_time'], label: 'Режим дня + сон' },
  },
  {
    id: 'weekly_no_fights',
    cadence: 'WEEKLY',
    title: 'Оба без драк',
    shortTitle: 'Без драк',
    description: 'Если драка была — контракт провален.',
    damage: 380,
    rewardLabel: 'Урон по боссу',
    rules: { kind: 'BOTH_NO_PENALTY', penaltyReason: 'Штраф: Драка', label: 'Нет “Драка”' },
    statusHint: 'IN_PROGRESS',
  },
]

export const FAMILY_CONTRACTS_EMPTY: FamilyContractsUiModel = { daily: [], weekly: [] }

