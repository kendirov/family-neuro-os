/**
 * Full Weekly School Schedule — Shift Logic.
 * Roma: 1-я смена (08:00), 5 lessons/day, 45 min + breaks.
 * Kirill: 2-я смена (13:20), 4–5 lessons/day.
 * Keys: mon..fri (weekday only).
 */

/** @typedef {{ start: string, end: string, name: string }} Lesson */

/**
 * Monday–Friday. getDay(): 1=Mon .. 5=Fri.
 * @type {Record<string, { roma: Lesson[], kirill: Lesson[] }>}
 */
export const WEEKLY_SCHEDULE = {
  mon: {
    roma: [
      { start: '08:00', end: '08:45', name: 'Математика' },
      { start: '09:00', end: '09:45', name: 'Русский язык' },
      { start: '10:00', end: '10:45', name: 'Литература' },
      { start: '11:00', end: '11:45', name: 'Английский' },
      { start: '12:00', end: '12:45', name: 'Физкультура' },
    ],
    kirill: [
      { start: '13:20', end: '14:05', name: 'Математика' },
      { start: '14:15', end: '15:00', name: 'Окружающий мир' },
      { start: '15:10', end: '15:55', name: 'ИЗО' },
      { start: '16:05', end: '16:50', name: 'Технология' },
      { start: '17:00', end: '17:45', name: 'Русский язык' },
    ],
  },
  tue: {
    roma: [
      { start: '08:00', end: '08:45', name: 'Русский язык' },
      { start: '09:00', end: '09:45', name: 'Математика' },
      { start: '10:00', end: '10:45', name: 'Английский' },
      { start: '11:00', end: '11:45', name: 'Физкультура' },
      { start: '12:00', end: '12:45', name: 'Литература' },
    ],
    kirill: [
      { start: '13:20', end: '14:05', name: 'Русский язык' },
      { start: '14:15', end: '15:00', name: 'Математика' },
      { start: '15:10', end: '15:55', name: 'Окружающий мир' },
      { start: '16:05', end: '16:50', name: 'ИЗО' },
    ],
  },
  wed: {
    roma: [
      { start: '08:00', end: '08:45', name: 'Литература' },
      { start: '09:00', end: '09:45', name: 'Математика' },
      { start: '10:00', end: '10:45', name: 'Русский язык' },
      { start: '11:00', end: '11:45', name: 'Английский' },
      { start: '12:00', end: '12:45', name: 'Физкультура' },
    ],
    kirill: [
      { start: '13:20', end: '14:05', name: 'Технология' },
      { start: '14:15', end: '15:00', name: 'Русский язык' },
      { start: '15:10', end: '15:55', name: 'Математика' },
      { start: '16:05', end: '16:50', name: 'Окружающий мир' },
    ],
  },
  thu: {
    roma: [
      { start: '08:00', end: '08:45', name: 'Английский' },
      { start: '09:00', end: '09:45', name: 'Литература' },
      { start: '10:00', end: '10:45', name: 'Математика' },
      { start: '11:00', end: '11:45', name: 'Русский язык' },
      { start: '12:00', end: '12:45', name: 'Физкультура' },
    ],
    kirill: [
      { start: '13:20', end: '14:05', name: 'ИЗО' },
      { start: '14:15', end: '15:00', name: 'Технология' },
      { start: '15:10', end: '15:55', name: 'Русский язык' },
      { start: '16:05', end: '16:50', name: 'Математика' },
      { start: '17:00', end: '17:45', name: 'Окружающий мир' },
    ],
  },
  fri: {
    roma: [
      { start: '08:00', end: '08:45', name: 'Физкультура' },
      { start: '09:00', end: '09:45', name: 'Математика' },
      { start: '10:00', end: '10:45', name: 'Русский язык' },
      { start: '11:00', end: '11:45', name: 'Литература' },
      { start: '12:00', end: '12:45', name: 'Английский' },
    ],
    kirill: [
      { start: '13:20', end: '14:05', name: 'Математика' },
      { start: '14:15', end: '15:00', name: 'Русский язык' },
      { start: '15:10', end: '15:55', name: 'Окружающий мир' },
      { start: '16:05', end: '16:50', name: 'Технология' },
    ],
  },
}

/** getDay() 1=Mon .. 5=Fri -> schedule key */
export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']
export const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ']

export function getScheduleKey(dayOfWeek) {
  if (dayOfWeek >= 1 && dayOfWeek <= 5) return DAY_KEYS[dayOfWeek - 1]
  return null
}
