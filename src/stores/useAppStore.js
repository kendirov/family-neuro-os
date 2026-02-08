import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_USERS = [
  { id: 'roma', name: 'Рома', balance: 0, color: 'cyan' },
  { id: 'kirill', name: 'Кирилл', balance: 0, color: 'purple' },
]

const MAX_TRANSACTIONS = 100

function makeTransactionId() {
  return 'tx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

/** Entry: { at, userId, description, amount, type: 'earn'|'spend' }. We add id. */
function appendTransaction(state, entry) {
  const withId = { ...entry, id: entry.id ?? makeTransactionId() }
  const next = [withId, ...(state.transactions ?? [])].slice(0, MAX_TRANSACTIONS)
  return { ...state, transactions: next }
}

/** Date key for "today" (YYYY-MM-DD). Used to reset daily base at midnight. */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Gaming minutes played today (for HUD "ВСЕГО СЕГОДНЯ"). Resets when date changes. */
function getGamingToday(state) {
  const today = getDateKey()
  if (state.gamingToday?.dateKey !== today) return 0
  return state.gamingToday?.minutes ?? 0
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      users: INITIAL_USERS,
      purchases: [],
      transactions: [],

      /** Daily base completion: { [userId]: { [actionId]: dateKey } }. Resets when date changes. */
      dailyBase: {},

      /** True if this user completed this daily action today. */
      isDailyBaseComplete: (userId, actionId) => {
        const today = getDateKey()
        const userDaily = get().dailyBase[userId]
        return userDaily != null && userDaily[actionId] === today
      },

      /** Mark daily base action complete for today. Call after adding points. */
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

      /** Manual reset: clear all daily base completions (or pass userId to clear one). */
      resetDailyBase: (userId) =>
        set((state) => {
          if (userId) {
            const next = { ...state.dailyBase, [userId]: {} }
            return { dailyBase: next }
          }
          return { dailyBase: {} }
        }),

      /** Parent panel lock: when true, Add Points buttons are disabled (read-only for kids). */
      panelLocked: true,
      setPanelLocked: (value) => set({ panelLocked: value }),

      /** Gaming time today: { dateKey, minutes }. Used by Dashboard HUD "ВСЕГО СЕГОДНЯ". */
      gamingToday: { dateKey: '', minutes: 0 },
      addGamingMinutesToday: (minutes) =>
        set((state) => {
          const today = getDateKey()
          const prev = state.gamingToday?.dateKey === today ? state.gamingToday.minutes : 0
          return { gamingToday: { dateKey: today, minutes: prev + minutes } }
        }),
      getGamingMinutesToday: () => getGamingToday(get()),

      addPoints: (userId, amount, reason) =>
        set((state) =>
          appendTransaction(
            {
              ...state,
              users: state.users.map((u) =>
                u.id === userId ? { ...u, balance: u.balance + amount } : u
              ),
            },
            { at: Date.now(), userId, description: reason ?? 'Начислено', amount: +amount, type: 'earn' }
          )
        ),

      spendPoints: (userId, amount, reason) =>
        set((state) =>
          appendTransaction(
            {
              ...state,
              users: state.users.map((u) =>
                u.id === userId ? { ...u, balance: Math.max(0, u.balance - amount) } : u
              ),
            },
            { at: Date.now(), userId, description: reason ?? 'Списано', amount: -amount, type: 'spend' }
          )
        ),

      /** Remove a transaction and reverse the balance change. Earn (+50) → subtract 50; Spend (-100) → add 100. */
      removeTransaction: (transactionId) =>
        set((state) => {
          const tx = (state.transactions ?? []).find((t) => t.id === transactionId)
          if (!tx) return state
          const users = state.users.map((u) =>
            u.id === tx.userId
              ? { ...u, balance: Math.max(0, u.balance - tx.amount) }
              : u
          )
          const transactions = (state.transactions ?? []).filter((t) => t.id !== transactionId)
          return { ...state, users, transactions }
        }),

      /** Deduct cost, record purchase. Returns true if successful. */
      purchaseItem: (userId, item) => {
        const state = get()
        const user = state.users.find((u) => u.id === userId)
        if (!user || user.balance < item.cost) return false
        const at = Date.now()
        set((s) =>
          appendTransaction(
            {
              ...s,
              users: s.users.map((u) =>
                u.id === userId ? { ...u, balance: u.balance - item.cost } : u
              ),
              purchases: [
                ...s.purchases,
                { userId, itemId: item.id, itemName: item.name, cost: item.cost, at },
              ],
            },
            { at, userId, description: item.name, amount: -item.cost, type: 'spend' }
          )
        )
        return true
      },

      resetDaily: () =>
        set((state) => ({
          users: INITIAL_USERS.map((u) => ({ ...u, balance: 0 })),
          purchases: state.purchases,
          transactions: state.transactions ?? [],
        })),
    }),
    { name: 'neuro-os-storage', version: 7 }
  )
)
