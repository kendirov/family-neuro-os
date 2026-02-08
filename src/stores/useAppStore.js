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
    at: new Date(row.created_at).getTime(),
  }
}

export const useAppStore = create((set, get) => ({
  users: [],
  transactions: [],
  purchases: [],
  isLoading: true,

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

  startEngine: (pilotId, mode = 'game') =>
    set((state) => ({
      pilots: {
        ...state.pilots,
        [pilotId]: {
          status: 'RUNNING',
          sessionMinutes: 0,
          burnerActive: true,
          mode: mode === 'youtube' ? 'youtube' : 'game',
        },
      },
    })),

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
    const sessionMinutes = pilot.sessionMinutes ?? 0
    const mode = pilot.mode ?? 'game'
    const reason = mode === 'youtube' ? 'Ютуб / Мультики' : 'Игровое время'
    const weekend = !isWeekday()
    for (let m = 1; m <= sessionMinutes; m++) {
      const u = get().users.find((x) => x.id === pilotId)
      if (u && u.balance <= 0) break
      const totalBefore = get().getGamingMinutesToday()
      const rate = weekend ? 1 : totalBefore + 1 > 60 ? 2 : 1
      get().spendPoints(pilotId, rate, reason)
      get().addGamingMinutesToday(1, mode, [pilotId])
    }
    set((s) => ({
      pilots: {
        ...s.pilots,
        [pilotId]: initialPilotState(),
      },
    }))
  },

  toggleAll: (action, mode = 'game') => {
    if (action === 'start') {
      set((state) => ({
        pilots: {
          ...state.pilots,
          roma: { status: 'RUNNING', sessionMinutes: 0, burnerActive: true, mode: mode === 'youtube' ? 'youtube' : 'game' },
          kirill: { status: 'RUNNING', sessionMinutes: 0, burnerActive: true, mode: mode === 'youtube' ? 'youtube' : 'game' },
        },
      }))
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

  /** Load users from profiles and transactions from DB. Call once on app init. */
  fetchState: async () => {
    set({ isLoading: true })
    try {
      const [profilesRes, txRes] = await Promise.all([
        supabase.from('profiles').select('*').order('id'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(MAX_TRANSACTIONS),
      ])
      const users = (profilesRes.data ?? []).map(profileToUser)
      const transactions = (txRes.data ?? []).map(dbTxToStore)
      set({ users, transactions, isLoading: false })
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
