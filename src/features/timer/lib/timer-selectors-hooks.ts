import { useMemo } from 'react'
import type { PilotId, TimerSession } from './timer-types'
import { useTimerStore, shallow } from '../store/useTimerStore'

export function useTimerConnectionState() {
  return useTimerStore(
    (s) => ({ connectionStatus: s.connectionStatus, lastServerTickAt: s.lastServerTickAt, lastError: s.lastError }),
    shallow
  )
}

export function useTimerDraftState() {
  return useTimerStore(
    (s) => ({
      selectedPilotId: s.selectedPilotId,
      uiDraftDurationMinutes: s.uiDraftDurationMinutes,
      uiDraftCustomMinutes: s.uiDraftCustomMinutes,
      setSelectedPilot: s.setSelectedPilot,
      setDraftDuration: s.setDraftDuration,
      setDraftCustomMinutes: s.setDraftCustomMinutes,
    }),
    shallow
  )
}

export function useSelectedPilotTimer() {
  return useTimerStore((s) => {
    if (!s.selectedPilotId || s.selectedPilotId === 'both') return null
    return s.sessionsByPilotId?.[s.selectedPilotId] ?? null
  })
}

export function useActiveTimerSessions(): TimerSession[] {
  return useTimerStore((s) => {
    const list = Object.values(s.sessionsByPilotId ?? {})
    return list.filter((x) => x.status === 'running' || x.status === 'paused')
  })
}

export function usePilotTimerSession(pilotId: PilotId): TimerSession | null {
  return useTimerStore((s) => s.sessionsByPilotId?.[pilotId] ?? null)
}

export function useTimerSessionsByPilotId(): Record<string, TimerSession> {
  const map = useTimerStore((s) => s.sessionsByPilotId)
  return useMemo(() => map ?? {}, [map])
}

