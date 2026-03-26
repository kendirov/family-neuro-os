import type { PilotId, TimerConnectionStatus, TimerMode, TimerSession, TimerSessionStatus } from '@/features/timer/lib/timer-types'

export function formatHms(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function pilotLabel(pilotId: PilotId) {
  if (pilotId === 'kirill') return 'Кирилл'
  if (pilotId === 'roma') return 'Рома'
  return String(pilotId)
}

export function modeLabel(mode: TimerMode) {
  if (mode === 'game') return 'Игры'
  if (mode === 'cartoons') return 'Мультики'
  return 'Другое'
}

export function statusLabel(status: TimerSessionStatus) {
  if (status === 'running') return 'Активно'
  if (status === 'paused') return 'Пауза'
  if (status === 'idle') return 'Ожидание'
  if (status === 'stopped') return 'Остановлено'
  if (status === 'expired') return 'Истекло'
  return 'Ошибка'
}

export function connectionCopy(status: TimerConnectionStatus) {
  if (status === 'live') return { tone: 'ok' as const, label: 'Live' }
  if (status === 'connecting') return { tone: 'warn' as const, label: 'Подключение…' }
  if (status === 'stale') return { tone: 'warn' as const, label: 'Данные устарели' }
  return { tone: 'bad' as const, label: 'Ошибка связи' }
}

export function isSessionActive(session: TimerSession | null | undefined) {
  return !!session && (session.status === 'running' || session.status === 'paused')
}

