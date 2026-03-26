import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { TaskSuccessToast } from './TaskSuccessToast'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'
import type { DailyGroupSectionModel, PilotId } from '../../lib/admin-dashboard-grouped-ui-model'
import { CoreTaskRow } from './CoreTaskRow'
import { BonusTaskChips } from './BonusTaskChips'

type Ops = {
  busyTaskIds: Set<string>
  feedback: { message: string; tone: 'success' | 'error' } | null
  completeTask: (task: AdminDashboardTask) => void
  undoTask: (task: AdminDashboardTask) => void
}

type ChildGroupColumnProps = {
  pilotId: PilotId
  group: DailyGroupSectionModel
  ops: Ops
}

export function ChildGroupColumn({ pilotId, group, ops }: ChildGroupColumnProps) {
  const users = useAppStore((s) => s.users)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)

  const pilot = users.find((u: any) => u.id === pilotId) as any
  const name = pilot?.name ?? (pilotId === 'kirill' ? 'Кирилл' : 'Рома')

  const coreRemaining = useMemo(
    () => group.coreTasks.filter((t) => !isDailyBaseComplete(pilotId, t.id)).length,
    [group.coreTasks, isDailyBaseComplete, pilotId]
  )

  return (
    <div className="relative min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/25 p-3">
      <TaskSuccessToast message={ops.feedback?.message ?? null} tone={ops.feedback?.tone} />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-slate-100">{name}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            core осталось {coreRemaining}
          </div>
        </div>
        <div
          className={cn(
            'rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5',
            'font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400'
          )}
        >
          {group.coreTasks.length + group.bonusAttachments.length} задач
        </div>
      </div>

      <div className="space-y-1.5">
        {group.coreTasks.map((task) => (
          (() => {
            const attached = group.bonusAttachments
              .filter((b) => b.attachTo.kind === 'coreTask' && b.attachTo.coreTaskId === task.id)
              .map((b) => b.task)
            return (
          <CoreTaskRow
            key={task.id}
            task={task}
            completed={isDailyBaseComplete(pilotId, task.id)}
            disabled={ops.busyTaskIds.has(task.id)}
            onClick={() => ops.completeTask(task)}
            onUndo={() => ops.undoTask(task)}
            rightChips={
              attached.length ? (
                <BonusTaskChips
                  tasks={attached}
                  isCompleted={(taskId) => isDailyBaseComplete(pilotId, taskId)}
                  busyTaskIds={ops.busyTaskIds}
                  onClick={ops.completeTask}
                  onUndo={ops.undoTask}
                  density="inline"
                />
              ) : null
            }
          />
            )
          })()
        ))}
      </div>

      {group.bonusAttachments.some((b) => b.attachTo.kind === 'group') ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Бонусы</span>
          </div>
          <BonusTaskChips
            tasks={group.bonusAttachments.filter((b) => b.attachTo.kind === 'group').map((b) => b.task)}
            isCompleted={(taskId) => isDailyBaseComplete(pilotId, taskId)}
            busyTaskIds={ops.busyTaskIds}
            onClick={ops.completeTask}
            onUndo={ops.undoTask}
            density="block"
          />
        </div>
      ) : null}
    </div>
  )
}

