import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'
import type { DailyGroupSectionModel, PilotId } from '../../lib/admin-dashboard-grouped-ui-model'
import { ChildGroupColumn } from './ChildGroupColumn'

type Ops = {
  busyTaskIds: Set<string>
  feedback: { message: string; tone: 'success' | 'error' } | null
  completeTask: (task: AdminDashboardTask) => void
}

type DailyGroupSectionProps = {
  group: DailyGroupSectionModel
  pilotIds: PilotId[]
  opsByPilot: Record<PilotId, Ops>
}

export function DailyGroupSection({ group, pilotIds, opsByPilot }: DailyGroupSectionProps) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)

  const progress = useMemo(() => {
    const all = [...group.coreTasks, ...group.bonusAttachments.map((b) => b.task)]
    const total = all.length * pilotIds.length
    const done = pilotIds.reduce((sum, pid) => {
      const doneHere = all.filter((t) => isDailyBaseComplete(pid, t.id)).length
      return sum + doneHere
    }, 0)
    return { done, total }
  }, [group.bonusAttachments, group.coreTasks, isDailyBaseComplete, pilotIds])

  return (
    <section className="relative panel-glass rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-100">{group.title}</h2>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {group.title} · {progress.done}/{progress.total} закрыто
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {pilotIds.map((pilotId) => (
          <ChildGroupColumn
            key={pilotId}
            pilotId={pilotId}
            group={group}
            ops={opsByPilot[pilotId]}
          />
        ))}
      </div>
    </section>
  )
}

