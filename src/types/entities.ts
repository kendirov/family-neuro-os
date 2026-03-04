/**
 * Turbo-Garage Neuro-Economy — строгие типы сущностей.
 * Пилоты (дети), Оператор (взрослый), Нейро-задачи.
 */

/** Статус нейро-задачи */
export type TaskStatus = 'pending' | 'completed' | 'failed'

/** Пилот (ребёнок): Рома, Кирилл. */
export interface Pilot {
  id: string
  name: string
  /** Уровень пилота (1, 2, 3...) */
  level: number
  /** Текущий XP до следующего уровня */
  currentXP: number
  /** Turbo Coins (баланс для трат) */
  turboCoins: number
  /** Цвет темы: cyan | purple */
  color: 'cyan' | 'purple'
  /** Daily Roulette: спинов осталось сегодня (legacy, фикс. 3) */
  daily_spins_remaining?: number
  /** Daily Roulette: дата последнего спина (YYYY-MM-DD) */
  last_spin_date?: string | null
  /** Очки, заработанные сегодня. 1 спин = 50 очков. */
  daily_points_earned?: number
  /** Спинов использовано сегодня (Daily Roulette). */
  spins_used_today?: number
  /** Дата последнего сброса daily_points/spins (YYYY-MM-DD). */
  last_daily_reset?: string | null
}

/** Оператор (взрослый): Александра. */
export interface Operator {
  id: string
  name: string
  /** Очки логистики (управление задачами, расписанием) */
  logisticsPoints: number
  /** SLA рейтинг (0–100, качество выполнения операций) */
  slaRating: number
}

/** Нейро-задача. */
export interface Task {
  id: string
  /** ID пилота, которому назначена задача */
  assignedTo: Pilot['id']
  title: string
  /** Награда в XP/Turbo Coins */
  reward: number
  /** Дедлайн (ISO timestamp или null) */
  deadline: string | null
  status: TaskStatus
}

// =============================================================================
// Task Economy — deflationary daily schema (~100–150 pts/day)
// =============================================================================

/** Временной блок: утро, день, вечер или в любое время. */
export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime'

/** Категория задачи: рутина, питание, школа, бонус. */
export type TaskCategory = 'routine' | 'food' | 'school' | 'bonus'

/** Определение задачи в каталоге (БД task_definitions). */
export interface TaskDefinition {
  id: string
  label: string
  emoji: string
  time_block: TimeBlock
  category: TaskCategory
  base_reward: number
  bonus_reward: number
  max_daily_completions: number
  reason_template?: string | null
  sort_order: number
  created_at?: string
}


/** Транзакция (для типизации store). */
export interface Transaction {
  id: string
  userId: string
  description: string
  amount: number
  type: 'earn' | 'spend' | 'burn'
  status?: string | null
  at: number
  /** FK на task_definitions. Null для burn/spend и legacy. */
  task_definition_id?: string | null
}

// =============================================================================
// Timer & Penalty System — server-truth schema
// =============================================================================

/** Пресет таймера: правила лимитов и штрафов (Строгий будний, Выходной). */
export interface TimerPreset {
  id: string
  name: string
  safe_minutes: number
  base_cost_per_min: number
  penalty_multiplier_x2_after_mins: number | null
  penalty_multiplier_x3_after_mins: number | null
  created_at?: string
}

/** Тип активности сессии. */
export type SessionActivityType = 'game' | 'cartoon'

/** Статус сессии таймера. */
export type SessionStatus = 'active' | 'paused' | 'completed'

/** Активная/приостановленная сессия таймера. Источник истины — БД. */
export interface ActiveSession {
  id: string
  user_id: string
  activity_type: SessionActivityType
  status: SessionStatus
  /** Начало текущего сегмента. При active: elapsed = accumulated_seconds + (now - started_at). */
  started_at: string | null
  /** Сумма секунд до паузы. При resume не меняется. */
  accumulated_seconds: number
  active_preset_id: string | null
  created_at?: string
  completed_at?: string | null
}
