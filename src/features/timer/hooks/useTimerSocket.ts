import { useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { PilotId, TimerEvent, TimerMode, TimerSession, TimerSnapshot } from '../lib/timer-types'
import { useTimerStore } from '../store/useTimerStore'
import { timerCommands } from '../lib/timer-commands'

type UseTimerSocketOptions = {
  pilotIds?: PilotId[]
  /**
   * If true, uses a local mock adapter with the same event contract as the future server.
   * Useful when Supabase realtime is not configured in the environment.
   */
  useMock?: boolean
}

function nowIso() {
  return new Date().toISOString()
}

function mapProfileModeToTimerMode(timer_mode: string | null | undefined): TimerMode {
  if (timer_mode === 'game') return 'game'
  if (timer_mode === 'cartoon') return 'cartoons'
  if (timer_mode === 'youtube' || timer_mode === 'good' || timer_mode === 'media') return 'cartoons'
  return 'other'
}

function profileToSession(profileRow: any, pilotId: PilotId): TimerSession {
  const statusRaw = (profileRow?.timer_status ?? 'idle') as string
  const status =
    statusRaw === 'running'
      ? 'running'
      : statusRaw === 'paused'
        ? 'paused'
        : statusRaw === 'idle'
          ? 'idle'
          : 'error'

  const timerStartAt = profileRow?.timer_start_at ?? null
  const sessionElapsed = Number(profileRow?.session_elapsed ?? 0)
  const balance = Number(profileRow?.balance ?? 0)
  const mode = mapProfileModeToTimerMode(profileRow?.timer_mode)

  // profiles-based state doesn’t provide endsAt/duration; we keep it undefined.
  return {
    sessionId: `${pilotId}-${status}-${timerStartAt ?? 'none'}`,
    pilotId,
    status,
    mode,
    startedAt: status === 'running' ? (timerStartAt ?? null) : null,
    pausedAt: status === 'paused' ? nowIso() : null,
    updatedAt: profileRow?.updated_at ?? nowIso(),
    serverNow: nowIso(),
    source: 'server',
    // For paused profiles we can at least expose “elapsed so far” as remainingSeconds? No—avoid lying.
    // Keep remainingSeconds undefined; UI should display elapsed separately.
    durationSeconds: undefined,
    // "Remaining" in Turbo-Garage economy is fuel left: 1 XP ≈ 1 minute.
    remainingSeconds: Number.isFinite(balance) ? Math.max(0, Math.floor(balance) * 60) : undefined,
    endsAt: null,
    // carry-through for potential UI:
    // @ts-expect-error store accepts extra fields, UI can read if needed
    sessionElapsed,
  } as TimerSession
}

export function useTimerSocket(options: UseTimerSocketOptions = {}) {
  const pilotIds = (options.pilotIds ?? (['kirill', 'roma'] as PilotId[])) as PilotId[]
  const useMock = !!options.useMock
  const unsubRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    useTimerStore.getState().setConnectionStatus('connecting')
    useTimerStore.getState().clearTimerError()

    if (useMock) {
      const off = timerCommands.ensureConnected?.()
      unsubRef.current = () => {
        off?.()
      }
      return () => unsubRef.current?.()
    }

    let disposed = false

    const applySnapshotFromProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id,timer_status,timer_start_at,session_elapsed,timer_mode,updated_at,balance')
          .in('id', pilotIds as any)
        if (disposed) return
        if (error) throw error

        const sessionsByPilotId: Record<string, TimerSession> = {}
        const activeSessionIds: Record<string, string | null> = {}

        for (const pid of pilotIds) {
          const row = (data ?? []).find((r: any) => r.id === pid) ?? null
          const session = profileToSession(row, pid)
          sessionsByPilotId[pid] = session
          activeSessionIds[pid] = session.status === 'running' || session.status === 'paused' ? session.sessionId : null
        }

        const snapshot: TimerSnapshot = {
          serverNow: nowIso(),
          sessionsByPilotId,
          activeSessionIds,
        }
        useTimerStore.getState().applyServerSnapshot(snapshot)
      } catch (e: any) {
        useTimerStore.getState().setConnectionStatus('error')
        useTimerStore.getState().setTimerError(e?.message ?? 'Timer snapshot failed')
        if (import.meta.env.DEV) console.warn('[TG_TIMER] snapshot failed', e)
      }
    }

    applySnapshotFromProfiles()

    const channel = supabase
      .channel('tg_timer_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const row = payload.new as any
          if (!row?.id) return
          if (!pilotIds.includes(row.id)) return
          // Easiest stable approach: refresh snapshot for all pilots.
          // This avoids needing to diff transitions in UI code.
          applySnapshotFromProfiles()
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          useTimerStore.getState().setConnectionStatus('live')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
          useTimerStore.getState().setConnectionStatus('error')
          useTimerStore.getState().setTimerError('Realtime connection error')
        } else if (status === 'CLOSED') {
          useTimerStore.getState().setConnectionStatus('stale')
        }
      })

    unsubRef.current = () => {
      disposed = true
      supabase.removeChannel(channel)
    }

    return () => unsubRef.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMock, pilotIds.join('|')])

  return useMemo(() => {
    const s = useTimerStore.getState()
    return { connectionStatus: s.connectionStatus, lastError: s.lastError }
  }, [])
}

