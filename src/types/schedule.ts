/**
 * Schedule types — Admin Schedule Editor.
 * Каждый день — массив слотов с id, временем и предметом.
 */

/** День недели: ПН–ПТ */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

/** Слот урока в расписании */
export interface ScheduleSlot {
  id: string
  dayOfWeek: DayOfWeek
  subject: string
  startTime: string // HH:mm
  endTime: string   // HH:mm
}

/** Расписание на день для одного пилота */
export type DaySlots = ScheduleSlot[]

/** Расписание на неделю: день → пилот → слоты */
export interface WeeklySchedule {
  mon: { roma: DaySlots; kirill: DaySlots }
  tue: { roma: DaySlots; kirill: DaySlots }
  wed: { roma: DaySlots; kirill: DaySlots }
  thu: { roma: DaySlots; kirill: DaySlots }
  fri: { roma: DaySlots; kirill: DaySlots }
}

/** ID пилота (ребёнка) */
export type PilotId = 'roma' | 'kirill'
