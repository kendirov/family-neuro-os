import { create } from 'zustand'
import { shallow } from 'zustand/shallow'
import type {
  PilotId,
  TimerConnectionStatus,
  TimerEvent,
  TimerSession,
  TimerSnapshot,
} from '../lib/timer-types'

type TimerStoreState = {
  sessionsByPilotId: Record<string, TimerSession>
  activeSessionIds: Record<string, string | null>

  connectionStatus: TimerConnectionStatus
  lastServerTickAt: string | null
  lastError: string | null

  selectedPilotId: PilotId | 'both' | null
  uiDraftDurationMinutes: number
  uiDraftCustomMinutes: number | null
}

type TimerStoreActions = {
  setSelectedPilot: (pilotId: TimerStoreState['selectedPilotId']) => void
  setDraftDuration: (minutes: number) => void
  setDraftCustomMinutes: (minutes: number | null) => void

  setConnectionStatus: (status: TimerConnectionStatus) => void
  setTimerError: (message: string | null) => void
  clearTimerError: () => void

  applyServerSnapshot: (snapshot: TimerSnapshot) => void
  applyServerEvent: (event: TimerEvent) => void

  /** Optional UX affordance (never authoritative). */
  optimisticStartRequested: (pilotId: PilotId | 'both') => void
}

export type TimerStore = TimerStoreState & TimerStoreActions

function nowIso() {
  return new Date().toISOString()
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  sessionsByPilotId: {},
  activeSessionIds: {},

  connectionStatus: 'connecting',
  lastServerTickAt: null,
  lastError: null,

  selectedPilotId: 'both',
  uiDraftDurationMinutes: 30,
  uiDraftCustomMinutes: null,

  setSelectedPilot: (pilotId) => set({ selectedPilotId: pilotId }),
  setDraftDuration: (minutes) => set({ uiDraftDurationMinutes: Math.max(0, Math.floor(minutes)) }),
  setDraftCustomMinutes: (minutes) =>
    set({ uiDraftCustomMinutes: minutes == null ? null : Math.max(0, Math.floor(minutes)) }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setTimerError: (message) => set({ lastError: message }),
  clearTimerError: () => set({ lastError: null }),

  applyServerSnapshot: (snapshot) => {
    set({
      sessionsByPilotId: snapshot.sessionsByPilotId ?? {},
      activeSessionIds: snapshot.activeSessionIds ?? {},
      lastServerTickAt: snapshot.serverNow ?? nowIso(),
      connectionStatus: 'live',
      lastError: null,
    })
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[TG_TIMER] snapshot', {
        pilots: Object.keys(snapshot.sessionsByPilotId ?? {}).length,
        serverNow: snapshot.serverNow,
      })
    }
  },

  applyServerEvent: (event) => {
    if (event.type === 'timer:snapshot') {
      get().applyServerSnapshot(event.snapshot)
      return
    }

    if (event.type === 'timer:error') {
      set({ connectionStatus: 'error', lastError: event.message })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[TG_TIMER] error', event)
      }
      return
    }

    if (event.type === 'timer:connection-lost') {
      set({ connectionStatus: 'stale', lastError: event.message ?? null })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[TG_TIMER] connection-lost', event)
      }
      return
    }

    // Session mutation events
    const pilotId = (event as any).pilotId as string | undefined
    const session = (event as any).session as TimerSession | undefined
    if (!pilotId || !session) return

    set((s) => ({
      sessionsByPilotId: { ...(s.sessionsByPilotId ?? {}), [pilotId]: session },
      activeSessionIds: {
        ...(s.activeSessionIds ?? {}),
        [pilotId]:
          session.status === 'running' || session.status === 'paused'
            ? session.sessionId
            : null,
      },
      lastServerTickAt: session.serverNow ?? s.lastServerTickAt ?? nowIso(),
      connectionStatus: 'live',
      lastError: null,
    }))

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[TG_TIMER] event', event.type, { pilotId, status: session.status })
    }
  },

  optimisticStartRequested: (pilotId) => {
    // This is intentionally not authoritative; it can only help UI feel responsive
    // while waiting for the server snapshot to arrive.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[TG_TIMER] optimisticStartRequested', { pilotId })
    }
  },
}))

export { shallow }

