function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * Convert "now" to a YYYY-MM-DD date string in the provided IANA timezone.
 * Used to keep projections aligned with family timezone.
 */
export function getLocalDateStringInTimezone(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value

  if (!year || !month || !day) throw new Error('Failed to compute local date in timezone')
  return `${year}-${pad2(month)}-${pad2(day)}`
}

