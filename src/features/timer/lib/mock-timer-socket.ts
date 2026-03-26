import type { PilotId, TimerEvent, TimerMode, TimerSession, TimerSnapshot } from './timer-types'

type Listener = (ev: TimerEvent) => void

type MockState = {
  serverNow: string
  sessionsByPilotId: Record<string, TimerSession>
  activeSessionIds: Record<string, string | null>
}

function nowIso() {
  return new Date().toISOString()
}

function makeSessionId() {
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toMode(raw: string): TimerMode {
  if (raw === 'game') return 'game'
  if (raw === 'cartoons') return 'cartoons'
  return 'other'
}

export type MockTimerSocket = {
  connect: () => void
  disconnect: () => void
  onEvent: (cb: Listener) => () => void

  /** Dev helpers (not used by prod UI directly). */
  getState: () => MockState
  emitConnectionLost: () => void
  start: (pilotId: PilotId, mode: TimerMode, durationSeconds?: number) => void
  pause: (pilotId: PilotId) => void
  resume: (pilotId: PilotId) => void
  stop: (pilotId: PilotId) => void
  snapshot: () => void
}

export function createMockTimerSocket(pilotIds: PilotId[] = ['kirill', 'roma']): MockTimerSocket {
  const listeners = new Set<Listener>()
  let connected = false
  let tickHandle: ReturnType<typeof setInterval> | null = null

  const state: MockState = {
    serverNow: nowIso(),
    sessionsByPilotId: Object.fromEntries(
      pilotIds.map((id) => [
        id,
        {
          sessionId: `idle-${id}`,
          pilotId: id,
          status: 'idle',
          mode: 'other',
          source: 'mock',
          serverNow: nowIso(),
          startedAt: null,
          endsAt: null,
          pausedAt: null,
          updatedAt: nowIso(),
        } satisfies TimerSession,
      ])
    ),
    activeSessionIds: Object.fromEntries(pilotIds.map((id) => [id, null])),
  }

  const emit = (ev: TimerEvent) => listeners.forEach((l) => l(ev))

  const tick = () => {
    state.serverNow = nowIso()
    const snap: TimerSnapshot = {
      serverNow: state.serverNow,
      sessionsByPilotId: state.sessionsByPilotId,
      activeSessionIds: state.activeSessionIds,
    }
    emit({ type: 'timer:snapshot', snapshot: snap })
  }

  return {
    connect() {
      if (connected) return
      connected = true
      emit({ type: 'timer:snapshot', snapshot: { serverNow: state.serverNow, sessionsByPilotId: state.sessionsByPilotId, activeSessionIds: state.activeSessionIds } })
      tickHandle = setInterval(tick, 1000)
    },
    disconnect() {
      connected = false
      if (tickHandle) clearInterval(tickHandle)
      tickHandle = null
    },
    onEvent(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    getState() {
      return state
    },
    emitConnectionLost() {
      emit({ type: 'timer:connection-lost', message: 'Mock connection lost' })
    },

    start(pilotId, mode, durationSeconds) {
      const id = makeSessionId()
      const startedAt = nowIso()
      const endsAt = durationSeconds ? new Date(Date.now() + durationSeconds * 1000).toISOString() : null
      const session: TimerSession = {
        sessionId: id,
        pilotId,
        status: 'running',
        mode: toMode(mode),
        durationSeconds,
        endsAt,
        startedAt,
        pausedAt: null,
        updatedAt: nowIso(),
        serverNow: state.serverNow,
        source: 'mock',
      }
      state.sessionsByPilotId[pilotId] = session
      state.activeSessionIds[pilotId] = id
      emit({ type: 'timer:session-started', pilotId, session })
    },
    pause(pilotId) {
      const prev = state.sessionsByPilotId[pilotId]
      if (!prev || prev.status !== 'running') return
      const session: TimerSession = { ...prev, status: 'paused', pausedAt: nowIso(), updatedAt: nowIso(), serverNow: state.serverNow }
      state.sessionsByPilotId[pilotId] = session
      emit({ type: 'timer:session-paused', pilotId, session })
    },
    resume(pilotId) {
      const prev = state.sessionsByPilotId[pilotId]
      if (!prev || prev.status !== 'paused') return
      const session: TimerSession = { ...prev, status: 'running', pausedAt: null, updatedAt: nowIso(), serverNow: state.serverNow }
      state.sessionsByPilotId[pilotId] = session
      emit({ type: 'timer:session-resumed', pilotId, session })
    },
    stop(pilotId) {
      const prev = state.sessionsByPilotId[pilotId]
      if (!prev || (prev.status !== 'running' && prev.status !== 'paused')) return
      const session: TimerSession = { ...prev, status: 'stopped', updatedAt: nowIso(), serverNow: state.serverNow }
      state.sessionsByPilotId[pilotId] = session
      state.activeSessionIds[pilotId] = null
      emit({ type: 'timer:session-stopped', pilotId, session })
    },
    snapshot() {
      tick()
    },
  }
}

