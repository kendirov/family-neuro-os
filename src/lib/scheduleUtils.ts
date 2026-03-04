/**
 * Утилиты расписания: миграция форматов, генерация id.
 */
import type { DayOfWeek, PilotId, ScheduleSlot, WeeklySchedule } from '@/types/schedule'
import { WEEKLY_SCHEDULE } from '@/data/weeklySchedule'

const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const STORAGE_KEY = 'family_weekly_schedule'

/** Генерирует уникальный id для слота */
export function generateSlotId(): string {
  return `slot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Старый формат урока из weeklySchedule.js */
interface LegacyLesson {
  start: string
  end: string
  name: string
}

/** Конвертирует старый формат в новый ScheduleSlot */
function legacyToSlot(lesson: LegacyLesson, dayOfWeek: DayOfWeek, pilotId: PilotId): ScheduleSlot {
  return {
    id: generateSlotId(),
    dayOfWeek,
    subject: lesson.name,
    startTime: lesson.start,
    endTime: lesson.end,
  }
}

/** Конвертирует WEEKLY_SCHEDULE (старый формат) в WeeklySchedule (новый) */
export function migrateFromLegacy(): WeeklySchedule {
  const result: WeeklySchedule = {
    mon: { roma: [], kirill: [] },
    tue: { roma: [], kirill: [] },
    wed: { roma: [], kirill: [] },
    thu: { roma: [], kirill: [] },
    fri: { roma: [], kirill: [] },
  }

  DAY_KEYS.forEach((dayKey) => {
    const dayData = WEEKLY_SCHEDULE[dayKey]
    if (!dayData) return
    result[dayKey].roma = (dayData.roma ?? []).map((l: LegacyLesson) =>
      legacyToSlot(l, dayKey, 'roma')
    )
    result[dayKey].kirill = (dayData.kirill ?? []).map((l: LegacyLesson) =>
      legacyToSlot(l, dayKey, 'kirill')
    )
  })

  return result
}

/** Конвертирует новый формат в старый (для обратной совместимости) */
export function toLegacyFormat(schedule: WeeklySchedule): Record<string, { roma: LegacyLesson[]; kirill: LegacyLesson[] }> {
  const result: Record<string, { roma: LegacyLesson[]; kirill: LegacyLesson[] }> = {}
  DAY_KEYS.forEach((dayKey) => {
    result[dayKey] = {
      roma: schedule[dayKey].roma.map((s) => ({ start: s.startTime, end: s.endTime, name: s.subject })),
      kirill: schedule[dayKey].kirill.map((s) => ({ start: s.startTime, end: s.endTime, name: s.subject })),
    }
  })
  return result
}

/** Загружает расписание из localStorage или возвращает мигрированное из статики */
export function loadSchedule(): WeeklySchedule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as WeeklySchedule
      if (parsed?.mon?.roma) return parsed
    }
  } catch {
    // ignore
  }
  return migrateFromLegacy()
}

/** Сохраняет расписание в localStorage */
export function saveSchedule(schedule: WeeklySchedule): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
  } catch {
    // ignore
  }
}
