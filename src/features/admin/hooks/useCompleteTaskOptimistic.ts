import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { AdminDashboardTask } from '../lib/admin-dashboard-ui-model'

type PilotId = 'roma' | 'kirill'
type Feedback = { message: string; tone: 'success' | 'error' } | null

function makeTempId() {
  return `temp-task-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useCompleteTaskOptimistic(pilotId: PilotId) {
  const addPointsRemote = useAppStore((s) => s.addPointsRemote)
  const markDailyBaseComplete = useAppStore((s) => s.markDailyBaseComplete)
  const clearDailyComplete = useAppStore((s) => s.clearDailyComplete)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const undoDailyTask = useAppStore((s) => s.undoDailyTask)

  const [busyTaskIds, setBusyTaskIds] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>(null)
  const locksRef = useRef(new Set<string>())

  const clearLater = (ms = 900) => {
    window.setTimeout(() => setFeedback(null), ms)
  }

  const completeTask = async (task: AdminDashboardTask) => {
    if (isDailyBaseComplete(pilotId, task.id)) return
    const lockKey = `${pilotId}:${task.id}`
    if (locksRef.current.has(lockKey)) return
    locksRef.current.add(lockKey)
    setBusyTaskIds((prev) => new Set(prev).add(task.id))

    const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
    const description = task.reason_template ?? task.label
    const state = useAppStore.getState()
    const prevUser = state.users.find((u) => u.id === pilotId)

    // Optimistic: mark task done + update XP + add temp tx row
    const tempId = makeTempId()
    const now = Date.now()
    if (prevUser) {
      const prevBalance = prevUser.balance ?? 0
      const nextBalance = prevBalance + reward

      const today = new Date().toISOString().slice(0, 10)
      const lastReset = prevUser.last_daily_reset ?? null
      const isResetToday = lastReset === today
      const prevDaily = isResetToday ? (prevUser.daily_points_earned ?? 0) : 0
      const nextDaily = prevDaily + reward

      markDailyBaseComplete(pilotId, task.id)
      useAppStore.setState((s: any) => ({
        users: (s.users ?? []).map((u: any) =>
          u.id === pilotId
            ? { ...u, balance: nextBalance, daily_points_earned: nextDaily, last_daily_reset: today }
            : u
        ),
        transactions: [
          { id: tempId, userId: pilotId, description, amount: reward, type: 'earn', status: null, at: now },
          ...(s.transactions ?? []),
        ],
      }))
    } else {
      markDailyBaseComplete(pilotId, task.id)
    }

    setFeedback({ message: `Готово: ${task.label}`, tone: 'success' })
    clearLater()

    try {
      const res = await addPointsRemote(pilotId, reward, description, false)
      if (!res?.ok) throw res?.error ?? new Error('addPointsRemote failed')
      const at = new Date(res.tx.created_at).getTime()
      useAppStore.setState((s: any) => ({
        transactions: (s.transactions ?? []).map((t: any) => (t.id === tempId ? { ...t, id: res.tx.id, at } : t)),
      }))
    } catch (e) {
      // Rollback: undo daily completion + revert user + remove temp tx
      clearDailyComplete(pilotId, task.id)
      if (prevUser) {
        useAppStore.setState((s: any) => ({
          users: (s.users ?? []).map((u: any) => (u.id === pilotId ? prevUser : u)),
          transactions: (s.transactions ?? []).filter((t: any) => t.id !== tempId),
        }))
      }
      if (import.meta.env.DEV) console.error('[Admin] completeTask rollback:', e)
      setFeedback({ message: 'Не удалось сохранить', tone: 'error' })
      clearLater(1200)
    } finally {
      setBusyTaskIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
      locksRef.current.delete(lockKey)
    }
  }

  const undoTask = async (task: AdminDashboardTask) => {
    if (!isDailyBaseComplete(pilotId, task.id)) return
    const lockKey = `${pilotId}:${task.id}:undo`
    if (locksRef.current.has(lockKey)) return
    locksRef.current.add(lockKey)
    setBusyTaskIds((prev) => new Set(prev).add(task.id))

    try {
      const reason = task.reason_template ?? task.label
      // Store already handles: clearDailyComplete + remove matching transaction (DB-first) + balance rollback.
      undoDailyTask(pilotId, task.id, reason)
      setFeedback({ message: `Отменено: ${task.label}`, tone: 'success' })
      clearLater()
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Admin] undoTask failed:', e)
      setFeedback({ message: 'Не удалось отменить', tone: 'error' })
      clearLater(1200)
    } finally {
      setBusyTaskIds((prev) => {
        const next = new Set(prev)
        next.delete(task.id)
        return next
      })
      locksRef.current.delete(lockKey)
    }
  }

  return useMemo(() => ({ busyTaskIds, feedback, completeTask, undoTask }), [busyTaskIds, feedback])
}

