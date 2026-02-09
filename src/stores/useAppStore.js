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
})

/** Map DB profile row to store user shape. */
function profileToUser(row) {
  return {
    id: row.id,
    name: row.name ?? row.id,
    balance: Number(row.balance) ?? 0,
    color: row.color ?? (row.id === 'roma' ? 'cyan' : 'purple'),
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
   */
  undoDailyTask: (userId, actionId, reason) => {
    const state = get()
    const tx = [...(state.transactions ?? [])]
      .filter((t) => t.userId === userId && t.description === reason && t.amount > 0)
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
      set({ 
        dailyBase: {}, 
        lastActiveDate: today, 
        todayTimeTracking: {},
        spinsUsedToday: { date: today, roma: 0, kirill: 0 },
        spinHistory: [],
      })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('family_lastActiveDate', today)
        localStorage.removeItem('family_dailyBase')
      }
      // Reset time tracking and timer state in database for all pilots
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

  /** Create one transaction row for the session; store its id in pilot.activeSessionId. */
  createSessionTransaction: (pilotId, mode = 'game') => {
    let desc = '🎮 Игровая сессия (Start)'
    if (mode === 'youtube') desc = '📺 Сессия (Start)'
    else if (mode === 'good') desc = '🍏 Полезная сессия (Start)'
    const tempId = `session-${Date.now()}-${pilotId}`
    const entry = {
      id: tempId,
      at: Date.now(),
      userId: pilotId,
      description: desc,
      amount: 0,
      type: 'burn',
      status: 'active',
    }
    set((s) => ({
      pilots: {
        ...s.pilots,
        [pilotId]: {
          ...s.pilots[pilotId],
          activeSessionId: tempId,
          sessionTotalBurned: 0,
        },
      },
      transactions: [entry, ...(s.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
    }))
    ;(async () => {
      try {
        const { data: row } = await supabase
          .from('transactions')
          .insert({
            user_id: pilotId,
            description: desc,
            amount: 0,
            type: 'burn',
            status: 'active',
          })
          .select('id, created_at')
          .single()
        if (row) {
          set((s) => ({
            pilots: {
              ...s.pilots,
              [pilotId]: { ...s.pilots[pilotId], activeSessionId: row.id },
            },
            transactions: s.transactions.map((t) =>
              t.id === tempId ? { ...t, id: row.id, at: new Date(row.created_at).getTime() } : t
            ),
          }))
        }
      } catch (e) {
        console.error('createSessionTransaction:', e)
      }
    })()
  },

  /**
   * Update the SINGLE active session transaction (in-place). Never insert/create here.
   * The session row is created once by createSessionTransaction when the engine starts.
   * We only UPDATE that row by activeSessionId (increment amount burned, refresh description).
   */
  updateSessionBurn: (pilotId, rate, durationMinutes, mode = 'game') => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    const txId = pilot?.activeSessionId
    if (!txId) return // No active session row — do not create one here; createSessionTransaction handles that
    const newTotal = (pilot.sessionTotalBurned ?? 0) + rate
    let desc = `🎮 Игровая сессия (${durationMinutes} мин)`
    if (mode === 'youtube') desc = `📺 Сессия (${durationMinutes} мин)`
    else if (mode === 'good') desc = `🍏 Полезная сессия (${durationMinutes} мин)`
    set((s) => {
      const u = s.users.find((x) => x.id === pilotId)
      const newBalance = u ? Math.max(0, (u.balance ?? 0) - rate) : 0
      // In-place UPDATE only: find the active session tx by id and update it; never push a new transaction
      const txList = (s.transactions ?? []).map((t) =>
        t.id === txId ? { ...t, amount: -newTotal, description: desc } : t
      )
      return {
        users: s.users.map((u) => (u.id === pilotId ? { ...u, balance: newBalance } : u)),
        transactions: txList,
        pilots: {
          ...s.pilots,
          [pilotId]: { ...s.pilots[pilotId], sessionTotalBurned: newTotal },
        },
      }
    })
    const user = get().users.find((u) => u.id === pilotId)
    get().addGamingMinutesToday(1, mode, [pilotId])
    ;(async () => {
      try {
        // Get updated time tracking after increment
        const updatedState = get()
        const timeTracking = updatedState.todayTimeTracking?.[pilotId] ?? { game: 0, media: 0 }
        await supabase
          .from('transactions')
          .update({ amount: -newTotal, description: desc })
          .eq('id', txId)
        await supabase
          .from('profiles')
          .update({
            balance: Math.max(0, (user?.balance ?? 0) - rate),
            today_game_time: timeTracking.game,
            today_media_time: timeTracking.media,
          })
          .eq('id', pilotId)
      } catch (e) {
        console.error('updateSessionBurn sync:', e)
      }
    })()
  },

  /** Finalize session transaction (description, status=completed) and clear pilot session state. */
  finalizeSessionTransaction: (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    const txId = pilot?.activeSessionId
    const sessionMinutes = pilot?.sessionMinutes ?? 0
    const mode = pilot?.mode ?? 'game'
    let desc = `🎮 Игровая сессия (${sessionMinutes} мин)`
    if (mode === 'youtube') desc = `📺 Сессия (${sessionMinutes} мин)`
    else if (mode === 'good') desc = `🍏 Полезная сессия (${sessionMinutes} мин)`
    if (txId) {
      set((s) => {
        const txList = (s.transactions ?? []).map((t) =>
          t.id === txId ? { ...t, description: desc, status: 'completed' } : t
        )
        return {
          transactions: txList,
          pilots: {
            ...s.pilots,
            [pilotId]: initialPilotState(),
          },
        }
      })
      ;(async () => {
        try {
          await supabase.from('transactions').update({ description: desc, status: 'completed' }).eq('id', txId)
        } catch (e) {
          console.error('finalizeSessionTransaction:', e)
        }
      })()
    } else {
      set((s) => ({
        pilots: { ...s.pilots, [pilotId]: initialPilotState() },
      }))
    }
  },

  startTimer: async (pilotId, mode = 'game') => {
    const state = get()
    const user = state.users.find((u) => u.id === pilotId)
    const balanceAtStart = user ? Math.max(0, user.balance) : 0
    const previousSecondsToday = state.pilots?.[pilotId]?.secondsToday ?? 0
    const now = new Date().toISOString()
    const m = mode === 'youtube' ? 'youtube' : mode === 'good' ? 'good' : 'game'
    // Map mode to timer_mode: 'game' or 'cartoon' (youtube/good are cartoons)
    const timerMode = m === 'game' ? 'game' : 'cartoon'
    
    try {
      // CRITICAL: Update Supabase FIRST (server is source of truth)
      await supabase
        .from('profiles')
        .update({
          timer_status: 'running',
          timer_mode: timerMode,
          timer_start_at: now,
          // Preserve seconds_today (don't reset on start)
        })
        .eq('id', pilotId)
      
      // After DB update succeeds, update local state
      set((s) => ({
        pilots: {
          ...s.pilots,
          [pilotId]: {
            status: 'RUNNING',
            sessionMinutes: 0,
            burnerActive: true,
            mode: m,
            sessionStartAt: now,
            lastBurnAt: now,
            sessionBalanceAtStart: balanceAtStart,
            activeSessionId: null,
            sessionTotalBurned: 0,
            timerStatus: 'running',
            timerStartAt: now,
            // Preserve any accumulated seconds so UI never flashes to 0.
            secondsToday: previousSecondsToday,
          },
        },
      }))
      get().createSessionTransaction(pilotId, m)
    } catch (e) {
      console.error('startTimer sync:', e)
      throw e // Re-throw so caller can handle error
    }
  },

  // Legacy alias for backward compatibility
  startEngine: (pilotId, mode = 'game') => {
    get().startTimer(pilotId, mode)
  },

  pauseTimer: (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.status !== 'RUNNING') return
    
    // STEP 1: локально считаем дельту и немедленно обновляем стор (оптимистично)
    const now = Date.now()
    let elapsedSeconds = 0
    if (pilot.timerStartAt) {
      const startMs = new Date(pilot.timerStartAt).getTime()
      elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000))
    }
    const baseSeconds = pilot.secondsToday ?? 0
    const newSecondsToday = baseSeconds + elapsedSeconds

    set((s) => ({
      pilots: {
        ...s.pilots,
        [pilotId]: {
          ...s.pilots[pilotId],
          status: 'PAUSED',
          burnerActive: false,
          timerStatus: 'paused',
          timerStartAt: null,
          secondsToday: newSecondsToday,
        },
      },
    }))

    // STEP 2: асинхронно синхронизируемся с Supabase
    ;(async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            timer_status: 'paused',
            seconds_today: newSecondsToday,
            timer_start_at: null,
          })
          .eq('id', pilotId)
      } catch (e) {
        console.error('pauseTimer sync:', e)
      }
    })()
  },

  // Legacy alias for backward compatibility
  pauseEngine: (pilotId) => {
    get().pauseTimer(pilotId)
  },

  resumeTimer: (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.status !== 'PAUSED') return
    
    const now = new Date().toISOString()
    
    // CRITICAL: Update DB first
    ;(async () => {
      try {
        // Get timer_mode + seconds_today from DB, но секунды берём максимумом:
        // локальное (store) значение важнее, если оно больше (мы уже могли посчитать паузу).
        const { data: profile } = await supabase
          .from('profiles')
          .select('timer_mode, seconds_today')
          .eq('id', pilotId)
          .single()
        
        const timerMode = profile?.timer_mode ?? 'game'
        const dbSecondsToday = Number(profile?.seconds_today ?? 0)
        const localSecondsToday = pilot.secondsToday ?? 0
        const secondsToday = Math.max(localSecondsToday, dbSecondsToday)
        
        // Update DB: status='running', timer_start_at=NOW(), seconds_today = max(local, db)
        await supabase
          .from('profiles')
          .update({
            timer_status: 'running',
            timer_start_at: now,
            timer_mode: timerMode,
            seconds_today: secondsToday,
          })
          .eq('id', pilotId)
        
        // Update local state after DB update
        set((state) => ({
          pilots: {
            ...state.pilots,
            [pilotId]: { 
              ...state.pilots[pilotId], 
              status: 'RUNNING', 
              burnerActive: true,
              sessionStartAt: now,
              timerStatus: 'running',
              timerStartAt: now,
              secondsToday: secondsToday,
            },
          },
        }))
      } catch (e) {
        console.error('resumeTimer sync:', e)
      }
    })()
  },

  // Legacy alias for backward compatibility
  resumeEngine: (pilotId) => {
    get().resumeTimer(pilotId)
  },

  stopTimer: (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.status === 'IDLE') return
    
    // CRITICAL: Calculate elapsed from server state, then update DB and trigger burn
    ;(async () => {
      try {
        // Get current timer state from DB (source of truth)
        const { data: profile } = await supabase
          .from('profiles')
          .select('seconds_today, timer_status, timer_start_at, timer_mode')
          .eq('id', pilotId)
          .single()
        
        const currentSecondsToday = Number(profile?.seconds_today ?? 0)
        let finalSecondsToday = currentSecondsToday
        let elapsedSeconds = 0
        
        // Calculate elapsed if timer was running (not already paused)
        if (profile?.timer_status === 'running' && profile?.timer_start_at) {
          const now = new Date()
          const timerStartAt = new Date(profile.timer_start_at)
          elapsedSeconds = Math.floor((now.getTime() - timerStartAt.getTime()) / 1000)
          finalSecondsToday = currentSecondsToday + elapsedSeconds
        }
        
        const timerMode = profile?.timer_mode ?? 'game'
        const totalMinutes = Math.floor(finalSecondsToday / 60)
        
        // Update DB: status='idle', timer_start_at=null, seconds_today=total
        await supabase
          .from('profiles')
          .update({ 
            timer_status: 'idle',
            timer_mode: null,
            timer_start_at: null,
            seconds_today: finalSecondsToday,
            session_start_at: null, 
            last_burn_at: null, 
            session_mode: null, 
            session_balance_at_start: null 
          })
          .eq('id', pilotId)
        
        // Finalize session transaction (per-minute burns already happened during session)
        get().finalizeSessionTransaction(pilotId)
        
        // Note: Burn transactions are handled per-minute during the session via updateSessionBurn
        // This stopTimer just clears the timer state and finalizes the session
        
        // Update local state after DB update
        set((state) => ({
          pilots: {
            ...state.pilots,
            [pilotId]: initialPilotState(),
          },
        }))
      } catch (e) {
        console.error('stopTimer sync:', e)
      }
    })()
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

  /** After each minute burn: update last_burn_at in Supabase to avoid double-charge across devices. */
  updateLastBurnAt: (pilotId) => {
    const now = new Date().toISOString()
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
    ;(async () => {
      try {
        await supabase.from('profiles').update({ last_burn_at: now }).eq('id', pilotId)
      } catch (e) {
        console.error('updateLastBurnAt:', e)
      }
    })()
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
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(MAX_TRANSACTIONS),
      ])
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
          // Use settings value, but if calculated differs significantly, log warning
          raidProgress = settingsValue
          if (Math.abs(settingsValue - calculatedRaidProgress) > 10) {
            console.warn(
              `Raid progress desync detected: settings=${settingsValue}, calculated=${calculatedRaidProgress}. Using settings value.`
            )
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

      // Load today's time tracking from profiles
      const today = getDateKey()
      const lastActive = get().lastActiveDate
      const todayTimeTracking = {}
      
      // If it's a new day, reset time tracking
      if (lastActive !== today) {
        profiles.forEach((profile) => {
          if (PILOT_IDS.includes(profile.id)) {
            todayTimeTracking[profile.id] = { game: 0, media: 0 }
          }
        })
        // Reset in database
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
                })
                .eq('id', id)
            )
          )
        } catch (e) {
          console.warn('fetchState: failed to reset time tracking for new day', e)
        }
      } else {
        profiles.forEach((profile) => {
          if (PILOT_IDS.includes(profile.id)) {
            todayTimeTracking[profile.id] = {
              game: Number(profile.today_game_time ?? 0),
              media: Number(profile.today_media_time ?? 0),
            }
          }
        })
      }

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
          const { data: newRow } = await supabase
            .from('transactions')
            .insert({
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
        
        // CRITICAL: Calculate elapsed time immediately for running timers (cold-start fix)
        // Note: effectiveStartAt already declared above
        // This ensures Device B shows correct time immediately on page load
        let calculatedElapsed = 0
        if (timerStatus === 'running' && timerStartAt) {
          const now = Date.now()
          const startMs = new Date(timerStartAt).getTime()
          const currentSegmentSeconds = Math.floor((now - startMs) / 1000)
          calculatedElapsed = secondsToday + currentSegmentSeconds
        } else if (timerStatus === 'paused') {
          calculatedElapsed = secondsToday
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
              // Store server timer state for UI calculation
              timerStatus,
              timerStartAt,
              secondsToday: secondsToday,
              // Store calculated elapsed for immediate display (cold-start fix)
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
    const secondsToday = Number(profileRow.seconds_today ?? 0)
    
    if (timerStatus === 'idle') return 0
    
    if (timerStatus === 'paused') {
      return secondsToday
    }
    
    // Running: calculate elapsed since timer_start_at + accumulated seconds_today
    if (timerStatus === 'running' && timerStartAt) {
      const now = Date.now()
      const startMs = new Date(timerStartAt).getTime()
      const currentSegmentSeconds = Math.floor((now - startMs) / 1000)
      return secondsToday + currentSegmentSeconds
    }
    
    return secondsToday
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
            timerStatus, // Server-authoritative timer status
            timerStartAt, // Server timestamp when current segment started
            secondsToday: secondsToday, // Accumulated seconds (excluding current run)
            // Store calculated elapsed for immediate display (cold-start fix)
            calculatedElapsedSeconds: calculatedElapsed,
          },
        },
      }
    })
  },

  /**
   * Supabase Realtime: subscribe to profiles updates for instant timer sync.
   * Listens for UPDATEs on public.profiles and immediately syncs:
   * - users list (balance, name, color)
   * - pilots' timer fields (timer_status, timer_start_at, seconds_today, timer_mode)
   *
   * IMPORTANT: protects against race conditions by ignoring "older" payloads
   * where seconds_today is lower than our local paused secondsToday.
   *
   * Returns an unsubscribe function that removes the channel.
   */
  subscribeToRealtime: () => {
    const syncTimerStateFromProfile = get().syncTimerStateFromProfile

    // Mark as connecting so UI can show small sync indicator
    set({ realtimeStatus: 'connecting' })

    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const row = payload.new
          if (!row) return

          const pilotId = row.id
          if (!PILOT_IDS.includes(pilotId)) {
            return
          }

           // Защита от гонок: если локально уже пауза с бОльшим временем,
           // не даём более старому состоянию из БД затереть store.
           const incomingSeconds = Number(row.seconds_today ?? 0)
           const localState = get()
           const localPilot = localState.pilots?.[pilotId]
           const localSeconds = localPilot?.secondsToday ?? 0

           if (
             localPilot &&
             localPilot.timerStatus === 'paused' &&
             incomingSeconds < localSeconds
           ) {
             // Игнорируем устаревшее событие
             return
           }

          // Update users collection (balance, name, color) from latest profile row
          set((state) => {
            const updatedUser = profileToUser(row)
            const current = state.users ?? []
            const exists = current.some((u) => u.id === updatedUser.id)
            return {
              users: exists
                ? current.map((u) => (u.id === updatedUser.id ? updatedUser : u))
                : [...current, updatedUser],
            }
          })

          // CRITICAL: sync pilot timer state immediately from DB
          syncTimerStateFromProfile(row)
        }
      )
      .subscribe(async (status, err) => {
        console.log('[Realtime] Channel status:', status, err)
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Subscribed to public.profiles updates')
          set({ realtimeStatus: 'connected' })
          
          // CRITICAL: Immediately sync current timer state from DB after subscription
          // This ensures Device B gets correct state right away, not just future updates
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', PILOT_IDS)
            
            if (profiles) {
              profiles.forEach((profile) => {
                if (PILOT_IDS.includes(profile.id)) {
                  syncTimerStateFromProfile(profile)
                }
              })
              console.log('[Realtime] ✅ Synced current timer state from DB')
            }
          } catch (syncErr) {
            console.error('[Realtime] Failed to sync current state:', syncErr)
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
          console.error('[Realtime] ❌ Channel error:', status, err)
          set({ realtimeStatus: 'error' })
        } else if (status === 'CLOSED') {
          console.log('[Realtime] Channel closed')
          set({ realtimeStatus: 'idle' })
        } else {
          // Other statuses like 'JOINING', 'JOINED' - keep as connecting
          console.log('[Realtime] Channel status:', status)
        }
      })

    // Expose cleanup to callers (Dashboard/App)
    return () => {
      supabase.removeChannel(channel)
      set({ realtimeStatus: 'idle' })
    }
  },

  /**
   * Apply raid boss damage when XP is earned.
   * Uses optimistic update, then syncs with Supabase settings (key: raid_progress).
   */
  /**
   * CRITICAL: Raid Boss contribution — tracks NET XP (earn/spend, excluding burn).
   * Positive amount → boss получает урон. Отрицательное → босс «лечится».
   * Позволяем overflow выше RAID_TARGET, но не опускаемся ниже 0.
   */
  damageBoss: (amount) => {
    const delta = Number(amount)
    if (!delta || !Number.isFinite(delta)) return

    // Optimistic local update so UI (RaidBoss) reacts instantly.
    set((state) => {
      const current = state.raidProgress ?? 0
      const next = Math.max(0, current + delta)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RAID_STORAGE_KEY, String(next))
      }
      return { raidProgress: next }
    })

    // Sync with settings table; use remote value as source of truth when possible.
    ;(async () => {
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
        await supabase
          .from('settings')
          .upsert({ key: 'raid_progress', value: next }, { onConflict: 'key' })
        set({ raidProgress: next })
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RAID_STORAGE_KEY, String(next))
        }
      } catch (e) {
        console.warn('damageBoss settings sync (optional):', e)
      }
    })()
  },

  // skipBoss: true — не трогаем Raid Boss (для возвратов и т.п.)
  addPoints: (userId, amount, reason, skipBoss = false) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const entry = {
      id: tempId,
      at: Date.now(),
      userId,
      description: reason ?? 'Начислено',
      amount: num,
      type: 'earn',
    }
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, balance: u.balance + num } : u
      ),
      transactions: [entry, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
    }))
    ;(async () => {
      try {
        const { data: txRow } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: num,
            description: reason ?? 'Начислено',
            type: 'earn',
          })
          .select('id, created_at')
          .single()
        const user = get().users.find((u) => u.id === userId)
        await supabase.from('profiles').update({ balance: user?.balance ?? 0 }).eq('id', userId)

        // Raid Boss: apply net positive XP as damage (если не пропущено флагом).
        if (!skipBoss) get().damageBoss(num)
        if (txRow) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === tempId ? { ...t, id: txRow.id, at: new Date(txRow.created_at).getTime() } : t
            ),
          }))
        }
      } catch (e) {
        console.error('addPoints sync:', e)
      }
    })()
  },

  /**
   * Reset raid progress to 0. Note: This does NOT delete transactions,
   * so recalculating from transactions will restore progress.
   * For a true reset, transactions should be cleared separately.
   */
  resetRaidProgress: () => {
    set({ raidProgress: 0 })
    if (typeof localStorage !== 'undefined') localStorage.setItem(RAID_STORAGE_KEY, '0')
    ;(async () => {
      try {
        await supabase
          .from('settings')
          .upsert({ key: 'raid_progress', value: 0 }, { onConflict: 'key' })
      } catch (e) {
        console.warn('resetRaidProgress settings sync (optional):', e)
      }
    })()
  },

  spendPoints: (userId, amount, reason) => {
    const num = Math.abs(Number(amount))
    if (!num || num <= 0) return
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const entry = {
      id: tempId,
      at: Date.now(),
      userId,
      description: reason ?? 'Списано',
      amount: -num,
      type: 'spend',
    }
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, balance: Math.max(0, u.balance - num) } : u
      ),
      transactions: [entry, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
    }))
    ;(async () => {
      try {
        const { data: txRow } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: -num,
            description: reason ?? 'Списано',
            type: 'spend',
          })
          .select('id, created_at')
          .single()
        const user = get().users.find((u) => u.id === userId)
        await supabase.from('profiles').update({ balance: Math.max(0, user?.balance ?? 0) }).eq('id', userId)

        // Raid Boss: negative XP (штрафы/ручное снятие) лечит босса.
        get().damageBoss(-num)

        if (txRow) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === tempId ? { ...t, id: txRow.id, at: new Date(txRow.created_at).getTime() } : t
            ),
          }))
        }
      } catch (e) {
        console.error('spendPoints sync:', e)
      }
    })()
  },

  /** Log a wheel-of-fortune win (record only, amount 0). For +20 min use addPoints separately. */
  logWheelWin: (userId, description) => {
    const tempId = `wheel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const entry = {
      id: tempId,
      at: Date.now(),
      userId,
      description: description ?? '🎰 Выигрыш',
      amount: 0,
      type: 'earn',
    }
    set((state) => ({
      transactions: [entry, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
    }))
    ;(async () => {
      try {
        const { data: txRow } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: 0,
            description: description ?? '🎰 Выигрыш',
            type: 'earn',
          })
          .select('id, created_at')
          .single()
        if (txRow) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === tempId ? { ...t, id: txRow.id, at: new Date(txRow.created_at).getTime() } : t
            ),
          }))
        }
      } catch (e) {
        console.warn('logWheelWin sync (optional):', e)
      }
    })()
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

  removeTransaction: (transactionId) => {
    const state = get()
    const tx = (state.transactions ?? []).find((t) => t.id === transactionId)
    if (!tx) return
    const isTemp = String(transactionId).startsWith('temp-')

    set((s) => {
      // Invert transaction impact on balance.
      const updatedUsers = s.users.map((u) =>
        u.id === tx.userId ? { ...u, balance: Math.max(0, u.balance - tx.amount) } : u
      )

      // CRITICAL: Roll back raid progress for NON-burn transactions.
      // RaidBoss = sum(amount) по earn|spend, поэтому удаление даёт delta = -tx.amount.
      let nextRaid = s.raidProgress ?? 0
      if (tx.type === 'earn' || tx.type === 'spend') {
        nextRaid = Math.max(0, nextRaid - tx.amount)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(RAID_STORAGE_KEY, String(nextRaid))
        }
      }

      return {
        users: updatedUsers,
        transactions: (s.transactions ?? []).filter((t) => t.id !== transactionId),
        raidProgress: nextRaid,
      }
    })
    
    if (!isTemp) {
      ;(async () => {
        try {
          await supabase.from('transactions').delete().eq('id', transactionId)
          const user = get().users.find((u) => u.id === tx.userId)
          await supabase.from('profiles').update({ balance: Math.max(0, user?.balance ?? 0) }).eq('id', tx.userId)

          // CRITICAL: Sync raid progress rollback to Supabase for NON-burn transactions.
          if (tx.type === 'earn' || tx.type === 'spend') {
            const raidProgress = get().raidProgress ?? 0
            try {
              await supabase
                .from('settings')
                .upsert({ key: 'raid_progress', value: raidProgress }, { onConflict: 'key' })
            } catch (e) {
              console.warn('removeTransaction raid_progress sync (optional):', e)
            }
          }
        } catch (e) {
          console.error('removeTransaction sync:', e)
        }
      })()
    }
  },

  purchaseItem: (userId, item) => {
    const state = get()
    const user = state.users.find((u) => u.id === userId)
    if (!user || user.balance < item.cost) return false
    get().spendPoints(userId, item.cost, item.name)
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
