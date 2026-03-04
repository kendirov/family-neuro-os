/**
 * useRealtimeTimer(pilotName, activityType) — хук для live-отображения таймера из active_timers.
 * Подписка на Supabase Realtime, локальный setInterval при status === 'playing'.
 * Оптимизирован: минимум re-render, interval только при playing, корректный cleanup.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'

/** Строка active_timers из Supabase */
export interface ActiveTimerRow {
  pilot_name: string
  activity_type: string
  status: 'playing' | 'paused' | 'stopped'
  started_at: string | null
  elapsed_seconds: number
}

export interface UseRealtimeTimerResult {
  /** Текущее отображаемое время в секундах (live при playing) */
  displaySeconds: number
  /** Сырая строка из БД или null */
  row: ActiveTimerRow | null
  /** Загрузка начальных данных */
  isLoading: boolean
  /** Ошибка загрузки */
  error: Error | null
  /** true если таймер сейчас идёт */
  isPlaying: boolean
}

const EMPTY_RESULT: UseRealtimeTimerResult = {
  displaySeconds: 0,
  row: null,
  isLoading: true,
  error: null,
  isPlaying: false,
}

/** Вычисляет elapsed при status === 'playing': elapsed_seconds + (now - started_at) */
function computePlayingElapsed(row: ActiveTimerRow): number {
  const started = row.started_at ? new Date(row.started_at).getTime() : Date.now()
  const base = Number(row.elapsed_seconds) || 0
  return base + (Date.now() - started) / 1000
}

/**
 * Хук для live-отображения таймера из таблицы active_timers.
 * - displaySeconds: обновляется каждую секунду при status === 'playing'
 * - Realtime: подписка на изменения по pilot_name, фильтр activity_type в callback
 */
export function useRealtimeTimer(
  pilotName: string | null,
  activityType: string | null
): UseRealtimeTimerResult {
  const [row, setRow] = useState<ActiveTimerRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Начальная загрузка строки */
  useEffect(() => {
    if (!pilotName || !activityType) {
      setRow(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let mounted = true
    setIsLoading(true)
    setError(null)

    supabase
      .from('active_timers')
      .select('pilot_name, activity_type, status, started_at, elapsed_seconds')
      .eq('pilot_name', pilotName)
      .eq('activity_type', activityType)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (!mounted) return
        if (err) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setRow(null)
        } else {
          setRow(data as ActiveTimerRow | null)
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [pilotName, activityType])

  /** Realtime: подписка на active_timers. Фильтр по pilot_name, activity_type — в callback */
  useEffect(() => {
    if (!pilotName || !activityType) return

    const channel = supabase
      .channel(`active_timers_${pilotName}_${activityType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_timers',
          filter: `pilot_name=eq.${pilotName}`,
        },
        (payload) => {
          const newRow = payload.new as ActiveTimerRow | null
          if (!newRow || newRow.activity_type !== activityType) return
          setRow({
            pilot_name: newRow.pilot_name,
            activity_type: newRow.activity_type,
            status: newRow.status,
            started_at: newRow.started_at,
            elapsed_seconds: Number(newRow.elapsed_seconds) || 0,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pilotName, activityType])

  /** setInterval 1s только при status === 'playing'. При paused/stopped — не тикаем */
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (!row || row.status !== 'playing') return

    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [row?.status])

  /** displaySeconds: при playing — live-расчёт, иначе elapsed_seconds. Минимум re-render */
  return useMemo((): UseRealtimeTimerResult => {
    if (!pilotName || !activityType) {
      return { ...EMPTY_RESULT, isLoading: false }
    }

    if (isLoading || error) {
      return {
        displaySeconds: 0,
        row,
        isLoading,
        error,
        isPlaying: false,
      }
    }

    if (!row) {
      return {
        displaySeconds: 0,
        row: null,
        isLoading: false,
        error: null,
        isPlaying: false,
      }
    }

    const displaySeconds =
      row.status === 'playing' ? computePlayingElapsed(row) : Number(row.elapsed_seconds) || 0

    return {
      displaySeconds,
      row,
      isLoading: false,
      error: null,
      isPlaying: row.status === 'playing',
    }
  }, [pilotName, activityType, row, isLoading, error, tick])
}
