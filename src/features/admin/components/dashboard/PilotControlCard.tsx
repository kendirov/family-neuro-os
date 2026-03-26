import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { PilotCardHeader } from './PilotCardHeader'
import { PilotQuickXpAdjust } from './PilotQuickXpAdjust'
import { PilotTaskChecklist } from './PilotTaskChecklist'
import { TaskSuccessToast } from './TaskSuccessToast'
import { getTopDashboardTasks, sortPendingFirst, type AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'
import { useAdjustXpOptimistic } from '../../hooks/useAdjustXpOptimistic'
import { useCompleteTaskOptimistic } from '../../hooks/useCompleteTaskOptimistic'

type PilotControlCardProps = {
  pilot: {
    id: 'roma' | 'kirill'
    name: string
    balance: number
  }
}

const XP_DELTA = 5

export function PilotControlCard({ pilot }: PilotControlCardProps) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  const xp = useAdjustXpOptimistic(pilot.id, XP_DELTA)
  const tasksOps = useCompleteTaskOptimistic(pilot.id)

  const screenMinutes = (getTodayGameTime(pilot.id) ?? 0) + (getTodayMediaTime(pilot.id) ?? 0)
  const baseTasks = useMemo(() => getTopDashboardTasks(12), [])
  const tasks = useMemo(
    () => sortPendingFirst(baseTasks, (taskId) => isDailyBaseComplete(pilot.id, taskId)),
    [baseTasks, isDailyBaseComplete, pilot.id]
  )

  return (
    <section
      className={cn(
        'relative panel-glass rounded-2xl border border-white/10 bg-white/[0.04]',
        'p-4 sm:p-5 flex min-h-0 flex-col overflow-hidden',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.22)]'
      )}
    >
      <TaskSuccessToast message={tasksOps.feedback?.message ?? xp.feedback?.message ?? null} tone={tasksOps.feedback?.tone ?? xp.feedback?.tone} />

      <PilotCardHeader
        pilotId={pilot.id}
        name={pilot.name}
        balance={pilot.balance}
        screenMinutes={screenMinutes}
      />

      <div className="mt-3 mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Быстрые действия</span>
        <PilotQuickXpAdjust busy={xp.busy} onPlus={xp.adjustPlus} onMinus={xp.adjustMinus} />
      </div>

      <div className="h-px w-full bg-white/10 mb-3" aria-hidden />

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Ежедневные задачи</span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
          осталось {tasks.filter((t) => !isDailyBaseComplete(pilot.id, t.id)).length}
        </span>
      </div>

      <PilotTaskChecklist
        tasks={tasks}
        isCompleted={(taskId) => isDailyBaseComplete(pilot.id, taskId)}
        busyTaskIds={tasksOps.busyTaskIds}
        onCompleteTask={tasksOps.completeTask as (task: AdminDashboardTask) => void}
      />
    </section>
  )
}
