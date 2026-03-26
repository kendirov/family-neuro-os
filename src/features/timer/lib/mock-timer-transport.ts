import type { PilotId, TimerEvent, TimerMode } from './timer-types'
import { createMockTimerSocket } from './mock-timer-socket'

type Listener = (ev: TimerEvent) => void

export type TimerTransport = {
  connect: () => void
  disconnect: () => void
  onEvent: (cb: Listener) => () => void

  emitConnectionLost: () => void
  emitReconnect: () => void

  startTimer: (args: { pilotId: PilotId; durationMinutes: number; mode: TimerMode }) => void
  pauseTimer: (args: { pilotId: PilotId }) => void
  resumeTimer: (args: { pilotId: PilotId }) => void
  emergencyStopTimer: (args: { pilotId: PilotId }) => void
  adjustTimerMinutes: (args: { pilotId: PilotId; deltaMinutes: number }) => void
}

function clampInt(n: number) {
  return Math.max(0, Math.floor(n))
}

/**
 * Mock transport for dev/testing.
 * - Emits the future event contract (timer:*)
 * - Owns its own server-ish tick (allowed: it represents the server)
 * - Never relies on page-local React state.
 */
export function createMockTimerTransport(pilotIds: PilotId[] = ['kirill', 'roma']): TimerTransport {
  const socket = createMockTimerSocket(pilotIds)
  let connected = false

  return {
    connect() {
      if (connected) return
      connected = true
      socket.connect()
      if (import.meta.env.DEV) console.log('[TG_TIMER] mock transport connected')
    },
    disconnect() {
      connected = false
      socket.disconnect()
      if (import.meta.env.DEV) console.log('[TG_TIMER] mock transport disconnected')
    },
    onEvent(cb) {
      return socket.onEvent(cb)
    },

    emitConnectionLost() {
      socket.emitConnectionLost()
    },
    emitReconnect() {
      // reconnect == force fresh snapshot
      socket.snapshot()
    },

    startTimer({ pilotId, durationMinutes, mode }) {
      socket.start(pilotId, mode, clampInt(durationMinutes) * 60)
      socket.snapshot()
    },
    pauseTimer({ pilotId }) {
      socket.pause(pilotId)
      socket.snapshot()
    },
    resumeTimer({ pilotId }) {
      socket.resume(pilotId)
      socket.snapshot()
    },
    emergencyStopTimer({ pilotId }) {
      socket.stop(pilotId)
      socket.snapshot()
    },
    adjustTimerMinutes({ pilotId, deltaMinutes }) {
      const st = socket.getState()
      const current = st.sessionsByPilotId[pilotId]
      if (!current || (current.status !== 'running' && current.status !== 'paused')) return

      const deltaSec = clampInt(deltaMinutes) * 60
      const baseEnd = current.endsAt ? new Date(current.endsAt).getTime() : Date.now()
      const nextEndMs = baseEnd + deltaSec * 1000
      const next = {
        ...current,
        endsAt: new Date(nextEndMs).toISOString(),
        updatedAt: new Date().toISOString(),
        serverNow: new Date().toISOString(),
      }
      st.sessionsByPilotId[pilotId] = next as any
      socket.snapshot()
    },
  }
}

