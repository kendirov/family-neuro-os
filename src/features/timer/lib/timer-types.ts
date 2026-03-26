export type PilotId = 'kirill' | 'roma' | (string & {})

export type TimerConnectionStatus = 'connecting' | 'live' | 'stale' | 'error'

export type TimerSessionStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'expired' | 'error'

export type TimerMode = 'game' | 'cartoons' | 'other'

export type TimerSessionSource = 'server' | 'mock'

export type TimerSession = {
  sessionId: string
  pilotId: PilotId
  status: TimerSessionStatus

  /**
   * Optional “budget”/plan for the session. If unknown (profiles-based state),
   * keep undefined and derive UI without pretending to know remaining time.
   */
  durationSeconds?: number

  /**
   * Present only when server provides a plan (endsAt) OR a tick snapshot.
   * UI must derive remaining time from serverNow + endsAt (display-only).
   */
  remainingSeconds?: number

  mode: TimerMode

  /** Server time from snapshot (ISO). */
  serverNow?: string
  startedAt?: string | null
  endsAt?: string | null
  pausedAt?: string | null
  updatedAt?: string | null

  source: TimerSessionSource
}

export type TimerSnapshot = {
  serverNow: string
  sessionsByPilotId: Record<string, TimerSession>
  activeSessionIds: Record<string, string | null>
}

export type TimerEvent =
  | { type: 'timer:snapshot'; snapshot: TimerSnapshot }
  | { type: 'timer:session-started'; pilotId: PilotId; session: TimerSession }
  | { type: 'timer:session-paused'; pilotId: PilotId; session: TimerSession }
  | { type: 'timer:session-resumed'; pilotId: PilotId; session: TimerSession }
  | { type: 'timer:session-stopped'; pilotId: PilotId; session: TimerSession }
  | { type: 'timer:session-adjusted'; pilotId: PilotId; session: TimerSession }
  | { type: 'timer:error'; message: string; detail?: unknown }
  | { type: 'timer:connection-lost'; message?: string }

