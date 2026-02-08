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

const PILOT_IDS = ['roma', 'kirill']

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

export const useAppStore = create((set, get) => ({
  users: [],
  transactions: [],
  purchases: [],
  isLoading: true,

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
      set({ dailyBase: {}, lastActiveDate: today })
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('family_lastActiveDate', today)
        localStorage.removeItem('family_dailyBase')
      }
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
  /** По дням и режимам: { [dateKey]: { game: { roma, kirill }, youtube: { roma, kirill } } } */
  dailyGamingBreakdown: {},
  totalFlightTimeMinutes: 0,
  addGamingMinutesToday: (minutes, mode = 'game', pilotIds = []) =>
    set((state) => {
      const today = getDateKey()
      const prev = state.gamingToday?.dateKey === today ? state.gamingToday.minutes : 0
      const dayMinutes = (state.dailyGamingMinutes?.[today] ?? 0) + minutes
      const totalFlight = (state.totalFlightTimeMinutes ?? 0) + minutes
      const prevBreakdown = state.dailyGamingBreakdown?.[today] ?? {
        game: { roma: 0, kirill: 0 },
        youtube: { roma: 0, kirill: 0 },
      }
      const nextBreakdown = { ...prevBreakdown }
      nextBreakdown.game = { ...prevBreakdown.game }
      nextBreakdown.youtube = { ...prevBreakdown.youtube }
      const modeKey = mode === 'youtube' ? 'youtube' : 'game'
      pilotIds.forEach((id) => {
        if (id === 'roma' || id === 'kirill') {
          nextBreakdown[modeKey][id] = (nextBreakdown[modeKey][id] ?? 0) + minutes
        }
      })
      return {
        gamingToday: { dateKey: today, minutes: prev + minutes },
        dailyGamingMinutes: { ...(state.dailyGamingMinutes ?? {}), [today]: dayMinutes },
        dailyGamingBreakdown: { ...(state.dailyGamingBreakdown ?? {}), [today]: nextBreakdown },
        totalFlightTimeMinutes: totalFlight,
      }
    }),
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
    const isYoutube = mode === 'youtube'
    const desc = isYoutube ? '📺 Сессия (Start)' : '🎮 Игровая сессия (Start)'
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
    const isYoutube = mode === 'youtube'
    const desc = isYoutube ? `📺 Сессия (${durationMinutes} мин)` : `🎮 Игровая сессия (${durationMinutes} мин)`
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
        await supabase
          .from('transactions')
          .update({ amount: -newTotal, description: desc })
          .eq('id', txId)
        await supabase
          .from('profiles')
          .update({ balance: Math.max(0, (user?.balance ?? 0) - rate) })
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
    const isYoutube = mode === 'youtube'
    const desc = isYoutube ? `📺 Сессия (${sessionMinutes} мин)` : `🎮 Игровая сессия (${sessionMinutes} мин)`
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

  startEngine: (pilotId, mode = 'game') => {
    const state = get()
    const user = state.users.find((u) => u.id === pilotId)
    const balanceAtStart = user ? Math.max(0, user.balance) : 0
    const now = new Date().toISOString()
    const m = mode === 'youtube' ? 'youtube' : 'game'
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
        },
      },
    }))
    get().createSessionTransaction(pilotId, m)
    ;(async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            session_start_at: now,
            last_burn_at: now,
            session_mode: m,
            session_balance_at_start: balanceAtStart,
          })
          .eq('id', pilotId)
      } catch (e) {
        console.error('startEngine sync:', e)
      }
    })()
  },

  pauseEngine: (pilotId) =>
    set((state) => ({
      pilots: {
        ...state.pilots,
        [pilotId]: { ...state.pilots[pilotId], status: 'PAUSED', burnerActive: false },
      },
    })),

  resumeEngine: (pilotId) =>
    set((state) => ({
      pilots: {
        ...state.pilots,
        [pilotId]: { ...state.pilots[pilotId], status: 'RUNNING', burnerActive: true },
      },
    })),

  stopEngine: (pilotId) => {
    const state = get()
    const pilot = state.pilots?.[pilotId]
    if (!pilot || pilot.status === 'IDLE') return
    get().finalizeSessionTransaction(pilotId)
    ;(async () => {
      try {
        await supabase
          .from('profiles')
          .update({ session_start_at: null, last_burn_at: null, session_mode: null, session_balance_at_start: null })
          .eq('id', pilotId)
      } catch (e) {
        console.error('stopEngine sync:', e)
      }
    })()
  },

  toggleAll: (action, mode = 'game') => {
    if (action === 'start') {
      const state = get()
      const romaBalance = state.users.find((u) => u.id === 'roma')?.balance ?? 0
      const kirillBalance = state.users.find((u) => u.id === 'kirill')?.balance ?? 0
      const now = new Date().toISOString()
      const m = mode === 'youtube' ? 'youtube' : 'game'
      set((s) => ({
        pilots: {
          ...s.pilots,
          roma: {
            status: 'RUNNING',
            sessionMinutes: 0,
            burnerActive: true,
            mode: m,
            sessionStartAt: now,
            lastBurnAt: now,
            sessionBalanceAtStart: Math.max(0, romaBalance),
            activeSessionId: null,
            sessionTotalBurned: 0,
          },
          kirill: {
            status: 'RUNNING',
            sessionMinutes: 0,
            burnerActive: true,
            mode: m,
            sessionStartAt: now,
            lastBurnAt: now,
            sessionBalanceAtStart: Math.max(0, kirillBalance),
            activeSessionId: null,
            sessionTotalBurned: 0,
          },
        },
      }))
      get().createSessionTransaction('roma', m)
      get().createSessionTransaction('kirill', m)
      ;(async () => {
        try {
          await Promise.all([
            supabase
              .from('profiles')
              .update({
                session_start_at: now,
                last_burn_at: now,
                session_mode: m,
                session_balance_at_start: Math.max(0, romaBalance),
              })
              .eq('id', 'roma'),
            supabase
              .from('profiles')
              .update({
                session_start_at: now,
                last_burn_at: now,
                session_mode: m,
                session_balance_at_start: Math.max(0, kirillBalance),
              })
              .eq('id', 'kirill'),
          ])
        } catch (e) {
          console.error('toggleAll start sync:', e)
        }
      })()
    } else if (action === 'pause') {
      set((state) => ({
        pilots: {
          ...state.pilots,
          roma: { ...state.pilots.roma, status: 'PAUSED', burnerActive: false },
          kirill: { ...state.pilots.kirill, status: 'PAUSED', burnerActive: false },
        },
      }))
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

  /** Разбивка за сегодня: игра + мультики по каждому пилоту, с учётом текущих сессий. */
  getDisplayBreakdownToday: () => {
    const state = get()
    const today = getDateKey()
    const saved = state.dailyGamingBreakdown?.[today] ?? {
      game: { roma: 0, kirill: 0 },
      youtube: { roma: 0, kirill: 0 },
    }
    const game = { ...saved.game }
    const youtube = { ...saved.youtube }
    PILOT_IDS.forEach((id) => {
      const p = state.pilots?.[id]
      if (!p || p.status === 'IDLE' || !p.mode) return
      const cur = p.sessionMinutes ?? 0
      if (cur <= 0) return
      const key = p.mode === 'youtube' ? 'youtube' : 'game'
      if (key === 'game') game[id] = (game[id] ?? 0) + cur
      else youtube[id] = (youtube[id] ?? 0) + cur
    })
    return { game, youtube }
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
      const users = (profilesRes.data ?? []).map(profileToUser)
      const transactions = (txRes.data ?? []).map(dbTxToStore)
      const profiles = profilesRes.data ?? []
      const savedRaid =
        typeof localStorage !== 'undefined' ? localStorage.getItem(RAID_STORAGE_KEY) : null
      const raidProgress =
        savedRaid != null ? Math.min(RAID_TARGET, Math.max(0, Number(savedRaid) || 0)) : get().raidProgress ?? 0

      set({ users, transactions, raidProgress, isLoading: false })

      const now = Date.now()
      let lastOfflineSyncToast = null
      const nextPilots = { ...get().pilots }
      const rawTxs = txRes.data ?? []
      let newSessionTxs = []

      for (const row of profiles) {
        const pilotId = row.id
        if (!PILOT_IDS.includes(pilotId)) continue
        const sessionStartAt = row.session_start_at ?? null
        const lastBurnAt = row.last_burn_at ?? null
        const sessionMode = row.session_mode ?? 'game'

        if (!sessionStartAt) {
          nextPilots[pilotId] = { ...initialPilotState() }
          continue
        }

        const startMs = new Date(sessionStartAt).getTime()
        const actualElapsedMinutes = (now - startMs) / 60000
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
          const desc = sessionMode === 'youtube' ? '📺 Сессия (Start)' : '🎮 Игровая сессия (Start)'
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

        set((s) => ({
          pilots: {
            ...s.pilots,
            [pilotId]: {
              status: 'RUNNING',
              sessionMinutes,
              burnerActive: true,
              mode: sessionMode === 'youtube' ? 'youtube' : 'game',
              sessionStartAt,
              lastBurnAt: lastBurnAt ?? sessionStartAt,
              sessionBalanceAtStart: balanceAtStart,
              activeSessionId,
              sessionTotalBurned,
            },
          },
        }))

        if (burnableMinutes >= 1) {
          const sessionMinutesAlready = sessionMinutes - burnableMinutes
          let burned = 0
          for (let i = 0; i < burnableMinutes; i++) {
            const u = get().users.find((x) => x.id === pilotId)
            if (u && u.balance <= 0) break
            const totalBefore = get().getGamingMinutesToday()
            const rate = weekend ? 1 : totalBefore + 1 > 60 ? 2 : 1
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
            const mode = sessionMode === 'youtube' ? 'youtube' : 'game'
            const desc = mode === 'youtube' ? `📺 Сессия (${sessionMinutes} мин)` : `🎮 Игровая сессия (${sessionMinutes} мин)`
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

  addPoints: (userId, amount, reason) => {
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
    set((state) => {
      const nextRaid = Math.min(RAID_TARGET, (state.raidProgress ?? 0) + num)
      if (typeof localStorage !== 'undefined') localStorage.setItem(RAID_STORAGE_KEY, String(nextRaid))
      return {
        users: state.users.map((u) =>
          u.id === userId ? { ...u, balance: u.balance + num } : u
        ),
        transactions: [entry, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS),
        raidProgress: nextRaid,
      }
    })
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

  resetRaidProgress: () => {
    set({ raidProgress: 0 })
    if (typeof localStorage !== 'undefined') localStorage.setItem(RAID_STORAGE_KEY, '0')
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

  removeTransaction: (transactionId) => {
    const state = get()
    const tx = (state.transactions ?? []).find((t) => t.id === transactionId)
    if (!tx) return
    const isTemp = String(transactionId).startsWith('temp-')
    set((s) => ({
      users: s.users.map((u) =>
        u.id === tx.userId ? { ...u, balance: Math.max(0, u.balance - tx.amount) } : u
      ),
      transactions: (s.transactions ?? []).filter((t) => t.id !== transactionId),
    }))
    if (!isTemp) {
      ;(async () => {
        try {
          await supabase.from('transactions').delete().eq('id', transactionId)
          const user = get().users.find((u) => u.id === tx.userId)
          await supabase.from('profiles').update({ balance: Math.max(0, user?.balance ?? 0) }).eq('id', tx.userId)
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
