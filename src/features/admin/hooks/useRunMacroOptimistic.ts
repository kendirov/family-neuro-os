import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { AdminMacro } from '../lib/admin-macros.config'
import { getMacroTasks } from '../lib/admin-macros.config'

type PilotId = 'roma' | 'kirill'
type Feedback = { message: string; tone: 'success' | 'error' } | null

function makeTempId() {
  return `temp-macro-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useRunMacroOptimistic(pilotIds: PilotId[]) {
  const addPointsRemote = useAppStore((s) => s.addPointsRemote)
  const markDailyBaseComplete = useAppStore((s) => s.markDailyBaseComplete)
  const clearDailyComplete = useAppStore((s) => s.clearDailyComplete)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)

  const [busyMacroId, setBusyMacroId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const lockRef = useRef(new Set<string>())

  const clearLater = (ms = 1100) => window.setTimeout(() => setFeedback(null), ms)

  const runMacro = async (macro: AdminMacro) => {
    if (lockRef.current.has(macro.id)) return
    lockRef.current.add(macro.id)
    setBusyMacroId(macro.id)

    const tasks = getMacroTasks(macro)
    let applied = 0
    let failed = 0

    // per-op rollback/commit bookkeeping
    const ops: Array<{
      pilotId: PilotId
      taskId: string
      tempTxId: string | null
      rollback: (() => void) | null
      commit: ((realId: string, createdAt: string) => void) | null
      reward: number
      description: string
      label: string
    }> = []

    try {
      for (const pilotId of pilotIds) {
        for (const task of tasks) {
          if (isDailyBaseComplete(pilotId, task.id)) continue

          const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
          const description = task.reason_template ?? task.label
          const tempTxId = makeTempId()
          const now = Date.now()

          const state = useAppStore.getState()
          const prevUser = state.users.find((u) => u.id === pilotId)

          // Optimistic: mark done + user balance + temp tx row
          markDailyBaseComplete(pilotId, task.id)
          if (prevUser) {
            const prevBalance = prevUser.balance ?? 0
            const nextBalance = prevBalance + reward

            const today = new Date().toISOString().slice(0, 10)
            const lastReset = prevUser.last_daily_reset ?? null
            const isResetToday = lastReset === today
            const prevDaily = isResetToday ? (prevUser.daily_points_earned ?? 0) : 0
            const nextDaily = prevDaily + reward

            useAppStore.setState((s: any) => ({
              users: (s.users ?? []).map((u: any) =>
                u.id === pilotId ? { ...u, balance: nextBalance, daily_points_earned: nextDaily, last_daily_reset: today } : u
              ),
              transactions: [
                { id: tempTxId, userId: pilotId, description, amount: reward, type: 'earn', status: null, at: now },
                ...(s.transactions ?? []),
              ],
            }))

            ops.push({
              pilotId,
              taskId: task.id,
              tempTxId,
              reward,
              description,
              label: task.label,
              rollback: () => {
                clearDailyComplete(pilotId, task.id)
                useAppStore.setState((s: any) => ({
                  users: (s.users ?? []).map((u: any) => (u.id === pilotId ? prevUser : u)),
                  transactions: (s.transactions ?? []).filter((t: any) => t.id !== tempTxId),
                }))
              },
              commit: (realId, createdAt) => {
                const at = new Date(createdAt).getTime()
                useAppStore.setState((s: any) => ({
                  transactions: (s.transactions ?? []).map((t: any) => (t.id === tempTxId ? { ...t, id: realId, at } : t)),
                }))
              },
            })
          } else {
            ops.push({
              pilotId,
              taskId: task.id,
              tempTxId: null,
              reward,
              description,
              label: task.label,
              rollback: () => clearDailyComplete(pilotId, task.id),
              commit: null,
            })
          }

          applied += 1
        }
      }

      // Persist each op; rollback only the ones that fail (partial failures supported)
      for (const op of ops) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const res = await addPointsRemote(op.pilotId, op.reward, op.description, false)
          if (!res?.ok) throw res?.error ?? new Error('addPointsRemote failed')
          op.commit?.(res.tx.id, res.tx.created_at)
        } catch (e) {
          failed += 1
          op.rollback?.()
          if (import.meta.env.DEV) console.error('[Admin] macro op rollback', { macro: macro.id, pilotId: op.pilotId, taskId: op.taskId, e })
        }
      }

      const okCount = Math.max(0, applied - failed)
      if (applied === 0) {
        setFeedback({ message: `${macro.label}: без изменений`, tone: 'success' })
      } else if (failed === 0) {
        setFeedback({ message: `${macro.label}: ${okCount} миссий отмечено`, tone: 'success' })
      } else {
        setFeedback({ message: `${macro.label}: ${okCount} отмечено, ${failed} ошибок`, tone: 'error' })
      }
      clearLater(failed ? 1400 : 1100)
    } finally {
      setBusyMacroId(null)
      lockRef.current.delete(macro.id)
    }
  }

  return useMemo(() => ({ busyMacroId, feedback, runMacro }), [busyMacroId, feedback])
}

