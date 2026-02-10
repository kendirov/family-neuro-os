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
      { id: 'wake_up', emoji: '⏰', label: 'Проснулся сам', credits: 30, reason: 'Режим дня: Проснулся сам' },
      { id: 'teeth_morning', emoji: '🦷', label: 'Зубы/Умылся', credits: 15, reason: 'Режим дня: Зубы/Умылся' },
      { id: 'make_bed', emoji: '🛏', label: 'Убрал постель', credits: 10, reason: 'Режим дня: Убрал постель' },
    ],
  },

  /** 2. ШКОЛА — School & grades (dynamic input; grades include penalties) */
  SCHOOL_INTELLECT: {
    label: 'ШКОЛА',
    tasks: [
      { id: 'homework_base', emoji: '📚', label: 'Сделал уроки', credits: 50, reason: 'Школа: Уроки' },
      { id: 'homework_extra', emoji: '🧠', label: 'Доп. занятия', credits: 25, reason: 'Школа: Доп. занятия' },
      // Routine school prep
      { id: 'school_leave', emoji: '🎒', label: 'Ушел вовремя', credits: 20, reason: 'Школа: Ушел вовремя' },
      { id: 'pack_bag', emoji: '🎒', label: 'Собрал портфель', credits: 15, reason: 'Школа: Собрал портфель' },
      // Grades (repeatable)
      { id: 'grade_5_plus', emoji: '💎', label: 'Оценка 5+', credits: 50, reason: 'Школа: Оценка 5+' },
      { id: 'grade_5', emoji: '⭐️', label: 'Оценка 5', credits: 40, reason: 'Школа: Оценка 5' },
      { id: 'grade_4', emoji: '📘', label: 'Оценка 4', credits: 20, reason: 'Школа: Оценка 4' },
      { id: 'grade_3', emoji: '🔸', label: 'Оценка 3', credits: -10, type: 'penalty', reason: 'Школа: Оценка 3' },
      { id: 'grade_2', emoji: '🛑', label: 'Оценка 2', credits: -50, type: 'penalty', reason: 'Школа: Оценка 2' },
    ],
  },

  /** 3. ПИТАНИЕ — Nutrition: breakfast, lunch, snack, dinner (main + modifiers) */
  NUTRITION: {
    label: 'ПИТАНИЕ',
    foodComposite: [
      {
        main: { id: 'breakfast', emoji: '🍳', label: 'Завтрак', credits: 20, reason: 'Питание: Завтрак' },
        // Бонусы привязаны к конкретному приёму пищи
        modifiers: [
          {
            id: 'breakfast_all',
            emoji: '🍽️',
            label: 'Съел всё',
            credits: 10,
            reason: 'Питание: Завтрак — съел всё',
          },
          {
            id: 'breakfast_ontime',
            emoji: '⏱',
            label: 'Вовремя',
            credits: 5,
            reason: 'Питание: Завтрак — вовремя',
          },
          {
            id: 'breakfast_dishes',
            emoji: '🧽',
            label: 'Посуда',
            credits: 10,
            reason: 'Питание: Завтрак — посуда',
          },
        ],
      },
      {
        main: { id: 'lunch', emoji: '🍔', label: 'Обед', credits: 20, reason: 'Питание: Обед' },
        modifiers: [
          {
            id: 'lunch_all',
            emoji: '🍽️',
            label: 'Съел всё',
            credits: 10,
            reason: 'Питание: Обед — съел всё',
          },
          {
            id: 'lunch_ontime',
            emoji: '⏱',
            label: 'Вовремя',
            credits: 5,
            reason: 'Питание: Обед — вовремя',
          },
          {
            id: 'lunch_dishes',
            emoji: '🧽',
            label: 'Посуда',
            credits: 10,
            reason: 'Питание: Обед — посуда',
          },
        ],
      },
      {
        main: { id: 'snack', emoji: '🍪', label: 'Полдник', credits: 10, reason: 'Питание: Полдник' },
        modifiers: [],
      },
      {
        main: { id: 'dinner', emoji: '🍲', label: 'Ужин', credits: 20, reason: 'Питание: Ужин' },
        modifiers: [
          {
            id: 'dinner_all',
            emoji: '🍽️',
            label: 'Съел всё',
            credits: 10,
            reason: 'Питание: Ужин — съел всё',
          },
          {
            id: 'dinner_ontime',
            emoji: '⏱',
            label: 'Вовремя',
            credits: 5,
            reason: 'Питание: Ужин — вовремя',
          },
          {
            id: 'dinner_dishes',
            emoji: '🧽',
            label: 'Посуда',
            credits: 10,
            reason: 'Питание: Ужин — посуда',
          },
        ],
      },
    ],
  },

  /** 4. ДОМ И СОН — Base maintenance & sleep */
  BASE_MAINTENANCE: {
    label: 'ДОМ И СОН',
    tasks: [
      { id: 'help_clean', emoji: '🧹', label: 'Уборка', credits: 40, reason: 'Дом: Уборка' },
      { id: 'take_trash', emoji: '🗑️', label: 'Мусор', credits: 20, reason: 'Дом: Мусор' },
      { id: 'go_store', emoji: '🛒', label: 'Магазин', credits: 30, reason: 'Дом: Магазин' },
      { id: 'sleep_time', emoji: '🌙', label: 'Спать вовремя', credits: 50, reason: 'Сон: Спать вовремя' },
    ],
  },
}

/** Legacy penalty box (separate danger zone): Крик, Медленно, Грубость, Драка. */
export const PENALTY_BOX = [
  { id: 'shout_meltdown', emoji: '🗯️', label: 'Крик/Истерика', credits: -50, reason: 'Штраф: Крик/Истерика' },
  { id: 'mess_room', emoji: '💥', label: 'Бардак', credits: -20, reason: 'Штраф: Бардак' },
  { id: 'fight', emoji: '🥊', label: 'Драка', credits: -70, reason: 'Штраф: Драка' },
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
