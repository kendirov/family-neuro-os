import type { TimerSession } from './timer-types'

export function isSessionActive(s: TimerSession | undefined | null) {
  return !!s && (s.status === 'running' || s.status === 'paused')
}

export function deriveRemainingSeconds(session: TimerSession, nowMs: number) {
  if (typeof session.remainingSeconds === 'number') return Math.max(0, Math.floor(session.remainingSeconds))
  if (!session.endsAt) return null
  const endMs = new Date(session.endsAt).getTime()
  const rem = Math.floor((endMs - nowMs) / 1000)
  return Math.max(0, rem)
}

