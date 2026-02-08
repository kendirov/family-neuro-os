import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const MAX_TRANSACTIONS = 100

/** Date key for "today" (YYYY-MM-DD). */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

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

  /** Текущая сессия (минуты) — обновляется каждую минуту пока двигатель работает. Для «фитилька» в реальном времени. */
  currentSessionMinutes: 0,
  setCurrentSessionMinutes: (n) => set({ currentSessionMinutes: Math.max(0, n) }),

  /** Минуты за сегодня для отображения: сохранённые + текущая сессия. */
  getDisplayMinutesToday: () => {
    const state = get()
    return state.getGamingMinutesToday() + (state.currentSessionMinutes ?? 0)
  },

  /** Текущая сессия: режим и пилоты (для отображения «сейчас играют» в статистике). */
  currentSessionMode: null,
  currentSessionPilotIds: [],
  setCurrentSessionInfo: (mode, pilotIds) =>
    set({ currentSessionMode: mode ?? null, currentSessionPilotIds: pilotIds ?? [] }),

  /** Разбивка за сегодня: игра + мультики по каждому пилоту, с учётом текущей сессии. */
  getDisplayBreakdownToday: () => {
    const state = get()
    const today = getDateKey()
    const saved = state.dailyGamingBreakdown?.[today] ?? {
      game: { roma: 0, kirill: 0 },
      youtube: { roma: 0, kirill: 0 },
    }
    const curMin = state.currentSessionMinutes ?? 0
    const curMode = state.currentSessionMode
    const curPilots = state.currentSessionPilotIds ?? []
    const game = { ...saved.game }
    const youtube = { ...saved.youtube }
    if (curMin > 0 && curMode && curPilots.length > 0) {
      const key = curMode === 'youtube' ? 'youtube' : 'game'
      curPilots.forEach((id) => {
        if (id === 'roma' || id === 'kirill') {
          const prev = key === 'game' ? game[id] : youtube[id]
          if (key === 'game') game[id] = (prev ?? 0) + curMin
          else youtube[id] = (prev ?? 0) + curMin
        }
      })
    }
    return { game, youtube }
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
