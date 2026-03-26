import type { PilotId, TimerMode } from './timer-types'
import { useTimerStore } from '../store/useTimerStore'
import { useAppStore } from '@/stores/useAppStore'
import { createMockTimerTransport } from './mock-timer-transport'

type StartArgs = { pilotId: PilotId | 'both'; durationMinutes: number; mode: TimerMode }
type SessionArgs = { sessionId: string }
type AdjustArgs = { sessionId: string; deltaMinutes: number }

type TransportKind = 'profiles' | 'mock'

function getTransportKind(): TransportKind {
  const raw = (import.meta as any)?.env?.VITE_TIMER_TRANSPORT
  if (raw === 'mock') return 'mock'
  return 'profiles'
}

let mockTransportSingleton: ReturnType<typeof createMockTimerTransport> | null = null

function getMockTransport() {
  if (!mockTransportSingleton) mockTransportSingleton = createMockTimerTransport(['kirill', 'roma'])
  return mockTransportSingleton
}

function getPilotIdsFromTarget(pilotId: PilotId | 'both') {
  return pilotId === 'both' ? (['kirill', 'roma'] as PilotId[]) : ([pilotId] as PilotId[])
}

function resolvePilotIdBySessionId(sessionId: string): PilotId | null {
  const state = useTimerStore.getState()
  const entries = Object.entries(state.sessionsByPilotId ?? {})
  const found = entries.find(([, s]) => s?.sessionId === sessionId)
  return (found?.[0] as PilotId) ?? null
}

async function startViaProfiles(args: StartArgs) {
  const ids = getPilotIdsFromTarget(args.pilotId)
  const startTimer = useAppStore.getState().startTimer
  for (const id of ids) {
    // eslint-disable-next-line no-await-in-loop
    await startTimer(id as any, args.mode === 'cartoons' ? 'youtube' : args.mode === 'game' ? 'game' : 'game')
  }
}

async function pauseViaProfiles({ sessionId }: SessionArgs) {
  const pilotId = resolvePilotIdBySessionId(sessionId)
  if (!pilotId) return
  await useAppStore.getState().pauseTimer(pilotId as any)
}

async function resumeViaProfiles({ sessionId }: SessionArgs) {
  const pilotId = resolvePilotIdBySessionId(sessionId)
  if (!pilotId) return
  await useAppStore.getState().resumeTimer(pilotId as any)
}

async function stopViaProfiles({ sessionId }: SessionArgs) {
  const pilotId = resolvePilotIdBySessionId(sessionId)
  if (!pilotId) return
  await useAppStore.getState().stopTimer(pilotId as any)
}

async function adjustViaProfiles({ sessionId, deltaMinutes }: AdjustArgs) {
  const pilotId = resolvePilotIdBySessionId(sessionId)
  if (!pilotId) return
  const delta = Math.floor(deltaMinutes)
  if (!delta) return

  // In TG economy: +minutes == add XP, -minutes == spend XP.
  if (delta > 0) {
    await useAppStore.getState().addPointsRemote(pilotId as any, delta, 'Таймер: корректировка (+мин)')
  } else {
    await useAppStore.getState().spendPointsRemote(pilotId as any, Math.abs(delta), 'Таймер: корректировка (-мин)')
  }
}

/**
 * Public command API (stable surface).
 * Page/UI should call these, not poke stores directly.
 */
export const timerCommands = {
  ensureConnected() {
    if (getTransportKind() !== 'mock') return
    const transport = getMockTransport()
    const off = transport.onEvent((ev) => useTimerStore.getState().applyServerEvent(ev))
    transport.connect()
    return () => off()
  },

  async startTimer(args: StartArgs) {
    if (import.meta.env.DEV) console.log('[TG_TIMER] cmd startTimer', args)
    useTimerStore.getState().optimisticStartRequested(args.pilotId as any)

    if (getTransportKind() === 'mock') {
      const transport = getMockTransport()
      const ids = getPilotIdsFromTarget(args.pilotId)
      ids.forEach((id) => transport.startTimer({ pilotId: id, durationMinutes: args.durationMinutes, mode: args.mode }))
      return
    }
    return startViaProfiles(args)
  },

  async pauseTimer({ sessionId }: SessionArgs) {
    if (import.meta.env.DEV) console.log('[TG_TIMER] cmd pauseTimer', { sessionId })
    if (getTransportKind() === 'mock') {
      const pilotId = resolvePilotIdBySessionId(sessionId)
      if (!pilotId) return
      getMockTransport().pauseTimer({ pilotId })
      return
    }
    return pauseViaProfiles({ sessionId })
  },

  async resumeTimer({ sessionId }: SessionArgs) {
    if (import.meta.env.DEV) console.log('[TG_TIMER] cmd resumeTimer', { sessionId })
    if (getTransportKind() === 'mock') {
      const pilotId = resolvePilotIdBySessionId(sessionId)
      if (!pilotId) return
      getMockTransport().resumeTimer({ pilotId })
      return
    }
    return resumeViaProfiles({ sessionId })
  },

  async emergencyStopTimer({ sessionId }: SessionArgs) {
    if (import.meta.env.DEV) console.log('[TG_TIMER] cmd emergencyStopTimer', { sessionId })
    if (getTransportKind() === 'mock') {
      const pilotId = resolvePilotIdBySessionId(sessionId)
      if (!pilotId) return
      getMockTransport().emergencyStopTimer({ pilotId })
      return
    }
    return stopViaProfiles({ sessionId })
  },

  async adjustTimerMinutes({ sessionId, deltaMinutes }: AdjustArgs) {
    if (import.meta.env.DEV) console.log('[TG_TIMER] cmd adjustTimerMinutes', { sessionId, deltaMinutes })
    if (getTransportKind() === 'mock') {
      const pilotId = resolvePilotIdBySessionId(sessionId)
      if (!pilotId) return
      getMockTransport().adjustTimerMinutes({ pilotId, deltaMinutes })
      return
    }
    return adjustViaProfiles({ sessionId, deltaMinutes })
  },

  dev: {
    connectionLost() {
      if (getTransportKind() !== 'mock') return
      getMockTransport().emitConnectionLost()
    },
    reconnect() {
      if (getTransportKind() !== 'mock') return
      getMockTransport().emitReconnect()
    },
  },
}

