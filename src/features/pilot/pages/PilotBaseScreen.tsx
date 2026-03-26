import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { PilotHeroUiModel } from '../lib/pilot-base-ui-model'
import { levelFromXp } from '../lib/pilot-base-ui-model'
import { PilotsHeroGrid } from '../components/base/PilotsHeroGrid'
import { WeeklySchedulesCard } from '../components/base/WeeklySchedulesCard'
import { PilotProgressGroups } from '../components/base/PilotProgressGroups'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { getAdminDashboardDailyGroups } from '@/features/admin/lib/admin-dashboard-grouped-ui-model'
import type { AdminDashboardTask } from '@/features/admin/lib/admin-dashboard-ui-model'
import { buildPilotProgressByGroups } from '../lib/pilot-home-ui-model'

const PILOTS: Array<{ pilotId: 'kirill' | 'roma'; name: string; accent: 'purple' | 'cyan' }> = [
  { pilotId: 'kirill', name: 'Кирилл', accent: 'purple' },
  { pilotId: 'roma', name: 'Рома', accent: 'cyan' },
]

function computeHeroBadge({ xpToday, fuelKind }: { xpToday: number; fuelKind: 'premium_fuel' | 'normal' | 'empty_low' | 'overheat' }) {
  if (fuelKind === 'premium_fuel') return { label: 'На бусте', tone: 'boost' as const }
  if (xpToday > 0) return { label: 'В деле', tone: 'active' as const }
  return { label: 'Ждёт миссию', tone: 'neutral' as const }
}

export function PilotBaseScreen() {
  const isLoading = useAppStore((s) => s.isLoading)
  const usersRaw = useAppStore((s) => s.users)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const isTaskCompleteFromTransactions = useAppStore((s) => s.isTaskCompleteFromTransactions)
  const schedule = useScheduleStore((s) => s.schedule)

  const model = useMemo(() => {
    const users = Array.isArray(usersRaw) ? usersRaw : []
    const now = new Date()

    const pilotMeta = PILOTS.map((p) => {
      const u = users.find((x) => x && x.id === p.pilotId)
      return {
        pilotId: p.pilotId,
        name: u?.name ?? p.name,
        accent: (u?.color === 'cyan' ? 'cyan' : 'purple') as 'cyan' | 'purple',
      }
    })

    const groups = getAdminDashboardDailyGroups()

    const isDone = (pilotId: 'kirill' | 'roma', task: AdminDashboardTask) => {
      // Prefer transaction-based completion (multi-device sync ready).
      try {
        if (typeof isTaskCompleteFromTransactions === 'function') {
          const ok = isTaskCompleteFromTransactions(pilotId, task as any)
          if (typeof ok === 'boolean') return ok
        }
      } catch (_) {}
      // Fallback to local dailyBase (offline-friendly).
      return isDailyBaseComplete(pilotId, task.id)
    }

    const progressByPilot = buildPilotProgressByGroups({
      groups,
      pilots: pilotMeta as any,
      isTaskDone: isDone as any,
    })

    const pilots: PilotHeroUiModel[] = PILOTS.map((p) => {
      const u = users.find((x) => x && x.id === p.pilotId)
      const xpTotal = Math.max(0, Number(u?.balance ?? 0))
      const { level } = levelFromXp(xpTotal)

      const breakfastDone = isDone(p.pilotId, { id: 'breakfast', label: 'Завтрак' } as any)
      const lunchDone = isDone(p.pilotId, { id: 'lunch', label: 'Обед' } as any)
      const dinnerDone = isDone(p.pilotId, { id: 'dinner', label: 'Ужин' } as any)
      const snackDone = isDone(p.pilotId, { id: 'snack', label: 'Перекус' } as any)
      const healthyCount = [breakfastDone, lunchDone, dinnerDone].filter(Boolean).length
      const fuelKind = snackDone ? 'overheat' : healthyCount >= 2 ? 'premium_fuel' : healthyCount === 1 ? 'normal' : 'empty_low'

      const pilotProgress = progressByPilot.find((x) => x.pilotId === p.pilotId)
      const xpToday = pilotProgress ? pilotProgress.done : 0

      return {
        pilotId: p.pilotId,
        name: u?.name ?? p.name,
        accent: (u?.color === 'cyan' ? 'cyan' : 'purple') as 'cyan' | 'purple',
        level,
        xpTotal,
        coins: xpTotal,
        badge: computeHeroBadge({ xpToday, fuelKind }),
      }
    })

    const hasPilots = users.some((u) => u && (u.id === 'kirill' || u.id === 'roma'))
    const isMock = isLoading || !hasPilots

    return { pilots, progressByPilot, isMock, pilotMeta }
  }, [isDailyBaseComplete, isLoading, isTaskCompleteFromTransactions, schedule, usersRaw])

  return (
    <div className="px-4 sm:px-6 pt-3 pb-24 md:pb-6">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <WeeklySchedulesCard schedule={schedule} pilots={model.pilotMeta} />
        <PilotsHeroGrid pilots={model.pilots} />
        <PilotProgressGroups pilots={model.progressByPilot} />
        {model.isMock && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-[11px] text-slate-300/90">
            Демо-режим: часть данных ещё не синхронизирована (показываем локальные состояния).
          </div>
        )}
      </div>
    </div>
  )
}

