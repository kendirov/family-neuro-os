import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type {
  PilotWalletAdjustParams,
  PilotWalletLastAction,
  PilotWalletResource,
  PilotWalletDirection,
  PilotWalletReasonId,
} from '../lib/pilot-wallet-ui-model'
import { clampAmount, describeWalletAction, formatWalletDelta } from '../lib/pilot-wallet-ui-model'

type Feedback = { message: string; tone: 'success' | 'error' } | null

function makeTempId(prefix: string) {
  return `temp-${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function pilotLabel(pilotId: 'kirill' | 'roma') {
  return pilotId === 'kirill' ? 'Кирилл' : 'Рома'
}

function buildDescription(resource: PilotWalletResource, direction: PilotWalletDirection, reasonId: PilotWalletReasonId) {
  // Keep descriptions stable for logs/undo and transaction matching.
  const base = describeWalletAction({ pilotId: 'kirill', resource, direction, amount: 0, reasonId }).replace(/^Начислить: 0 /, '').replace(/^Списать: 0 /, '')
  return `Кошелек · ${base}`
}

export function usePilotWalletAdjust(pilotId: 'kirill' | 'roma') {
  const addPointsRemote = useAppStore((s) => s.addPointsRemote)
  const spendPointsRemote = useAppStore((s) => s.spendPointsRemote)

  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [lastAction, setLastAction] = useState<PilotWalletLastAction | null>(null)
  const lockRef = useRef(false)

  const clearLater = (ms = 900) => {
    window.setTimeout(() => setFeedback(null), ms)
  }

  const applyOptimisticXpLike = (params: PilotWalletAdjustParams) => {
    const amount = clampAmount(params.amount)
    const type = params.direction === 'credit' ? 'earn' : 'spend'
    const description = buildDescription(params.resource, params.direction, params.reasonId)

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
          transactions: (s.transactions ?? []).map((t: any) => (t.id === tempId ? { ...t, id: realId, at } : t)),
        }))
      },
    }
  }

  const applyOptimisticMinutes = (params: PilotWalletAdjustParams) => {
    const amount = clampAmount(params.amount)
    const delta = params.direction === 'credit' ? amount : -amount
    const description = buildDescription('minutes', params.direction, params.reasonId)

    const state = useAppStore.getState()
    const prevTracking = state.todayTimeTracking?.[pilotId] ?? { game: 0, media: 0 }
    const prevTransactions = state.transactions ?? []

    // We adjust "game" bucket for deterministic behavior (UI sums game+media).
    const nextGame = Math.max(0, Number(prevTracking.game ?? 0) + delta)
    const tempId = makeTempId('minutes')
    const now = Date.now()

    useAppStore.setState((s: any) => ({
      todayTimeTracking: {
        ...(s.todayTimeTracking ?? {}),
        [pilotId]: { ...(s.todayTimeTracking?.[pilotId] ?? prevTracking), game: nextGame },
      },
      transactions: [
        {
          id: tempId,
          userId: pilotId,
          description,
          amount: 0,
          type: 'minutes',
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
          todayTimeTracking: {
            ...(s.todayTimeTracking ?? {}),
            [pilotId]: prevTracking,
          },
          transactions: prevTransactions,
        }))
      },
      commit: () => {},
    }
  }

  const adjustPilotBalance = async (raw: PilotWalletAdjustParams) => {
    const amount = clampAmount(raw.amount)
    if (amount <= 0) return
    if (lockRef.current) return
    lockRef.current = true
    setBusy(true)

    const params: PilotWalletAdjustParams = { ...raw, pilotId, amount }
    const isXpLike = params.resource === 'xp' || params.resource === 'coins'
    const optimistic = isXpLike ? applyOptimisticXpLike(params) : applyOptimisticMinutes(params)

    if (!optimistic.ok) {
      setBusy(false)
      lockRef.current = false
      return
    }

    const toast = `${pilotLabel(pilotId)}: ${formatWalletDelta(params)}`
    setFeedback({ message: toast, tone: 'success' })
    clearLater()

    const undo = () => optimistic.rollback()
    setLastAction({
      summary: `${pilotLabel(pilotId)} · ${formatWalletDelta(params)}`,
      undoLabel: 'Отменить',
      undo,
    })

    try {
      if (!isXpLike) {
        // Minutes: currently local-only adjustment (shared store), no backend transaction.
        optimistic.commit()
        return
      }

      const description = buildDescription(params.resource, params.direction, params.reasonId)
      if (params.direction === 'credit') {
        const res = await addPointsRemote(pilotId, amount, description, false)
        if (!res?.ok) throw res?.error ?? new Error('addPointsRemote failed')
        optimistic.commit(res.tx.id, res.tx.created_at)
      } else {
        const res = await spendPointsRemote(pilotId, amount, description)
        if (!res?.ok) throw res?.error ?? new Error('spendPointsRemote failed')
        optimistic.commit(res.tx.id, res.tx.created_at)
      }
    } catch (e) {
      optimistic.rollback()
      if (import.meta.env.DEV) console.error('[Admin] wallet rollback:', e)
      setFeedback({ message: 'Не удалось применить', tone: 'error' })
      clearLater(1200)
      setLastAction(null)
    } finally {
      setBusy(false)
      lockRef.current = false
    }
  }

  return useMemo(
    () => ({
      busy,
      feedback,
      lastAction,
      adjustPilotBalance,
      clearLastAction: () => setLastAction(null),
    }),
    [busy, feedback, lastAction]
  )
}

