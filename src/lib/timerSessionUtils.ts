/**
 * Timer Session Utils — расчёт elapsed time из server-truth данных.
 * Источник истины: БД (active_sessions). setInterval только для отрисовки.
 */

import type { ActiveSession } from '@/types/entities'

/**
 * Вычисляет общее прошедшее время сессии в секундах.
 *
 * Логика:
 * - status === 'active': accumulated_seconds + (now - started_at)
 *   (накопленные секунды до паузы + текущий сегмент)
 * - status === 'paused': accumulated_seconds (уже сохранено при pause)
 * - status === 'completed': accumulated_seconds (финальное значение)
 *
 * @param session — строка из active_sessions
 * @param nowMs — опционально: текущее время в мс (для тестов; по умолчанию Date.now())
 * @returns число секунд (целое, >= 0)
 */
export function getTotalElapsedSeconds(
  session: ActiveSession | null,
  nowMs: number = Date.now()
): number {
  if (!session) return 0

  const { status, accumulated_seconds, started_at } = session

  if (status === 'paused' || status === 'completed') {
    return Math.max(0, accumulated_seconds)
  }

  if (status === 'active') {
    if (!started_at) {
      // Некорректное состояние: active без started_at — используем только accumulated
      return Math.max(0, accumulated_seconds)
    }
    const startMs = new Date(started_at).getTime()
    const currentSegmentSeconds = Math.floor((nowMs - startMs) / 1000)
    return Math.max(0, accumulated_seconds + currentSegmentSeconds)
  }

  return 0
}

/** Пресет таймера (из БД). */
export interface TimerPresetRow {
  id: string
  name: string
  safe_minutes: number
  base_cost_per_min: number
  penalty_multiplier_x2_after_mins: number | null
  penalty_multiplier_x3_after_mins: number | null
}

/**
 * Считает стоимость сессии в XP по пресету.
 * Tier 1: 0..safe_minutes — base_cost_per_min
 * Tier 2: safe_minutes..x2_after — base * 2
 * Tier 3: x2_after..x3_after — base * 3
 * Tier 4: x3_after+ — base * 3 (если x3 задан)
 */
export function calculateSessionCostFromPreset(
  preset: TimerPresetRow | null,
  elapsedSeconds: number
): number {
  if (!preset || elapsedSeconds <= 0) return 0
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes <= 0) return 0

  const base = preset.base_cost_per_min
  const x2 = preset.penalty_multiplier_x2_after_mins
  const x3 = preset.penalty_multiplier_x3_after_mins

  let cost = 0
  let remaining = minutes

  // Tier 1: 0 .. min(safe_minutes, x2 or safe)
  const tier1End = x2 != null ? Math.min(preset.safe_minutes, x2) : preset.safe_minutes
  const t1 = Math.min(remaining, Math.max(0, tier1End))
  cost += t1 * base
  remaining -= t1

  // Tier 2: x2
  if (remaining > 0 && x2 != null) {
    const tier2End = x3 != null ? x3 - x2 : Infinity
    const t2 = Math.min(remaining, tier2End)
    cost += t2 * base * 2
    remaining -= t2
  }

  // Tier 3: x3
  if (remaining > 0 && x3 != null) {
    cost += remaining * base * 3
  }

  return Math.floor(cost)
}

/**
 * Стоимость сессии в XP (float) — для live-отображения.
 * Без Math.floor, чтобы счётчик плавно рос.
 */
export function calculateCoinsBurnedFloat(
  preset: TimerPresetRow | null,
  elapsedSeconds: number
): number {
  if (!preset || elapsedSeconds <= 0) return 0
  const minutes = elapsedSeconds / 60
  if (minutes <= 0) return 0

  const base = preset.base_cost_per_min
  const x2 = preset.penalty_multiplier_x2_after_mins
  const x3 = preset.penalty_multiplier_x3_after_mins

  let cost = 0
  let remaining = minutes

  const tier1End = x2 != null ? Math.min(preset.safe_minutes, x2) : preset.safe_minutes
  const t1 = Math.min(remaining, Math.max(0, tier1End))
  cost += t1 * base
  remaining -= t1

  if (remaining > 0 && x2 != null) {
    const tier2End = x3 != null ? x3 - x2 : Infinity
    const t2 = Math.min(remaining, tier2End)
    cost += t2 * base * 2
    remaining -= t2
  }

  if (remaining > 0 && x3 != null) {
    cost += remaining * base * 3
  }

  return cost
}

/**
 * Текущий множитель штрафа: 1 (safe), 2 (x2), 3 (x3).
 */
export function getCurrentMultiplier(
  preset: TimerPresetRow | null,
  totalSecondsElapsed: number
): 1 | 2 | 3 {
  if (!preset || totalSecondsElapsed <= 0) return 1
  const safeSeconds = preset.safe_minutes * 60
  if (totalSecondsElapsed <= safeSeconds) return 1
  const x3 = preset.penalty_multiplier_x3_after_mins
  if (x3 != null && totalSecondsElapsed > x3 * 60) return 3
  return 2
}

/**
 * Секунд до выхода из safe-зоны (0 = уже в штрафах).
 */
export function getSafeTimeRemaining(
  preset: TimerPresetRow | null,
  totalSecondsElapsed: number
): number {
  if (!preset) return 0
  return Math.max(0, preset.safe_minutes * 60 - totalSecondsElapsed)
}
