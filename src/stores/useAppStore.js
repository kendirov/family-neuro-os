import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const MAX_TRANSACTIONS = 100

/** Date key for "today" (YYYY-MM-DD). */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Пн–Пт = будни. Сб/Вс = выходной: overdrive ВЫКЛ, всегда 1 XP/мин. */
function isWeekday() {
  const d = new Date().getDay()
  return d >= 1 && d <= 5
}

// CRITICAL: Order must be Kirill first, Roma second (for consistent left/right layout)
const PILOT_IDS = ['kirill', 'roma']

const initialPilotState = () => ({
  status: 'IDLE',
  sessionMinutes: 0,
  burnerActive: false,
  mode: null,
  /** ISO timestamp from server; used for drift-free elapsed and resume. */
  sessionStartAt: null,
  /** ISO timestamp of last XP burn; used for offline catch-up. */
  lastBurnAt: null,
  /** Balance at session start; burn never exceeds this (bankruptcy protection). */
  sessionBalanceAtStart: null,
  /** Transaction id of the current session row (one row per session, updated each minute). */
  activeSessionId: null,
  /** Cumulative XP burned this session; used to update the single session tx. */
  sessionTotalBurned: 0,
  /** Server-authoritative timer state */
  timerStatus: 'idle',
  timerStartAt: null,
  secondsToday: 0,
  /** When paused: saved session length in seconds (true pause — resume from same second). */
  sessionElapsed: 0,
  /** When paused: length in seconds of the segment that was just paused (for "current session" display only). */
  pausedSegmentSeconds: null,
})

/** Map DB profile row to store user shape. */
function profileToUser(row) {
  const today = getDateKey()
  const lastSpin = row.last_spin_date ? String(row.last_spin_date).slice(0, 10) : null
  const lastReset = row.last_daily_reset ? String(row.last_daily_reset).slice(0, 10) : null
  const isResetToday = lastReset === today

  // Daily Roulette (legacy): фиксированные 3 спина — оставляем для обратной совместимости
  const spinsRemaining =
    lastSpin === today
      ? Math.max(0, Number(row.daily_spins_remaining) ?? 3)
      : 3

  // Daily Points → Spins: 1 спин за 50 очков
  const dailyPointsEarned = isResetToday ? Math.max(0, Number(row.daily_points_earned) ?? 0) : 0
  const spinsUsedToday = isResetToday ? Math.max(0, Number(row.spins_used_today) ?? 0) : 0

  return {
    id: row.id,
    name: row.name ?? row.id,
    balance: Number(row.balance) ?? 0,
    color: row.color ?? (row.id === 'roma' ? 'cyan' : 'purple'),
    daily_spins_remaining: spinsRemaining,
    last_spin_date: lastSpin,
    daily_points_earned: dailyPointsEarned,
    spins_used_today: spinsUsedToday,
    last_daily_reset: lastReset,
  }
}

/** Map DB transaction row to store transaction shape. */
function dbTxToStore(row) {
  return {
    id: row.id,
    userId: row.user_id,
    description: row.description ?? '',
    amount: row.amount,
    type: row.type ?? (row.amount >= 0 ? 'earn' : 'spend'),
    status: row.status ?? null,
    at: new Date(row.created_at).getTime(),
    task_definition_id: row.task_definition_id ?? null,
  }
}

const RAID_TARGET = 1500
const RAID_STORAGE_KEY = 'family_raidProgress'

/**
 * Calculate burn rate based on mode and accumulated time today.
 * MODE A: CARTOONS (Media - youtube/good)
 *   - Tier 1 (0-20 mins): 0 XP/min (FREE)
 *   - Tier 2 (21-60 mins): 0.5 XP/min (Cheap)
 *   - Tier 3 (60+ mins): 2 XP/min (Penalty)
 * MODE B: GAMES
 *   - Tier 1 (0-60 mins): 1 XP/min (Standard)
 *   - Tier 2 (60+ mins): 2 XP/min (Overheat)
 */
function calculateBurnRate(mode, todayGameTime, todayMediaTime) {
  if (mode === 'good' || mode === 'youtube') {
    // Media mode
    if (todayMediaTime < 20) return 0
    if (todayMediaTime < 60) return 0.5
    return 2
  } else {
    // Game mode
    if (todayGameTime < 60) return 1
    return 2
  }
}

/** Pay-as-you-go: cost in XP for a session segment. Rate: 1 XP per minute (default). */
function calculateSessionCost(seconds, mode) {
  const rate = 1
  return Math.floor(seconds / 60) * rate
}

export const useAppStore = create((set, get) => ({
  users: [],
  transactions: [],
  purchases: [],
  isLoading: true,

  /** Realtime status for multi-device sync (profiles channel). */
  realtimeStatus: 'idle', // 'idle' | 'connecting' | 'connected' | 'error'

  /** Wheel of Fortune: last spins (global history). */
  spinHistory: [],

  /** Wheel of Fortune: spins used today per pilot (limit logic). */
  spinsUsedToday: {
    date: getDateKey(),
    roma: 0,
    kirill: 0,
  },

  /** Per-user today time tracking: { [userId]: { game: number, media: number } } */
  todayTimeTracking: {},

  /** Shared raid goal: progress 0..RAID_TARGET. Auto-contributed when pilots earn XP. */
  raidProgress: 0,

  dailyBase: {},
  isDailyBaseComplete: (userId, actionId) => {
    const today = getDateKey()
    const userDaily = get().dailyBase[userId]
    return userDaily != null && userDaily[actionId] === today
  },

  /** Проверка выполнения миссии по транзакциям (для multi-device sync через Realtime). */
  isTaskCompleteFromTransactions: (userId, task) => {
    const today = getDateKey()
    const todayStart = new Date(today + 'T00:00:00').getTime()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000
    const reason = task?.reason_template ?? task?.label
    if (!reason) return false
    const reasons = [reason]
    if ((task?.bonus_reward ?? 0) > 0) reasons.push(`${reason} — бонус`)
    const txs = get().transactions ?? []
    return txs.some(
      (t) =>
        t.userId === userId &&
        t.amount > 0 &&
        t.type !== 'burn' &&
        t.at >= todayStart &&
        t.at < todayEnd &&
        reasons.includes(t.description)
    )
  },
  markDailyBaseComplete: (userId, actionId) =>
    set((state) => ({
      dailyBase: {
        ...state.dailyBase,
        [userId]: {
          ...(state.dailyBase[userId] ?? {}),
          [actionId]: getDateKey(),
        },
      },
    })),
  resetDailyBase: (userId) =>
    set((state) => {
      if (userId) {
        return { dailyBase: { ...state.dailyBase, [userId]: {} } }
      }
      return { dailyBase: {} }
    }),

  /** Clear a single daily completion so the task shows pending again (e.g. after undo). */
  clearDailyComplete: (userId, actionId) =>
    set((state) => {
      const userDaily = state.dailyBase[userId]
      if (!userDaily || userDaily[actionId] == null) return state
      const { [actionId]: _, ...rest } = userDaily
      return {
        dailyBase: { ...state.dailyBase, [userId]: Object.keys(rest).length ? rest : {} },
      }
    }),

  /**
   * Undo last completion of a daily task: find latest transaction for user with matching description,
   * remove it (refund/uncharge), clear daily state for that action.
   * @param {string} reason - exact description, or pass array of possible descriptions (e.g. base + bonus)
   */
  undoDailyTask: (userId, actionId, reason) => {
    const state = get()
    const reasons = Array.isArray(reason) ? reason : [reason]
    const tx = [...(state.transactions ?? [])]
      .filter(
        (t) =>
          t.userId === userId &&
          t.amount > 0 &&
          reasons.some((r) => t.description === r)
      )
      .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))[0]
    if (tx) get().removeTransaction(tx.id)
    get().clearDailyComplete(userId, actionId)
  },

  /** Last calendar date the app was active (YYYY-MM-DD). Used for daily reset on new day. */
  lastActiveDate: null,

  /**
   * Call on app load: if current date !== lastActiveDate, reset daily task states and set lastActiveDate to today.
   * Persist lastActiveDate (and dailyBase for same-day) to localStorage so reset works across refresh.
   */
  checkDailyReset: () => {
    const today = getDateKey()
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('family_lastActiveDate') : null
    if (stored !== today) {
      // New day: reset daily tracking
      set((state) => ({
        dailyBase: {},
        lastActiveDate: today,
        todayTimeTracking: {},
        spinsUsedToday: { date: today, roma: 0, kirill: 0 },
        spinHistory: [],
        users: state.users.map((u) => ({
          ...u,
          daily_points_earned: 0,
          spins_used_today: 0,
          last_daily_reset: today,
        })),
      }))
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('family_lastActiveDate', today)
        localStorage.removeItem('family_dailyBase')
      }
      // Reset time tracking, timer state и Daily Roulette в БД для всех пилотов
      ;(async () => {
        try {
          await Promise.all(
            PILOT_IDS.map((id) =>
              supabase
                .from('profiles')
                .update({
                  today_game_time: 0,
                  today_media_time: 0,
                  seconds_today: 0,
                  timer_status: 'idle',
                  timer_mode: null,
                  timer_start_at: null,
                  daily_spins_remaining: 3,
                  daily_points_earned: 0,
                  spins_used_today: 0,
                  last_daily_reset: today,
                })
                .eq('id', id)
            )
          )
        } catch (e) {
          console.warn('checkDailyReset: failed to reset time tracking in DB', e)
        }
      })()
    } else {
      set({ lastActiveDate: today })
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem('family_dailyBase')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') set((s) => ({ dailyBase: parsed }))
          }
        } catch (_) {}
      }
    }
  },

  /**
   * Manual "simulate new day" for testing: set lastActiveDate to yesterday so next checkDailyReset clears daily state.
   * Call after setting localStorage so that the next checkDailyReset() run (or page refresh) sees a new day.
   */
  simulateDayReset: () => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const yesterday = d.toISOString().slice(0, 10)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('family_lastActiveDate', yesterday)
      localStorage.removeItem('family_dailyBase')
    }
    get().checkDailyReset()
  },

  panelLocked: true,
  setPanelLocked: (value) => set({ panelLocked: value }),

  gamingToday: { dateKey: '', minutes: 0 },
  dailyGamingMinutes: {},
  /**
   * По дням и режимам:
   * { [dateKey]: { game: { roma, kirill }, youtube: { roma, kirill }, good: { roma, kirill } } }
   * good = «полезные мультики».
   */
  dailyGamingBreakdown: {},
  totalFlightTimeMinutes: 0,
  /** Get today's game time for a specific user. */
  getTodayGameTime: (userId) => {
    const state = get()
    const today = getDateKey()
    // Check if we need to reset (new day)
    const lastActive = state.lastActiveDate
    if (lastActive !== today) return 0
    return state.todayTimeTracking?.[userId]?.game ?? 0
  },

  /** Get today's media time for a specific user. */
  getTodayMediaTime: (userId) => {
    const state = get()
    const today = getDateKey()
    // Check if we need to reset (new day)
    const lastActive = state.lastActiveDate
    if (lastActive !== today) return 0
    return state.todayTimeTracking?.[userId]?.media ?? 0
  },

  /** Increment today's time tracking for a user. */
  incrementTodayTime: (userId, minutes, mode) => {
    set((state) => {
      const today = getDateKey()
      const isMedia = mode === 'youtube' || mode === 'good'
      const current = state.todayTimeTracking?.[userId] ?? { game: 0, media: 0 }
      return {
        todayTimeTracking: {
          ...(state.todayTimeTracking ?? {}),
          [userId]: {
            game: isMedia ? current.game : current.game + minutes,
            media: isMedia ? current.media + minutes : current.media,
          },
        },
      }
    })
  },

  addGamingMinutesToday: (minutes, mode = 'game', pilotIds = []) => {
    set((state) => {
      const today = getDateKey()
      const prev = state.gamingToday?.dateKey === today ? state.gamingToday.minutes : 0
      const dayMinutes = (state.dailyGamingMinutes?.[today] ?? 0) + minutes
      const totalFlight = (state.totalFlightTimeMinutes ?? 0) + minutes
      const prevBreakdown = state.dailyGamingBreakdown?.[today] ?? {
        game: { roma: 0, kirill: 0 },
        youtube: { roma: 0, kirill: 0 },
        good: { roma: 0, kirill: 0 },
      }
      const nextBreakdown = {
        game: { ...(prevBreakdown.game ?? {}) },
        youtube: { ...(prevBreakdown.youtube ?? {}) },
        good: { ...(prevBreakdown.good ?? {}) },
      }
      const modeKey = mode === 'youtube' ? 'youtube' : mode === 'good' ? 'good' : 'game'
      pilotIds.forEach((id) => {
        if (id === 'roma' || id === 'kirill') {
          nextBreakdown[modeKey][id] = (nextBreakdown[modeKey][id] ?? 0) + minutes
          // Increment per-user time tracking
          get().incrementTodayTime(id, minutes, mode)
        }
      })
      return {
        gamingToday: { dateKey: today, minutes: prev + minutes },
        dailyGamingMinutes: { ...(state.dailyGamingMinutes ?? {}), [today]: dayMinutes },
        dailyGamingBreakdown: { ...(state.dailyGamingBreakdown ?? {}), [today]: nextBreakdown },
        totalFlightTimeMinutes: totalFlight,
      }
    })

    // Best-effort: sync aggregated game/media minutes to settings table for analytics/limits.
    ;(async () => {
      try {
        const state = get()
        const { game, youtube } = state.getDisplayBreakdownToday()
        const games_time_today = (game?.roma ?? 0) + (game?.kirill ?? 0)
        const media_time_today = (youtube?.roma ?? 0) + (youtube?.kirill ?? 0)
        await supabase
          .from('settings')
          .upsert(
            [
              { key: 'games_time_today', value: games_time_today },
              { key: 'media_time_today', value: media_time_today },
            ],
            { onConflict: 'key' }
          )
      } catch (e) {
        console.warn('addGamingMinutesToday settings sync (optional):', e)
      }
    })()
  },
  getGamingMinutesToday: () => {
    const today = getDateKey()
    const state = get()
    return state.gamingToday?.dateKey === today ? (state.gamingToday?.minutes ?? 0) : 0
  },

  /** Dual-core engine: независимые таймеры по пилотам. */
  pilots: (() => {
    const o = {}
    PILOT_IDS.forEach((id) => { o[id] = initialPilotState() })
    return o
  })(),

  setPilotSessionMinutes: (pilotId, minutes) =>
    set((state) => {
      if (!state.pilots[pilotId] || (state.pilots[pilotId].status !== 'RUNNING' && state.pilots[pilotId].status !== 'PAUSED')) return state
      return {
        pilots: {
          ...state.pilots,
          [pilotId]: { ...state.pilots[pilotId], sessionMinutes: Math.max(0, minutes) },
        },
      }
    }),

  /** DB first: insert burn transaction, then update local state. */
  createSessionTransaction: async (pilotId, mode = 'game') => {
    let desc = '🎮 Игровая сессия (Start)'
    if (mode === 'youtube') desc = '📺 Сессия (Start)'
    else if (mode === 'good') desc = '🍏 Полезная сессия (Start)'
    try {
      const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: row, error } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: pilotId,
          description: desc,
          amount: 0,
          type: 'burn',
          status: 'active',
        })
        .select('id, created_at')
        .single()
      if (error) throw error
      const entry = {
        id: row.id,
        at: new Date(row.created_at).getTime(),
        userId: pilotId,
        description: desc,
        amount: 0,
        type: 'burn',
        status: 'active',
      }
      set((s) => ({
        pilots: {
          ...s.pilots,
          [pilotId]: { ...s.pilots[pilotId], activeSessionId: row.id, sessionTotalBurned: 0 },
        },
        transactions: [entry, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
      }))
    } catch (e) {
      console.error('createSessionTransaction: Supabase failed', e)
    }
  },

  /**
   * DB first: update burn tx + profiles (balance, today_game_time, today_media_time).
   * Called every minute during session. Local state only on success.
   */
  updateSessionBurn: async (pilotId, rate, durationMinutes, mode = 'game') => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    const txId = pilot?.activeSessionId
    if (!txId) return
    const newTotal = (pilot.sessionTotalBurned ?? 0) + rate
    let desc = `🎮 Игровая сессия (${durationMinutes} мин)`
    if (mode === 'youtube') desc = `📺 Сессия (${durationMinutes} мин)`
    else if (mode === 'good') desc = `🍏 Полезная сессия (${durationMinutes} мин)`

    const user = state.users.find((u) => u.id === pilotId)
    const newBalance = user ? Math.max(0, (user.balance ?? 0) - rate) : 0
    const currentTracking = state.todayTimeTracking?.[pilotId] ?? { game: 0, media: 0 }
    const isMedia = mode === 'youtube' || mode === 'good'
    const newGameTime = isMedia ? currentTracking.game : currentTracking.game + 1
    const newMediaTime = isMedia ? currentTracking.media + 1 : currentTracking.media

    try {
      const { error: txErr } = await supabase
        .from('transactions')
        .update({ amount: -newTotal, description: desc })
        .eq('id', txId)
      if (txErr) throw txErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          today_game_time: newGameTime,
          today_media_time: newMediaTime,
        })
        .eq('id', pilotId)
      if (profileErr) throw profileErr

      const today = getDateKey()
      const modeKey = mode === 'youtube' ? 'youtube' : mode === 'good' ? 'good' : 'game'
      set((s) => {
        const prevBreakdown = s.dailyGamingBreakdown?.[today] ?? {
          game: { roma: 0, kirill: 0 },
          youtube: { roma: 0, kirill: 0 },
          good: { roma: 0, kirill: 0 },
        }
        const nextBreakdown = { ...prevBreakdown }
        if (!nextBreakdown[modeKey]) nextBreakdown[modeKey] = { roma: 0, kirill: 0 }
        nextBreakdown[modeKey] = {
          ...nextBreakdown[modeKey],
          [pilotId]: (nextBreakdown[modeKey][pilotId] ?? 0) + 1,
        }
        return {
          users: s.users.map((u) => (u.id === pilotId ? { ...u, balance: newBalance } : u)),
          transactions: (s.transactions ?? []).map((t) =>
            t.id === txId ? { ...t, amount: -newTotal, description: desc } : t
          ),
          pilots: {
            ...s.pilots,
            [pilotId]: { ...s.pilots[pilotId], sessionTotalBurned: newTotal },
          },
          todayTimeTracking: {
            ...(s.todayTimeTracking ?? {}),
            [pilotId]: { game: newGameTime, media: newMediaTime },
          },
          dailyGamingBreakdown: {
            ...(s.dailyGamingBreakdown ?? {}),
            [today]: nextBreakdown,
          },
          gamingToday: {
            dateKey: today,
            minutes: (s.gamingToday?.dateKey === today ? s.gamingToday.minutes : 0) + 1,
          },
        }
      })
    } catch (e) {
      console.error('updateSessionBurn: Supabase failed', e)
    }
  },

  /** DB first: update burn tx to completed, then clear pilot state. */
  finalizeSessionTransaction: async (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    const txId = pilot?.activeSessionId
    const sessionMinutes = pilot?.sessionMinutes ?? 0
    const mode = pilot?.mode ?? 'game'
    let desc = `🎮 Игровая сессия (${sessionMinutes} мин)`
    if (mode === 'youtube') desc = `📺 Сессия (${sessionMinutes} мин)`
    else if (mode === 'good') desc = `🍏 Полезная сессия (${sessionMinutes} мин)`

    if (txId) {
      try {
        const { error } = await supabase
          .from('transactions')
          .update({ description: desc, status: 'completed' })
          .eq('id', txId)
        if (error) throw error
        set((s) => ({
          transactions: (s.transactions ?? []).map((t) =>
            t.id === txId ? { ...t, description: desc, status: 'completed' } : t
          ),
          pilots: { ...s.pilots, [pilotId]: initialPilotState() },
        }))
      } catch (e) {
        console.error('finalizeSessionTransaction: Supabase failed', e)
      }
    } else {
      set((s) => ({ pilots: { ...s.pilots, [pilotId]: initialPilotState() } }))
    }
  },

  startTimer: async (pilotId, mode = 'game') => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    const user = state.users.find((u) => u.id === pilotId)
    const balanceAtStart = user ? Math.max(0, user.balance) : 0
    const previousSecondsToday = pilot?.secondsToday ?? 0
    const m = mode === 'youtube' ? 'youtube' : mode === 'good' ? 'good' : 'game'
    const timerMode = m === 'game' ? 'game' : 'cartoon'

    // Scenario A: Resuming from paused — backdate start so elapsed is correct
    // Scenario B: Fresh start from idle
    const isResuming = pilot?.timerStatus === 'paused'
    let timerStartAtIso

    if (isResuming) {
      const savedSeconds = pilot?.sessionElapsed ?? 0
      const newStartTime = new Date(Date.now() - savedSeconds * 1000)
      timerStartAtIso = newStartTime.toISOString()
    } else {
      timerStartAtIso = new Date().toISOString()
    }

    try {
      await supabase
        .from('profiles')
        .update({
          timer_status: 'running',
          timer_mode: timerMode,
          timer_start_at: timerStartAtIso,
          session_elapsed: 0,
        })
        .eq('id', pilotId)

      set((s) => ({
        pilots: {
          ...s.pilots,
          [pilotId]: {
            ...(s.pilots[pilotId] ?? initialPilotState()),
            status: 'RUNNING',
            sessionMinutes: 0,
            burnerActive: true,
            mode: m,
            sessionStartAt: timerStartAtIso,
            lastBurnAt: timerStartAtIso,
            sessionBalanceAtStart: balanceAtStart,
            activeSessionId: s.pilots?.[pilotId]?.activeSessionId ?? null,
            sessionTotalBurned: s.pilots?.[pilotId]?.sessionTotalBurned ?? 0,
            timerStatus: 'running',
            timerStartAt: timerStartAtIso,
            secondsToday: previousSecondsToday,
            sessionElapsed: 0,
            pausedSegmentSeconds: null,
          },
        },
      }))
      if (!isResuming) await get().createSessionTransaction(pilotId, m)
    } catch (e) {
      console.error('startTimer sync:', e)
      throw e
    }
  },

  // Legacy alias for backward compatibility
  startEngine: (pilotId, mode = 'game') => {
    get().startTimer(pilotId, mode)
  },

  pauseTimer: async (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.timerStatus !== 'running') return

    // True Pause: freeze time, do NOT deduct balance
    const elapsedNow = (new Date() - new Date(pilot.timerStartAt)) / 1000
    const sessionElapsedSaved = Math.max(0, Math.floor(elapsedNow))

    const payload = {
      timer_status: 'paused',
      timer_start_at: null,
      session_elapsed: sessionElapsedSaved,
    }

    let dbOk = false
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', pilotId)
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('pauseTimer DB error:', error)
        set({ lastOfflineSyncToast: { message: 'Пауза не сохранилась на сервере. Проверьте консоль (F12).' } })
        return
      }
      if (!data) {
        console.error('pauseTimer: update affected 0 rows')
        set({ lastOfflineSyncToast: { message: 'Пауза не сохранилась на сервере (0 строк обновлено).' } })
        return
      }
      dbOk = true
      console.log('[PauseTimer] Saved session_elapsed:', sessionElapsedSaved)
    } catch (e) {
      console.error('pauseTimer sync:', e)
      set({ lastOfflineSyncToast: { message: 'Пауза не сохранилась на сервере.' } })
      return
    }

    if (!dbOk) return

    set((s) => ({
      pilots: {
        ...s.pilots,
        [pilotId]: {
          ...s.pilots[pilotId],
          status: 'PAUSED',
          burnerActive: false,
          timerStatus: 'paused',
          timerStartAt: null,
          sessionElapsed: sessionElapsedSaved,
          pausedSegmentSeconds: sessionElapsedSaved,
        },
      },
    }))
  },

  // Legacy alias for backward compatibility
  pauseEngine: (pilotId) => {
    get().pauseTimer(pilotId)
  },

  resumeTimer: (pilotId) => {
    const pilot = get().pilots?.[pilotId]
    if (!pilot || pilot.timerStatus !== 'paused') return
    get().startTimer(pilotId, pilot.mode ?? 'game')
  },

  // Legacy alias for backward compatibility
  resumeEngine: (pilotId) => {
    get().resumeTimer(pilotId)
  },

  stopTimer: async (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.timerStatus === 'idle') return

    // Total session time: running → (now - start); paused → session_elapsed
    let totalSeconds = 0
    if (pilot.timerStatus === 'running' && pilot.timerStartAt) {
      const start = new Date(pilot.timerStartAt)
      totalSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000))
    } else if (pilot.timerStatus === 'paused') {
      totalSeconds = pilot.sessionElapsed ?? 0
    }
    const minutes = Math.floor(totalSeconds / 60)
    const cost = Math.max(0, minutes * 1)
    const currentBalance = state.users.find((u) => u.id === pilotId)?.balance ?? 0
    const newBalance = currentBalance - cost
    const baseSeconds = pilot.secondsToday ?? 0
    const newSecondsToday = baseSeconds + totalSeconds

    try {
      const { error: profileError } = await supabase
      .from('profiles')
      .update({
        timer_status: 'idle',
        timer_start_at: null,
        session_elapsed: 0,
        seconds_today: newSecondsToday,
        balance: newBalance,
      })
      .eq('id', pilotId)

    if (profileError) throw profileError

    // Transaction insert
    if (cost > 0) {
      const txId = Date.now().toString()
      const { error: transError } = await supabase.from('transactions').insert({
        id: txId,
        user_id: String(pilotId),
        amount: -cost,
        type: 'expense',
        description: `Сессия: ${pilot.mode ?? 'game'} (${minutes} мин)`,
      })
      if (transError) throw transError
    }

    await get().finalizeSessionTransaction(pilotId)

    set((s) => ({
      pilots: { ...s.pilots, [pilotId]: initialPilotState() },
      users: s.users.map((u) => (u.id === pilotId ? { ...u, balance: newBalance } : u)),
    }))
    } catch (e) {
      console.error('stopTimer: Supabase failed', e)
      set({ lastOfflineSyncToast: { message: `Ошибка сохранения: ${e?.message ?? 'Неизвестная ошибка'}` } })
    }
  },

  // Legacy alias for backward compatibility
  stopEngine: (pilotId) => {
    get().stopTimer(pilotId)
  },

  toggleAll: (action, mode = 'game') => {
    if (action === 'start') {
      get().startEngine('roma', mode)
      get().startEngine('kirill', mode)
    } else if (action === 'pause') {
      get().pauseEngine('roma')
      get().pauseEngine('kirill')
    } else if (action === 'stop') {
      get().stopEngine('roma')
      get().stopEngine('kirill')
    }
  },

  /** Минуты за сегодня: сохранённые + текущие сессии обоих пилотов. */
  getDisplayMinutesToday: () => {
    const state = get()
    const base = state.getGamingMinutesToday()
    const roma = state.pilots?.roma?.sessionMinutes ?? 0
    const kirill = state.pilots?.kirill?.sessionMinutes ?? 0
    return base + roma + kirill
  },

  /** Разбивка за сегодня: игра + мультики (обычные + полезные) по каждому пилоту, с учётом текущих сессий. */
  getDisplayBreakdownToday: () => {
    const state = get()
    const today = getDateKey()
    const saved = state.dailyGamingBreakdown?.[today] ?? {
      game: { roma: 0, kirill: 0 },
      youtube: { roma: 0, kirill: 0 },
      good: { roma: 0, kirill: 0 },
    }
    const game = { ...(saved.game ?? {}) }
    const youtube = { ...(saved.youtube ?? {}) }
    const good = { ...(saved.good ?? {}) }

    // Полезные мультики считаем как часть «мультики» для суммарной статистики.
    ;['roma', 'kirill'].forEach((id) => {
      youtube[id] = (youtube[id] ?? 0) + (good[id] ?? 0)
    })
    PILOT_IDS.forEach((id) => {
      const p = state.pilots?.[id]
      if (!p || p.status === 'IDLE' || !p.mode) return
      const cur = p.sessionMinutes ?? 0
      if (cur <= 0) return
      const key = p.mode === 'youtube' || p.mode === 'good' ? 'youtube' : 'game'
      if (key === 'game') game[id] = (game[id] ?? 0) + cur
      else youtube[id] = (youtube[id] ?? 0) + cur
    })
    return { game, youtube }
  },

  /** Сколько минут игр за сегодня (оба пилота, с учётом текущих сессий). */
  getGamesTimeToday: () => {
    const { game } = get().getDisplayBreakdownToday()
    return (game?.roma ?? 0) + (game?.kirill ?? 0)
  },

  /** Сколько минут мультимедиа (обычные + полезные мультики) за сегодня. */
  getMediaTimeToday: () => {
    const { youtube } = get().getDisplayBreakdownToday()
    return (youtube?.roma ?? 0) + (youtube?.kirill ?? 0)
  },

  /** Есть ли хотя бы один запущенный двигатель (для UI). */
  isAnyEngineRunning: () => {
    const state = get()
    return (state.pilots?.roma?.status === 'RUNNING' || state.pilots?.kirill?.status === 'RUNNING')
  },

  /** DB first: update last_burn_at in profiles to avoid double-charge across devices. */
  updateLastBurnAt: async (pilotId) => {
    const now = new Date().toISOString()
    try {
      const { error } = await supabase.from('profiles').update({ last_burn_at: now }).eq('id', pilotId)
      if (error) throw error
      set((state) => {
        const p = state.pilots?.[pilotId]
        if (!p) return state
        return {
          pilots: {
            ...state.pilots,
            [pilotId]: { ...p, lastBurnAt: now },
          },
        }
      })
    } catch (e) {
      console.error('updateLastBurnAt: Supabase failed', e)
    }
  },

  /** One-time toast payload after offline catch-up or fuel-out; UI shows then clears. */
  lastOfflineSyncToast: null,
  clearLastOfflineSyncToast: () => set({ lastOfflineSyncToast: null }),
  setLastOfflineSyncToast: (payload) => set({ lastOfflineSyncToast: payload }),

  /** Load users from profiles and transactions from DB. Call once on app init. Resume session from session_start_at and run offline burn catch-up. */
  fetchState: async () => {
    set({ isLoading: true })
    try {
      const [profilesRes, txRes] = await Promise.all([
        supabase.from('profiles').select('*').order('id'),
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(MAX_TRANSACTIONS),
      ])
      
      // Если Supabase вернул ошибку по профилям/транзакциям, не оставляем приложение
      // в вечном состоянии «Загрузка…». Пишем ошибку в консоль и включаем
      // безопасный оффлайн‑режим с локальными профилями (Кирилл/Рома).
      if (profilesRes.error || txRes.error) {
        console.error('fetchState: Supabase error', {
          profilesError: profilesRes.error,
          transactionsError: txRes.error,
        })
        const fallbackUsers = [
          { id: 'kirill', name: 'Кирилл', balance: 0, color: 'purple' },
          { id: 'roma', name: 'Рома', balance: 0, color: 'cyan' },
        ]
        set({
          users: fallbackUsers,
          transactions: [],
          raidProgress: 0,
          todayTimeTracking: {},
          isLoading: false,
          lastOfflineSyncToast: {
            message: 'Нет связи с сервером. Включён оффлайн‑режим: данные могут не сохраниться.',
          },
        })
        return
      }
      // CRITICAL: Ensure users are ordered with Kirill first, Roma second
      const allUsers = (profilesRes.data ?? []).map(profileToUser)
      const users = [
        ...allUsers.filter((u) => u.id === 'kirill'),
        ...allUsers.filter((u) => u.id === 'roma'),
        ...allUsers.filter((u) => u.id !== 'kirill' && u.id !== 'roma'),
      ]
      const transactions = (txRes.data ?? []).map(dbTxToStore)
      const profiles = profilesRes.data ?? []
      
      // CRITICAL: Recalculate raid progress from ALL non-burn transactions to ensure sync.
      // RaidBoss tracks NET XP: sum of amounts for type=earn|spend (игровое сгорание type=burn игнорируем).
      const calculatedRaidProgress = transactions
        .filter((t) => t.type === 'earn' || t.type === 'spend')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const savedRaid =
        typeof localStorage !== 'undefined' ? localStorage.getItem(RAID_STORAGE_KEY) : null
      const localRaid =
        savedRaid != null ? Math.max(0, Number(savedRaid) || 0) : get().raidProgress ?? 0

      // Try to load raid_progress from settings; use calculated value as fallback/verification
      let raidProgress = calculatedRaidProgress
      try {
        const { data: settingsRow } = await supabase
          .from('settings')
          .select('key, value')
          .eq('key', 'raid_progress')
          .maybeSingle()
        if (settingsRow && typeof settingsRow.value === 'number') {
          const settingsValue = Number(settingsRow.value) || 0
          // При рассинхроне: используем calculated (транзакции — источник правды) и синхронизируем settings
          if (Math.abs(settingsValue - calculatedRaidProgress) > 10) {
            raidProgress = calculatedRaidProgress
            try {
              await supabase
                .from('settings')
                .upsert({ key: 'raid_progress', value: calculatedRaidProgress }, { onConflict: 'key' })
            } catch (e) {
              console.warn('fetchState: failed to sync raid progress to settings', e)
            }
          } else {
            raidProgress = settingsValue
          }
        } else {
          // No settings value - use calculated from transactions
          raidProgress = calculatedRaidProgress
          // Sync calculated value to settings
          try {
            await supabase
              .from('settings')
              .upsert({ key: 'raid_progress', value: calculatedRaidProgress }, { onConflict: 'key' })
          } catch (e) {
            console.warn('fetchState: failed to sync calculated raid progress to settings', e)
          }
        }
      } catch (e) {
        console.warn('fetchState: raid_progress settings load failed, using calculated value', e)
        raidProgress = calculatedRaidProgress
      }
      
      // Update localStorage with final value
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RAID_STORAGE_KEY, String(raidProgress))
      }

      // Load today's time tracking from profiles.
      // ВАЖНО: не пытаемся здесь определять «новый день» и ничего не сбрасываем в БД.
      // За смену дня отвечает checkDailyReset (использует localStorage и отдельную логику).
      const todayTimeTracking = {}
      profiles.forEach((profile) => {
        if (PILOT_IDS.includes(profile.id)) {
          todayTimeTracking[profile.id] = {
            game: Number(profile.today_game_time ?? 0),
            media: Number(profile.today_media_time ?? 0),
          }
        }
      })

      set({ users, transactions, raidProgress, todayTimeTracking, isLoading: false })

      const now = Date.now()
      let lastOfflineSyncToast = null
      const nextPilots = { ...get().pilots }
      const rawTxs = txRes.data ?? []
      let newSessionTxs = []

      for (const row of profiles) {
        const pilotId = row.id
        if (!PILOT_IDS.includes(pilotId)) continue
        
        // Load server-authoritative timer state
        const timerStatus = row.timer_status ?? 'idle'
        const timerMode = row.timer_mode ?? null
        const timerStartAt = row.timer_start_at ?? null
        const secondsToday = Number(row.seconds_today ?? 0)
        const sessionElapsed = Number(row.session_elapsed ?? 0)
        
        const sessionStartAt = row.session_start_at ?? null
        const lastBurnAt = row.last_burn_at ?? null
        const sessionMode = row.session_mode ?? 'game'

        // If timer_status is idle and no session, initialize empty state
        if (timerStatus === 'idle' && !sessionStartAt) {
          nextPilots[pilotId] = { ...initialPilotState() }
          continue
        }
        
        // CRITICAL: Even if sessionStartAt is missing but timer is running/paused,
        // we need to sync the timer state from timer_status/timer_start_at
        // This ensures Device B gets correct state even if session_start_at is null
        
        // Map timer_mode back to session mode for compatibility
        const effectiveMode = timerMode === 'cartoon' 
          ? (sessionMode === 'good' ? 'good' : 'youtube')
          : (sessionMode === 'game' ? 'game' : sessionMode)

        // Use timer_start_at if available, otherwise session_start_at
        const effectiveStartAt = timerStartAt ?? sessionStartAt
        const startMs = effectiveStartAt ? new Date(effectiveStartAt).getTime() : now
        const actualElapsedMinutes = effectiveStartAt ? (now - startMs) / 60000 : 0
        const sessionMinutes = Math.floor(actualElapsedMinutes)

        const user = get().users.find((x) => x.id === pilotId)
        const balanceAtStart = row.session_balance_at_start != null ? Number(row.session_balance_at_start) : (user?.balance ?? 0)
        const weekend = !isWeekday()
        const maxPossibleMinutes =
          weekend ? Math.min(balanceAtStart, 720) : balanceAtStart
        const missedMinutes = Math.floor((now - (lastBurnAt ? new Date(lastBurnAt).getTime() : startMs)) / 60000)
        const burnableMinutes = Math.min(missedMinutes, maxPossibleMinutes)

        const activeBurnTx = rawTxs.find((t) => t.user_id === pilotId && t.type === 'burn' && t.status === 'active')
        let activeSessionId = activeBurnTx?.id ?? null
        let sessionTotalBurned = activeBurnTx ? Math.max(0, -Number(activeBurnTx.amount)) : 0

        if (!activeSessionId) {
          let desc = '🎮 Игровая сессия (Start)'
          if (sessionMode === 'youtube') desc = '📺 Сессия (Start)'
          else if (sessionMode === 'good') desc = '🍏 Полезная сессия (Start)'
          const burnTxId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
          const { data: newRow } = await supabase
            .from('transactions')
            .insert({
              id: burnTxId,
              user_id: pilotId,
              description: desc,
              amount: 0,
              type: 'burn',
              status: 'active',
            })
            .select('*')
            .single()
          if (newRow) {
            activeSessionId = newRow.id
            sessionTotalBurned = 0
            const newTx = dbTxToStore(newRow)
            newSessionTxs.push(newTx)
            set((s) => ({
              transactions: [newTx, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
            }))
          }
        }

        // Determine status from timer_status
        const pilotStatus = timerStatus === 'running' ? 'RUNNING' 
          : timerStatus === 'paused' ? 'PAUSED' 
          : 'IDLE'
        
        // Current-session elapsed: running → (now - start); paused → session_elapsed
        let calculatedElapsed = 0
        if (timerStatus === 'running' && timerStartAt) {
          const now = Date.now()
          const startMs = new Date(timerStartAt).getTime()
          calculatedElapsed = Math.max(0, Math.floor((now - startMs) / 1000))
        } else if (timerStatus === 'paused') {
          calculatedElapsed = sessionElapsed
        }
        
        set((s) => ({
          pilots: {
            ...s.pilots,
            [pilotId]: {
              status: pilotStatus,
              sessionMinutes,
              burnerActive: pilotStatus === 'RUNNING',
              mode: effectiveMode,
              sessionStartAt: effectiveStartAt ?? sessionStartAt,
              lastBurnAt: lastBurnAt ?? sessionStartAt,
              sessionBalanceAtStart: balanceAtStart,
              activeSessionId,
              sessionTotalBurned,
              timerStatus,
              timerStartAt,
              secondsToday: secondsToday,
              sessionElapsed,
              calculatedElapsedSeconds: calculatedElapsed,
            },
          },
        }))

        if (burnableMinutes >= 1) {
          const sessionMinutesAlready = sessionMinutes - burnableMinutes
          let burned = 0
          // Track time locally as we process each minute
          let localGameTime = get().getTodayGameTime(pilotId)
          let localMediaTime = get().getTodayMediaTime(pilotId)
          
          for (let i = 0; i < burnableMinutes; i++) {
            const u = get().users.find((x) => x.id === pilotId)
            if (u && u.balance <= 0) break

            // Calculate burn rate using tiered system based on current accumulated time
            let rate
            if (sessionMode === 'good') {
              // Полезные мультики: use tiered media rate
              rate = calculateBurnRate('good', localGameTime, localMediaTime)
            } else if (sessionMode === 'youtube') {
              // Media mode: tiered rate
              rate = calculateBurnRate('youtube', localGameTime, localMediaTime)
            } else {
              // Game mode: tiered rate
              rate = calculateBurnRate('game', localGameTime, localMediaTime)
            }

            // Update local time tracking for next iteration
            if (sessionMode === 'good' || sessionMode === 'youtube') {
              localMediaTime += 1
            } else {
              localGameTime += 1
            }

            if (rate === 0) {
              // 0 XP, но считаем экранное время.
              get().addGamingMinutesToday(1, sessionMode, [pilotId])
              continue
            }

            const amount = u ? Math.min(rate, u.balance) : rate
            if (amount <= 0) break
            get().updateSessionBurn(pilotId, amount, sessionMinutesAlready + i + 1, sessionMode)
            burned += amount
          }
          const nowIso = new Date().toISOString()
          try {
            await supabase.from('profiles').update({ last_burn_at: nowIso }).eq('id', pilotId)
          } catch (e) {
            console.error('fetchState offline catch-up update last_burn_at:', e)
          }
          lastOfflineSyncToast = { message: 'Синхронизация: списано за время оффлайна', burned }
        }

        if (actualElapsedMinutes > maxPossibleMinutes) {
          const txId = get().pilots[pilotId]?.activeSessionId
          if (txId) {
            const mode = sessionMode === 'youtube' ? 'youtube' : sessionMode === 'good' ? 'good' : 'game'
            let desc = `🎮 Игровая сессия (${sessionMinutes} мин)`
            if (mode === 'youtube') desc = `📺 Сессия (${sessionMinutes} мин)`
            else if (mode === 'good') desc = `🍏 Полезная сессия (${sessionMinutes} мин)`
            try {
              await supabase.from('transactions').update({ description: desc, status: 'completed' }).eq('id', txId)
            } catch (e) {
              console.error('fetchState finalize tx (fuel out):', e)
            }
            set((s) => ({
              transactions: (s.transactions ?? []).map((t) =>
                t.id === txId ? { ...t, description: desc, status: 'completed' } : t
              ),
            }))
          }
          nextPilots[pilotId] = { ...initialPilotState() }
          try {
            await supabase
              .from('profiles')
              .update({
                session_start_at: null,
                last_burn_at: null,
                session_mode: null,
                session_balance_at_start: null,
                balance: 0,
              })
              .eq('id', pilotId)
          } catch (e) {
            console.error('fetchState clear session (fuel out):', e)
          }
          set((s) => ({
            users: s.users.map((u) => (u.id === pilotId ? { ...u, balance: 0 } : u)),
          }))
          lastOfflineSyncToast = { message: 'Двигатель остановлен: кончилось топливо (защита от минуса)' }
        } else {
          nextPilots[pilotId] = { ...get().pilots[pilotId] }
        }
      }

      set({
        pilots: nextPilots,
        ...(lastOfflineSyncToast ? { lastOfflineSyncToast } : {}),
      })
    } catch (err) {
      console.error('fetchState:', err)
      set({ isLoading: false })
    }
  },

  /** Set users (e.g. from realtime). Keeps shape { id, name, balance, color }. */
  setUsers: (users) => set({ users }),

  /** Sync timer state from DB profile changes (for real-time multi-device sync). */
  /**
   * Calculate elapsed seconds from server-authoritative timer state.
   * Used for cold-start sync: calculates current display time immediately.
   */
  calculateElapsedFromProfile: (profileRow) => {
    const timerStatus = profileRow.timer_status ?? 'idle'
    const timerStartAt = profileRow.timer_start_at ?? null
    const sessionElapsed = Number(profileRow.session_elapsed ?? 0)
    
    if (timerStatus === 'idle') return 0
    if (timerStatus === 'paused') return sessionElapsed
    if (timerStatus === 'running' && timerStartAt) {
      const now = Date.now()
      const startMs = new Date(timerStartAt).getTime()
      return Math.max(0, Math.floor((now - startMs) / 1000))
    }
    return 0
  },

  /**
   * Sync timer state from Supabase profile row (called by realtime subscription).
   * This ensures instant updates when timer is started/paused/stopped on another device.
   * Updates local pilots state with server-authoritative timer fields.
   * CRITICAL: Calculates elapsed time immediately for cold-start sync.
   */
  syncTimerStateFromProfile: (profileRow) => {
    const pilotId = profileRow.id
    if (!PILOT_IDS.includes(pilotId)) return
    
    // Extract timer fields from database row
    const timerStatus = profileRow.timer_status ?? 'idle'
    const timerMode = profileRow.timer_mode ?? null
    const timerStartAt = profileRow.timer_start_at ?? null
    const secondsToday = Number(profileRow.seconds_today ?? 0)
    const sessionElapsed = Number(profileRow.session_elapsed ?? 0)
    
    const state = get()
    const pilot = state.pilots?.[pilotId]
    
    // Map timer_status ('idle'|'running'|'paused') to pilot status ('IDLE'|'RUNNING'|'PAUSED')
    const pilotStatus = timerStatus === 'running' ? 'RUNNING' 
      : timerStatus === 'paused' ? 'PAUSED' 
      : 'IDLE'
    
    // Map timer_mode ('game'|'cartoon') back to session mode ('game'|'youtube'|'good')
    const sessionMode = timerMode === 'cartoon' 
      ? (pilot?.mode === 'good' ? 'good' : 'youtube')
      : (timerMode === 'game' ? 'game' : pilot?.mode ?? 'game')
    
    // CRITICAL: Calculate elapsed time immediately for running timers
    // This ensures Device B shows correct time (e.g., 05:43) on cold start
    const calculatedElapsed = get().calculateElapsedFromProfile(profileRow)
    
    // Calculate sessionMinutes from elapsed seconds for UI display
    const sessionMinutes = Math.floor(calculatedElapsed / 60)
    
    // Update local state immediately (triggers UI re-render)
    set((s) => {
      const currentPilot = s.pilots?.[pilotId]
      if (!currentPilot && pilotStatus === 'IDLE') return s // No need to create idle state
      
      return {
        pilots: {
          ...s.pilots,
          [pilotId]: {
            ...(currentPilot ?? initialPilotState()),
            status: pilotStatus,
            burnerActive: pilotStatus === 'RUNNING',
            mode: pilotStatus !== 'IDLE' ? sessionMode : (currentPilot?.mode ?? null),
            sessionStartAt: timerStartAt ?? currentPilot?.sessionStartAt ?? null,
            sessionMinutes, // Update session minutes from calculated elapsed
            timerStatus,
            timerStartAt,
            secondsToday: secondsToday,
            sessionElapsed,
            calculatedElapsedSeconds: calculatedElapsed,
          },
        },
      }
    })
  },

  /**
   * Supabase Realtime: подписка на profiles и transactions для синхронизации между устройствами.
   * Канал custom-all-channel, обработка INSERT/UPDATE/DELETE.
   * Защита от двойной подписки при React Strict Mode.
   */
  subscribeToRealtime: () => {
    const state = get()
    if (state.realtimeStatus === 'connected' || state.realtimeStatus === 'connecting') {
      console.log('[Realtime] Already subscribed, skipping init.')
      return () => {}
    }

    set({ realtimeStatus: 'connecting' })
    if (import.meta.env.DEV) console.log('[Realtime] Init subscription (profiles + transactions)...')
    const syncTimerStateFromProfile = get().syncTimerStateFromProfile
    let realtimeErrorLogged = false

    const channel = supabase
      .channel('custom-all-channel')
      // profiles: INSERT, UPDATE, DELETE
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const row = payload.new
          if (!row) return
          set((s) => {
            const updatedUser = profileToUser(row)
            const current = s.users ?? []
            const exists = current.some((u) => u.id === updatedUser.id)
            const nextUsers = exists
              ? current.map((u) => (u.id === updatedUser.id ? updatedUser : u))
              : [...current, updatedUser]
            const nextTracking = { ...(s.todayTimeTracking ?? {}) }
            if (PILOT_IDS.includes(row.id)) {
              nextTracking[row.id] = {
                game: Number(row.today_game_time ?? 0),
                media: Number(row.today_media_time ?? 0),
              }
            }
            return { users: nextUsers, todayTimeTracking: nextTracking }
          })
          if (PILOT_IDS.includes(row.id)) syncTimerStateFromProfile(row)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const row = payload.new
          if (!row) return
          const pilotId = row.id
          const incomingSeconds = Number(row.seconds_today ?? 0)
          const localPilot = get().pilots?.[pilotId]
          const localSeconds = localPilot?.secondsToday ?? 0
          if (
            localPilot &&
            localPilot.timerStatus === 'paused' &&
            incomingSeconds < localSeconds
          ) {
            return
          }
          set((s) => {
            const updatedUser = profileToUser(row)
            const current = s.users ?? []
            const exists = current.some((u) => u.id === updatedUser.id)
            const nextUsers = exists
              ? current.map((u) => (u.id === updatedUser.id ? updatedUser : u))
              : [...current, updatedUser]
            const nextTracking = { ...(s.todayTimeTracking ?? {}) }
            if (PILOT_IDS.includes(pilotId)) {
              nextTracking[pilotId] = {
                game: Number(row.today_game_time ?? 0),
                media: Number(row.today_media_time ?? 0),
              }
            }
            return { users: nextUsers, todayTimeTracking: nextTracking }
          })
          if (PILOT_IDS.includes(pilotId)) syncTimerStateFromProfile(row)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        (payload) => {
          const oldRow = payload.old
          if (!oldRow?.id) return
          const deletedId = oldRow.id
          set((s) => ({
            users: (s.users ?? []).filter((u) => u.id !== deletedId),
            pilots: PILOT_IDS.includes(deletedId)
              ? { ...s.pilots, [deletedId]: initialPilotState() }
              : s.pilots,
          }))
        }
      )
      // transactions: INSERT, UPDATE, DELETE
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new
          if (!row) return
          const newTx = dbTxToStore(row)
          set((s) => {
            const list = s.transactions ?? []
            const exists = list.some((t) => t.id === newTx.id)
            if (exists) {
              return { transactions: list.map((t) => (t.id === newTx.id ? newTx : t)) }
            }
            return { transactions: [newTx, ...list].slice(0, MAX_TRANSACTIONS) }
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transactions' },
        (payload) => {
          const row = payload.new
          if (!row) return
          const updatedTx = dbTxToStore(row)
          set((s) => ({
            transactions: (s.transactions ?? []).map((t) =>
              t.id === updatedTx.id ? updatedTx : t
            ),
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'transactions' },
        (payload) => {
          const oldRow = payload.old
          if (!oldRow?.id) return
          const deletedId = oldRow.id
          set((s) => ({
            transactions: (s.transactions ?? []).filter((t) => t.id !== deletedId),
          }))
        }
      )
      .subscribe((status, err) => {
        if (import.meta.env.DEV) console.log('[Realtime] Status:', status, err ?? '')
        if (status === 'SUBSCRIBED') {
          set({ realtimeStatus: 'connected' })
          supabase
            .from('profiles')
            .select('*')
            .in('id', PILOT_IDS)
            .then(({ data: profiles }) => {
              if (profiles) {
                profiles.forEach((profile) => {
                  if (PILOT_IDS.includes(profile.id)) syncTimerStateFromProfile(profile)
                })
                console.log('[Realtime] ✅ Synced current timer state from DB')
              }
            })
            .catch((syncErr) => console.error('[Realtime] Failed to sync current state:', syncErr))
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
          if (!realtimeErrorLogged) {
            realtimeErrorLogged = true
            if (import.meta.env.DEV) console.warn('[Realtime] WebSocket недоступен (работа без live-синхронизации)')
          }
          set({ realtimeStatus: 'error' })
        } else if (status === 'CLOSED') {
          set({ realtimeStatus: 'idle' })
        }
      })

    return () => {
      console.log('[Realtime] Cleaning up channel...')
      supabase.removeChannel(channel)
      set({ realtimeStatus: 'idle' })
    }
  },

  /**
   * Apply raid boss damage when XP is earned.
   * Uses optimistic update, then syncs with Supabase settings (key: raid_progress).
   */
  /**
   * Raid Boss: DB first. Positive amount → boss получает урон. Отрицательное → босс «лечится».
   */
  damageBoss: async (amount) => {
    const delta = Number(amount)
    if (!delta || !Number.isFinite(delta)) return
    try {
      const { data: settingsRow } = await supabase
        .from('settings')
        .select('key, value')
        .eq('key', 'raid_progress')
        .maybeSingle()
      const currentRemote = settingsRow && typeof settingsRow.value === 'number'
        ? Number(settingsRow.value) || 0
        : 0
      const next = Math.max(0, currentRemote + delta)
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'raid_progress', value: next }, { onConflict: 'key' })
      if (error) throw error
      set({ raidProgress: next })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RAID_STORAGE_KEY, String(next))
      }
    } catch (e) {
      console.error('damageBoss: Supabase failed', e)
    }
  },

  /** DB first: insert tx → update profile → damageBoss. Local state only on success. */
  addPoints: async (userId, amount, reason, skipBoss = false) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return
    const today = getDateKey()
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    const lastReset = user?.last_daily_reset ?? null
    const isResetToday = lastReset === today
    const prevDaily = isResetToday ? (user?.daily_points_earned ?? 0) : 0
    const newDailyPoints = prevDaily + num
    const newBalance = (user?.balance ?? 0) + num

    try {
      const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: txRow, error: txErr } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          amount: num,
          description: reason ?? 'Начислено',
          type: 'earn',
        })
        .select('id, created_at')
        .single()
      if (txErr) throw txErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          daily_points_earned: newDailyPoints,
          last_daily_reset: today,
        })
        .eq('id', userId)
      if (profileErr) throw profileErr

      if (!skipBoss) await get().damageBoss(num)

      const entry = {
        id: txRow.id,
        at: new Date(txRow.created_at).getTime(),
        userId,
        description: reason ?? 'Начислено',
        amount: num,
        type: 'earn',
      }
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId
            ? { ...u, balance: newBalance, daily_points_earned: newDailyPoints, last_daily_reset: today }
            : u
        ),
        transactions: [entry, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
      }))
    } catch (e) {
      console.error('addPoints: Supabase failed', e)
    }
  },

  /**
   * DB first (remote-only): insert tx → update profile → damageBoss.
   * Does NOT mutate local users/transactions; intended for optimistic UIs to commit/rollback explicitly.
   */
  addPointsRemote: async (userId, amount, reason, skipBoss = false) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return { ok: false, error: new Error('amount must be > 0') }
    const today = getDateKey()
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    const lastReset = user?.last_daily_reset ?? null
    const isResetToday = lastReset === today
    const prevDaily = isResetToday ? (user?.daily_points_earned ?? 0) : 0
    const newDailyPoints = prevDaily + num
    const newBalance = (user?.balance ?? 0) + num

    try {
      const txId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: txRow, error: txErr } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          amount: num,
          description: reason ?? 'Начислено',
          type: 'earn',
        })
        .select('id, created_at')
        .single()
      if (txErr) throw txErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          balance: newBalance,
          daily_points_earned: newDailyPoints,
          last_daily_reset: today,
        })
        .eq('id', userId)
      if (profileErr) throw profileErr

      if (!skipBoss) await get().damageBoss(num)

      return { ok: true, tx: txRow, today, newBalance, newDailyPoints }
    } catch (e) {
      return { ok: false, error: e }
    }
  },

  /** DB first: reset raid progress in settings. */
  resetRaidProgress: async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'raid_progress', value: 0 }, { onConflict: 'key' })
      if (error) throw error
      set({ raidProgress: 0 })
      if (typeof localStorage !== 'undefined') localStorage.setItem(RAID_STORAGE_KEY, '0')
    } catch (e) {
      console.error('resetRaidProgress: Supabase failed', e)
    }
  },

  /** DB first: insert tx → update profile → damageBoss. Local state only on success. */
  spendPoints: async (userId, amount, reason) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    const newBalance = Math.max(0, (user?.balance ?? 0) - num)

    try {
      const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: txRow, error: txErr } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          amount: -num,
          description: reason ?? 'Списано',
          type: 'spend',
        })
        .select('id, created_at')
        .single()
      if (txErr) throw txErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)
      if (profileErr) throw profileErr

      await get().damageBoss(-num)

      const entry = {
        id: txRow.id,
        at: new Date(txRow.created_at).getTime(),
        userId,
        description: reason ?? 'Списано',
        amount: -num,
        type: 'spend',
      }
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u)),
        transactions: [entry, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
      }))
    } catch (e) {
      console.error('spendPoints: Supabase failed', e)
    }
  },

  /**
   * DB first (remote-only): insert tx → update profile → damageBoss.
   * Does NOT mutate local users/transactions; intended for optimistic UIs to commit/rollback explicitly.
   */
  spendPointsRemote: async (userId, amount, reason) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return { ok: false, error: new Error('amount must be > 0') }
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    const newBalance = Math.max(0, (user?.balance ?? 0) - num)

    try {
      const txId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: txRow, error: txErr } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          amount: -num,
          description: reason ?? 'Списано',
          type: 'spend',
        })
        .select('id, created_at')
        .single()
      if (txErr) throw txErr

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)
      if (profileErr) throw profileErr

      await get().damageBoss(-num)

      return { ok: true, tx: txRow, newBalance }
    } catch (e) {
      return { ok: false, error: e }
    }
  },

  /** DB first: insert transaction for wheel win (amount 0). */
  logWheelWin: async (userId, description) => {
    try {
      const txId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const { data: txRow, error } = await supabase
        .from('transactions')
        .insert({
          id: txId,
          user_id: userId,
          amount: 0,
          description: description ?? '🎰 Выигрыш',
          type: 'earn',
        })
        .select('id, created_at')
        .single()
      if (error) throw error
      const entry = {
        id: txRow.id,
        at: new Date(txRow.created_at).getTime(),
        userId,
        description: description ?? '🎰 Выигрыш',
        amount: 0,
        type: 'earn',
      }
      set((s) => ({
        transactions: [entry, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
      }))
    } catch (e) {
      console.error('logWheelWin: Supabase failed', e)
    }
  },

  /**
   * Доступные спины: floor(daily_points_earned / 50) - spins_used_today.
   * Защита от отрицательных значений.
   */
  getAvailableSpins: (childId) => {
    const state = get()
    const user = state.users.find((u) => u.id === childId)
    const earned = user?.daily_points_earned ?? 0
    const used = user?.spins_used_today ?? 0
    return Math.max(0, Math.floor(earned / 50) - used)
  },

  /**
   * Очков до следующего спина: 50 - (daily_points_earned % 50).
   * При earned % 50 === 0 возвращает 50 (нужно ещё 50 для следующего).
   */
  getPointsToNextSpin: (childId) => {
    const state = get()
    const user = state.users.find((u) => u.id === childId)
    const earned = user?.daily_points_earned ?? 0
    const remainder = earned % 50
    return remainder === 0 ? 50 : 50 - remainder
  },

  /**
   * Daily Points → Spins: DB first. spins_used_today MUST be updated in profiles immediately.
   * @param {string} childId — id пилота (roma | kirill)
   * @param {object} prize — { id, label, type, value, icon }
   * @returns {Promise<boolean>} true если спин использован, false если нет доступных
   */
  useSpin: async (childId, prize) => {
    const state = get()
    const available = get().getAvailableSpins(childId)
    if (available < 1) return false

    const today = getDateKey()
    const user = state.users.find((u) => u.id === childId)
    const lastReset = user?.last_daily_reset ?? null
    const isResetToday = lastReset === today
    const newSpinsUsed = (isResetToday ? (user?.spins_used_today ?? 0) : 0) + 1

    try {
      // 1. CRITICAL: subtract 1 from spins_used_today in profiles FIRST
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          spins_used_today: newSpinsUsed,
          last_daily_reset: today,
        })
        .eq('id', childId)
      if (profileErr) throw profileErr

      // 2. Local state update (Realtime will also deliver, but immediate for UI)
      set((s) => ({
        users: s.users.map((u) =>
          u.id === childId ? { ...u, spins_used_today: newSpinsUsed, last_daily_reset: today } : u
        ),
      }))

      // 3. Записать приз в историю (spinHistory) — локально
      get().addWheelSpin(childId, prize)

      // 4. Записать в transactions (logWheelWin)
      await get().logWheelWin(childId, prize?.label ? `🎰 Daily Roulette: ${prize.label}` : '🎰 Выигрыш')

      // 5. Применить приз: XP если prize.type === 'xp'
      if (prize?.type === 'xp' && typeof prize?.value === 'number' && prize.value > 0) {
        await get().addPoints(childId, prize.value, `🎰 Daily Roulette: ${prize.label ?? 'XP'}`, false)
      }

      return true
    } catch (e) {
      console.error('useSpin: Supabase failed', e)
      return false
    }
  },

  /** Daily Roulette (legacy): DB first. Списывает один спин в profiles. */
  consumeDailySpin: async (pilotId) => {
    const state = get()
    const user = state.users.find((u) => u.id === pilotId)
    const today = getDateKey()
    const remaining = user?.daily_spins_remaining ?? 3
    if (remaining <= 0) return false

    const nextRemaining = remaining - 1
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_spins_remaining: nextRemaining,
          last_spin_date: today,
        })
        .eq('id', pilotId)
      if (error) throw error
      set((s) => ({
        users: s.users.map((u) =>
          u.id === pilotId ? { ...u, daily_spins_remaining: nextRemaining, last_spin_date: today } : u
        ),
      }))
      return true
    } catch (e) {
      console.error('consumeDailySpin: Supabase failed', e)
      return false
    }
  },

  /**
   * Wheel of Fortune: track spin history and daily limits.
   * Keeps a short global history (last 10 spins) and per-pilot counters for today's spins.
   */
  addWheelSpin: (pilotId, prize) => {
    const today = getDateKey()
    const now = Date.now()
    const entry = {
      pilotId,
      itemName: prize?.label ?? '',
      type: prize?.type ?? 'item',
      timestamp: now,
      icon: prize?.icon ?? null,
    }

    set((state) => {
      // Ensure spinsUsedToday is for today
      const currentSpins = state.spinsUsedToday ?? { date: today, roma: 0, kirill: 0 }
      const spins =
        currentSpins.date === today
          ? currentSpins
          : { date: today, roma: 0, kirill: 0 }

      const key = pilotId === 'roma' ? 'roma' : 'kirill'
      const updatedSpins = {
        ...spins,
        [key]: (spins[key] ?? 0) + 1,
      }

      // Append to global history; keep only last 10 entries
      const prevHistory = state.spinHistory ?? []
      const nextHistory = [...prevHistory, entry]
      const limitedHistory =
        nextHistory.length > 10 ? nextHistory.slice(nextHistory.length - 10) : nextHistory

      return {
        spinsUsedToday: updatedSpins,
        spinHistory: limitedHistory,
      }
    })
  },

  /** DB first: delete tx → update profile → raid_progress. Local state only on success. */
  removeTransaction: async (transactionId) => {
    const state = get()
    const tx = (state.transactions ?? []).find((t) => t.id === transactionId)
    if (!tx) return
    const isTemp = String(transactionId).startsWith('temp-')
    if (isTemp) {
      const today = getDateKey()
      const txDate = tx.at ? new Date(tx.at).toISOString().slice(0, 10) : null
      const isEarnToday = tx.type === 'earn' && tx.amount > 0 && txDate === today
      set((s) => {
        let updatedUsers = s.users.map((u) =>
          u.id === tx.userId ? { ...u, balance: Math.max(0, u.balance - tx.amount) } : u
        )
        if (isEarnToday) {
          updatedUsers = updatedUsers.map((u) => {
            if (u.id !== tx.userId) return u
            return { ...u, daily_points_earned: Math.max(0, (u.daily_points_earned ?? 0) - tx.amount) }
          })
        }
        let nextRaid = s.raidProgress ?? 0
        if (tx.type === 'earn' || tx.type === 'spend') {
          nextRaid = Math.max(0, nextRaid - tx.amount)
        }
        return {
          users: updatedUsers,
          transactions: (s.transactions ?? []).filter((t) => t.id !== transactionId),
          raidProgress: nextRaid,
        }
      })
      return
    }

    const today = getDateKey()
    const txDate = tx.at ? new Date(tx.at).toISOString().slice(0, 10) : null
    const isEarnToday = tx.type === 'earn' && tx.amount > 0 && txDate === today

    try {
      const { error: delErr } = await supabase.from('transactions').delete().eq('id', transactionId)
      if (delErr) throw delErr

      const user = state.users.find((u) => u.id === tx.userId)
      const newBalance = Math.max(0, (user?.balance ?? 0) - tx.amount)
      const newDailyEarned = isEarnToday ? Math.max(0, (user?.daily_points_earned ?? 0) - tx.amount) : undefined
      const profileUpdate = { balance: newBalance }
      if (isEarnToday) profileUpdate.daily_points_earned = newDailyEarned

      const { error: profileErr } = await supabase.from('profiles').update(profileUpdate).eq('id', tx.userId)
      if (profileErr) throw profileErr

      let nextRaid = state.raidProgress ?? 0
      if (tx.type === 'earn' || tx.type === 'spend') {
        nextRaid = Math.max(0, nextRaid - tx.amount)
        const { error: raidErr } = await supabase
          .from('settings')
          .upsert({ key: 'raid_progress', value: nextRaid }, { onConflict: 'key' })
        if (raidErr) console.error('removeTransaction: raid_progress sync failed', raidErr)
      }

      set((s) => ({
        users: s.users.map((u) =>
          u.id === tx.userId
            ? { ...u, balance: newBalance, ...(isEarnToday && newDailyEarned != null ? { daily_points_earned: newDailyEarned } : {}) }
            : u
        ),
        transactions: (s.transactions ?? []).filter((t) => t.id !== transactionId),
        raidProgress: nextRaid,
      }))
      if (typeof localStorage !== 'undefined' && (tx.type === 'earn' || tx.type === 'spend')) {
        localStorage.setItem(RAID_STORAGE_KEY, String(nextRaid))
      }
    } catch (e) {
      console.error('removeTransaction: Supabase failed', e)
    }
  },

  purchaseItem: async (userId, item) => {
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    if (!user || user.balance < item.cost) return false
    await get().spendPoints(userId, item.cost, item.name)
    set((s) => ({
      purchases: [...(s.purchases ?? []), { userId, itemId: item.id, itemName: item.name, cost: item.cost, at: Date.now() }],
    }))
    return true
  },

  resetDaily: () =>
    set((state) => ({
      users: state.users.map((u) => ({ ...u, balance: 0 })),
      purchases: state.purchases ?? [],
      transactions: state.transactions ?? [],
    })),
}))
