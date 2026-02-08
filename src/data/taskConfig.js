/**
 * Comprehensive Task List & Grading System.
 * 4 chronological phases; used by Dashboard and MissionLog.
 */

/** @typedef {'earn'|'penalty'} TaskType */

/**
 * Single task entry (flat list in a phase).
 * @property {string} id
 * @property {string} emoji
 * @property {string} label
 * @property {number} credits — XP (negative for penalty)
 * @property {string} reason — for transaction description
 * @property {TaskType} [type] — 'penalty' for deductions (e.g. grades 2/3)
 * @property {boolean} [isDaily] — one completion per day (default true for routine/nutrition/base)
 */
/**
 * Food row: main button + optional modifiers.
 * @property {{ id, emoji, label, credits, reason }} main
 * @property {{ id, emoji, label, credits, reason }[]} modifiers
 */

export const TASK_CONFIG = {
  /** 1. УТРО — Morning routine */
  MORNING_ROUTINE: {
    label: 'УТРО',
    tasks: [
      { id: 'wake_up', emoji: '⏰', label: 'Проснулся САМ', credits: 30, reason: 'Утро: Проснулся сам' },
      { id: 'teeth_morning', emoji: '🦷', label: 'Зубы/Умыться', credits: 15, reason: 'Утро: Зубы/Умыться' },
      { id: 'make_bed', emoji: '🛏', label: 'Убрал постель', credits: 10, reason: 'Утро: Убрал постель' },
      { id: 'school_leave', emoji: '🎒', label: 'Ушел вовремя', credits: 20, reason: 'Утро: Ушел вовремя' },
    ],
  },

  /** 2. ШКОЛА — School & grades (dynamic input; grades include penalties) */
  SCHOOL_INTELLECT: {
    label: 'ШКОЛА',
    tasks: [
      { id: 'homework_base', emoji: '📚', label: 'Сделал уроки', credits: 50, reason: 'Школа: Уроки' },
      { id: 'homework_extra', emoji: '🧠', label: 'Доп. занятия', credits: 25, reason: 'Школа: Доп. занятия' },
      { id: 'grade_5_plus', emoji: '💎', label: 'Оценка 5+', credits: 100, reason: 'Школа: Оценка 5+' },
      { id: 'grade_5', emoji: '⭐️', label: 'Оценка 5', credits: 70, reason: 'Школа: Оценка 5' },
      { id: 'grade_4', emoji: '📘', label: 'Оценка 4', credits: 20, reason: 'Школа: Оценка 4' },
      { id: 'grade_3', emoji: '🔸', label: 'Оценка 3', credits: -20, type: 'penalty', reason: 'Школа: Оценка 3' },
      { id: 'grade_2', emoji: '🛑', label: 'Оценка 2', credits: -100, type: 'penalty', reason: 'Школа: Оценка 2' },
    ],
  },

  /** 3. ПИТАНИЕ — Nutrition: breakfast, lunch, snack, dinner (main + modifiers) */
  NUTRITION: {
    label: 'ПИТАНИЕ',
    foodComposite: [
      {
        main: { id: 'breakfast', emoji: '🍳', label: 'Завтрак', credits: 15, reason: 'Питание: Завтрак' },
        modifiers: [
          { id: 'breakfast_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Завтрак: Вовремя' },
          { id: 'breakfast_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Завтрак: Много' },
        ],
      },
      {
        main: { id: 'lunch', emoji: '🍔', label: 'Обед', credits: 20, reason: 'Питание: Обед' },
        modifiers: [
          { id: 'lunch_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Обед: Вовремя' },
          { id: 'lunch_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Обед: Много' },
        ],
      },
      {
        main: { id: 'snack', emoji: '🍪', label: 'Полдник', credits: 10, reason: 'Питание: Полдник' },
        modifiers: [],
      },
      {
        main: { id: 'dinner', emoji: '🍲', label: 'Ужин', credits: 15, reason: 'Питание: Ужин' },
        modifiers: [
          { id: 'dinner_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Ужин: Вовремя' },
          { id: 'dinner_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Ужин: Много' },
        ],
      },
    ],
  },

  /** 4. ДОМ И СОН — Base maintenance & sleep */
  BASE_MAINTENANCE: {
    label: 'ДОМ И СОН',
    tasks: [
      { id: 'help_mom', emoji: '🧹', label: 'Помощь маме', credits: 40, reason: 'Дом: Помощь маме' },
      { id: 'store_trash', emoji: '🛒', label: 'Магазин/Мусор', credits: 20, reason: 'Дом: Магазин/Мусор' },
      { id: 'prep_bed', emoji: '🛏', label: 'Расстелил постель', credits: 10, reason: 'Дом: Расстелил постель' },
      { id: 'sleep_time', emoji: '🌙', label: 'Лег вовремя', credits: 30, reason: 'Дом: Лег вовремя' },
    ],
  },
}

/** Legacy penalty box (separate danger zone): Крик, Медленно, Грубость, Драка. */
export const PENALTY_BOX = [
  { id: 'shout', emoji: '🗣', label: 'Крик/Спор', credits: -20, reason: 'Штраф: Крик/Спор' },
  { id: 'slow', emoji: '🐢', label: 'Медленно', credits: -10, reason: 'Штраф: Медленно' },
  { id: 'rude', emoji: '🤬', label: 'Грубость', credits: -50, reason: 'Штраф: Грубость' },
  { id: 'fight', emoji: '🥊', label: 'Драка', credits: -100, reason: 'Штраф: Драка' },
]

/**
 * Build tasks-by-category for MissionLog.
 * Returns { Morning, School, Nutrition, Base, foodComposite } with normalized task shape:
 * { id, label, reward, credits, reason, emoji, isDaily } for flat lists;
 * foodComposite: { main, modifiers } with same shape.
 */
export function getMissionTasksByCategory() {
  const morning = (TASK_CONFIG.MORNING_ROUTINE.tasks || []).map((a) => ({
    id: a.id,
    label: a.label,
    reward: a.credits,
    credits: a.credits,
    reason: a.reason,
    emoji: a.emoji,
    isDaily: true,
    type: a.type,
  }))

  const school = (TASK_CONFIG.SCHOOL_INTELLECT.tasks || []).map((a) => ({
    id: a.id,
    label: a.label,
    reward: a.credits,
    credits: a.credits,
    reason: a.reason,
    emoji: a.emoji,
    isDaily: false,
    type: a.type,
  }))

  const base = (TASK_CONFIG.BASE_MAINTENANCE.tasks || []).map((a) => ({
    id: a.id,
    label: a.label,
    reward: a.credits,
    credits: a.credits,
    reason: a.reason,
    emoji: a.emoji,
    isDaily: true,
    type: a.type,
  }))

  const foodComposite = (TASK_CONFIG.NUTRITION.foodComposite || []).map((row) => ({
    main: {
      id: row.main.id,
      label: row.main.label,
      reward: row.main.credits,
      credits: row.main.credits,
      reason: row.main.reason,
      emoji: row.main.emoji,
      isDaily: true,
    },
    modifiers: (row.modifiers || []).map((m) => ({
      id: m.id,
      label: m.label,
      reward: m.credits,
      credits: m.credits,
      reason: m.reason,
      emoji: m.emoji,
      isDaily: true,
    })),
  }))

  return {
    Morning: morning,
    School: school,
    Base: base,
    Food: [], // flat list unused; use foodComposite
    foodComposite,
  }
}
