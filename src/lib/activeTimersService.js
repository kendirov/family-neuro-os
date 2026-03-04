/**
 * activeTimersService — CRUD для таблицы active_timers (Supabase).
 * Таблица: pilot_name, activity_type, status ('playing'|'paused'|'stopped'), started_at, elapsed_seconds.
 * Realtime включён.
 */
import { supabase } from '@/lib/supabase'

/**
 * START: установить status 'playing', started_at = NOW.
 * Если строки нет — insert, иначе update.
 */
export async function startActiveTimer(pilotName, activityType) {
  const now = new Date().toISOString()
  const payload = {
    pilot_name: pilotName,
    activity_type: activityType,
    status: 'playing',
    started_at: now,
    elapsed_seconds: 0,
  }

  const { data: existing } = await supabase
    .from('active_timers')
    .select('pilot_name')
    .eq('pilot_name', pilotName)
    .eq('activity_type', activityType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('active_timers')
      .update({ status: 'playing', started_at: now, elapsed_seconds: 0 })
      .eq('pilot_name', pilotName)
      .eq('activity_type', activityType)
    if (error) throw error
  } else {
    const { error } = await supabase.from('active_timers').insert(payload)
    if (error) throw error
  }
}

/**
 * PAUSE: вычислить elapsed_seconds, установить status 'paused', очистить started_at.
 */
export async function pauseActiveTimer(pilotName, activityType, row) {
  if (!row) return
  let newElapsed = Number(row.elapsed_seconds) || 0
  if (row.status === 'playing' && row.started_at) {
    const startMs = new Date(row.started_at).getTime()
    newElapsed += Math.floor((Date.now() - startMs) / 1000)
  }

  const { error } = await supabase
    .from('active_timers')
    .update({
      status: 'paused',
      started_at: null,
      elapsed_seconds: newElapsed,
    })
    .eq('pilot_name', pilotName)
    .eq('activity_type', activityType)

  if (error) throw error
}

/**
 * STOP: сохранить в history (addGamingMinutesToday), затем status 'stopped', elapsed_seconds: 0.
 */
export async function stopActiveTimer(pilotName, activityType, row, onSaveToHistory) {
  let elapsedMinutes = 0
  if (row) {
    let totalSeconds = Number(row.elapsed_seconds) || 0
    if (row.status === 'playing' && row.started_at) {
      const startMs = new Date(row.started_at).getTime()
      totalSeconds += Math.floor((Date.now() - startMs) / 1000)
    }
    elapsedMinutes = Math.floor(totalSeconds / 60)
  }

  if (typeof onSaveToHistory === 'function' && elapsedMinutes > 0) {
    onSaveToHistory(pilotName, activityType, elapsedMinutes)
  }

  const { error } = await supabase
    .from('active_timers')
    .update({
      status: 'stopped',
      started_at: null,
      elapsed_seconds: 0,
    })
    .eq('pilot_name', pilotName)
    .eq('activity_type', activityType)

  if (error) throw error
}
