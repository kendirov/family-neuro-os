import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'

type PilotId = 'roma' | 'kirill'

type Feedback = { message: string; tone: 'success' | 'error' } | null

function makeTempId(prefix: string) {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useAdjustXpOptimistic(pilotId: PilotId, delta = 5) {
  const addPointsRemote = useAppStore((s) => s.addPointsRemote)
  const spendPointsRemote = useAppStore((s) => s.spendPointsRemote)

  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const lockRef = useRef(false)

  const clearLater = (ms = 900) => {
    window.setTimeout(() => setFeedback(null), ms)
  }

  const applyOptimistic = (amount: number, description: string, type: 'earn' | 'spend') => {
    const state = useAppStore.getState()
    const prevUser = state.users.find((u) => u.id === pilotId)
    if (!prevUser) return { ok: false as const }

    const tempId = makeTempId(type)
    const now = Date.now()
    const signedAmount = type === 'earn' ? amount : -amount
    const prevBalance = prevUser.balance ?? 0
    const nextBalance = Math.max(0, prevBalance + signedAmount)

    const today = new Date().toISOString().slice(0, 10)
    const lastReset = prevUser.last_daily_reset ?? null
    const isResetToday = lastReset === today
    const prevDaily = isResetToday ? (prevUser.daily_points_earned ?? 0) : 0
    const nextDaily = type === 'earn' ? prevDaily + amount : prevDaily

    useAppStore.setState((s: any) => ({
      users: (s.users ?? []).map((u: any) =>
        u.id === pilotId
          ? {
              ...u,
              balance: nextBalance,
              ...(type === 'earn' ? { daily_points_earned: nextDaily, last_daily_reset: today } : {}),
            }
          : u
      ),
      transactions: [
        {
          id: tempId,
          userId: pilotId,
          description,
          amount: signedAmount,
          type,
          status: null,
          at: now,
        },
        ...(s.transactions ?? []),
      ],
    }))

    return {
      ok: true as const,
      tempId,
      rollback: () => {
        useAppStore.setState((s: any) => ({
          users: (s.users ?? []).map((u: any) => (u.id === pilotId ? prevUser : u)),
          transactions: (s.transactions ?? []).filter((t: any) => t.id !== tempId),
        }))
      },
      commit: (realId: string, createdAt: string) => {
        const at = new Date(createdAt).getTime()
        useAppStore.setState((s: any) => ({
          transactions: (s.transactions ?? []).map((t: any) =>
            t.id === tempId ? { ...t, id: realId, at } : t
          ),
        }))
      },
    }
  }

  const adjustPlus = async () => {
    if (lockRef.current) return
    lockRef.current = true
    setBusy(true)
    const description = 'Быстрое начисление'
    const optimistic = applyOptimistic(delta, description, 'earn')
    if (!optimistic.ok) {
      setBusy(false)
      lockRef.current = false
      return
    }
    setFeedback({ message: `+${delta} XP`, tone: 'success' })
    clearLater()
    try {
      const res = await addPointsRemote(pilotId, delta, description, false)
      if (!res?.ok) throw res?.error ?? new Error('addPointsRemote failed')
      optimistic.commit(res.tx.id, res.tx.created_at)
    } catch (e) {
      optimistic.rollback()
      if (import.meta.env.DEV) console.error('[Admin] +XP rollback:', e)
      setFeedback({ message: 'Не удалось начислить', tone: 'error' })
      clearLater(1200)
    } finally {
      setBusy(false)
      lockRef.current = false
    }
  }

  const adjustMinus = async () => {
    if (lockRef.current) return
    lockRef.current = true
    setBusy(true)
    const description = 'Быстрое списание'
    const optimistic = applyOptimistic(delta, description, 'spend')
    if (!optimistic.ok) {
      setBusy(false)
      lockRef.current = false
      return
    }
    setFeedback({ message: `−${delta} XP`, tone: 'success' })
    clearLater()
    try {
      const res = await spendPointsRemote(pilotId, delta, description)
      if (!res?.ok) throw res?.error ?? new Error('spendPointsRemote failed')
      optimistic.commit(res.tx.id, res.tx.created_at)
    } catch (e) {
      optimistic.rollback()
      if (import.meta.env.DEV) console.error('[Admin] -XP rollback:', e)
      setFeedback({ message: 'Не удалось списать', tone: 'error' })
      clearLater(1200)
    } finally {
      setBusy(false)
      lockRef.current = false
    }
  }

  return useMemo(
    () => ({ busy, feedback, adjustPlus, adjustMinus }),
    [busy, feedback]
  )
}

