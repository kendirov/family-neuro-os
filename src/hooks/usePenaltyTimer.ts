/**
 * usePenaltyTimer(sessionId) — хук для Kids UI и Admin monitoring.
 * Загружает active_session + timer_preset из Supabase, считает live-состояние.
 * Оптимизирован: setInterval 1s только при active, чистая математика.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getTotalElapsedSeconds,
  calculateCoinsBurnedFloat,
  getCurrentMultiplier,
  getSafeTimeRemaining,
} from '@/lib/timerSessionUtils'
import type { TimerPresetRow } from '@/lib/timerSessionUtils'

/** Сырая сессия из Supabase (с вложенным preset при join). */
interface SessionRow {
  id: string
  user_id: string
  activity_type: string
  status: 'active' | 'paused' | 'completed'
  started_at: string | null
  accumulated_seconds: number
  active_preset_id: string | null
  timer_presets?: TimerPresetRow | null
}

export interface UsePenaltyTimerResult {
  totalSecondsElapsed: number
  safeTimeRemaining: number
  currentMultiplier: 1 | 2 | 3
  coinsBurned: number
  isBurning: boolean
  isLoading: boolean
  error: Error | null
  session: SessionRow | null
  preset: TimerPresetRow | null
}

const EMPTY_RESULT: UsePenaltyTimerResult = {
  totalSecondsElapsed: 0,
  safeTimeRemaining: 0,
  currentMultiplier: 1,
  coinsBurned: 0,
  isBurning: false,
  isLoading: true,
  error: null,
  session: null,
  preset: null,
}

/** Загружает сессию и пресет (join + fallback fetch). */
async function fetchSessionWithPreset(sessionId: string): Promise<{
  session: SessionRow | null
  preset: TimerPresetRow | null
}> {
  const { data: session, error } = await supabase
    .from('active_sessions')
    .select(`
      id,
      user_id,
      activity_type,
      status,
      started_at,
      accumulated_seconds,
      active_preset_id,
      timer_presets (
        id,
        name,
        safe_minutes,
        base_cost_per_min,
        penalty_multiplier_x2_after_mins,
        penalty_multiplier_x3_after_mins
      )
    `)
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    return { session: null, preset: null }
  }

  const rawPreset = (session as { timer_presets?: TimerPresetRow | TimerPresetRow[] | null }).timer_presets
  let presetRow: TimerPresetRow | null =
    Array.isArray(rawPreset) ? rawPreset[0] ?? null : rawPreset ?? null

  if (!presetRow && (session as SessionRow).active_preset_id) {
    const { data: p } = await supabase
      .from('timer_presets')
      .select('id, name, safe_minutes, base_cost_per_min, penalty_multiplier_x2_after_mins, penalty_multiplier_x3_after_mins')
      .eq('id', (session as SessionRow).active_preset_id)
      .single()
    presetRow = p as TimerPresetRow | null
  }

  return {
    session: session as SessionRow,
    preset: presetRow,
  }
}

/**
 * Хук для live-отображения таймера штрафов.
 * - totalSecondsElapsed: общее время сессии
 * - safeTimeRemaining: секунд до штрафов (0 = уже штрафуем)
 * - currentMultiplier: 1 | 2 | 3
 * - coinsBurned: live XP сгоревшие
 * - isBurning: true если safeTimeRemaining === 0
 */
export function usePenaltyTimer(sessionId: string | null): UsePenaltyTimerResult {
  const [session, setSession] = useState<SessionRow | null>(null)
  const [preset, setPreset] = useState<TimerPresetRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Загрузка сессии + пресет. */
  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      setPreset(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let mounted = true
    setIsLoading(true)
    setError(null)

    fetchSessionWithPreset(sessionId)
      .then(({ session: s, preset: p }) => {
        if (!mounted) return
        setSession(s)
        setPreset(p)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [sessionId])

  /** Realtime: обновление при изменении сессии (pause/resume с другого устройства). */
  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel(`penalty_timer_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          fetchSessionWithPreset(sessionId).then(({ session: s, preset: p }) => {
            setSession(s)
            setPreset(p)
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  /** setInterval 1s только при status === 'active'. При paused — не тикаем. */
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!session || session.status !== 'active') return

    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session?.id, session?.status])

  /** Вычисление состояния — чистая математика, один проход. */
  return useMemo((): UsePenaltyTimerResult => {
    if (!session || isLoading) {
      return {
        ...EMPTY_RESULT,
        isLoading,
        error,
        session,
        preset,
      }
    }

    const now = Date.now()
    const totalSecondsElapsed = getTotalElapsedSeconds(session, now)
    const safeTimeRemaining = getSafeTimeRemaining(preset, totalSecondsElapsed)
    const currentMultiplier = getCurrentMultiplier(preset, totalSecondsElapsed)
    const coinsBurned = calculateCoinsBurnedFloat(preset, totalSecondsElapsed)
    const isBurning = safeTimeRemaining === 0

    return {
      totalSecondsElapsed,
      safeTimeRemaining,
      currentMultiplier,
      coinsBurned,
      isBurning,
      isLoading: false,
      error: null,
      session,
      preset,
    }
  }, [session, preset, isLoading, error, tick])
}
