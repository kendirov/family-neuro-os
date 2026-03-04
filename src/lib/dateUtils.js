/**
 * Форматирование дат на русском языке.
 * Genitive case для месяцев: "15 Октября", "4 Марта".
 */

const WEEKDAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

const MONTH_NAMES_GENITIVE = [
  'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
  'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря',
]

const DAY_LABELS_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ']

/**
 * Формат: "Среда, 4 Марта"
 * @param {Date} [d=new Date()]
 */
export function formatDateRuLong(d = new Date()) {
  const weekday = WEEKDAY_NAMES[d.getDay()]
  const day = d.getDate()
  const month = MONTH_NAMES_GENITIVE[d.getMonth()]
  return `${weekday}, ${day} ${month}`
}

/**
 * Короткие метки дней: ПН, ВТ, СР...
 * Индекс 0 = ВС, 1 = ПН, ..., 6 = СБ (getDay() order)
 */
export function getDayLabelShort(dayOfWeek) {
  return DAY_LABELS_SHORT[dayOfWeek] ?? '—'
}
