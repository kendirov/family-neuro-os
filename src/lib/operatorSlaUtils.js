/**
 * Утилиты для Operator SLA: дедлайны, статусы, countdown.
 */
function getDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/** Дедлайн сегодня в ms (00:00 + HH:mm). */
export function getDeadlineTs(deadlineTime, date = new Date()) {
  const [h, m] = deadlineTime.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

/** Оставшиеся секунды до дедлайна. Отрицательно = просрочено. */
export function getSecondsRemaining(deadlineTime, now = new Date()) {
  const deadline = getDeadlineTs(deadlineTime, now)
  return Math.floor((deadline - now.getTime()) / 1000)
}

/** Форматировать countdown: "12:34" или "−5:00" при просрочке. */
export function formatCountdown(seconds) {
  const abs = Math.abs(seconds)
  const m = Math.floor(abs / 60)
  const s = abs % 60
  const sign = seconds < 0 ? '−' : ''
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Статус SLA: pending | completed | failed. */
export function getSlaStatus(sla, completed, now = new Date()) {
  if (completed) return 'completed'
  const sec = getSecondsRemaining(sla.deadlineTime, now)
  return sec <= 0 ? 'failed' : 'pending'
}

/** Загрузить состояние SLA за сегодня из localStorage. */
export function loadSlaState() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const key = `family_operator_sla_${getDateKey()}`
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Сохранить состояние SLA. */
export function saveSlaState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    const key = `family_operator_sla_${getDateKey()}`
    localStorage.setItem(key, JSON.stringify(state))
  } catch {}
}
