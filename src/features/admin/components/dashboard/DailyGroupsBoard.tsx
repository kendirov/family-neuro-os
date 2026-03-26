import { useMemo } from 'react'
import { useCompleteTaskOptimistic } from '../../hooks/useCompleteTaskOptimistic'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'
import type { DailyGroupSectionModel, PilotId } from '../../lib/admin-dashboard-grouped-ui-model'
import { getAdminDashboardDailyGroups } from '../../lib/admin-dashboard-grouped-ui-model'
import { DailyGroupSection } from './DailyGroupSection'

type Pilot = {
  id: PilotId
  name: string
  balance: number
}

type DailyGroupsBoardProps = {
  pilotIds: PilotId[]
  pilots: Pilot[]
  isLoading?: boolean
}

export function DailyGroupsBoard({ pilotIds, isLoading }: DailyGroupsBoardProps) {
  const groups = useMemo(() => getAdminDashboardDailyGroups(), [])

  // Hooks must be called unconditionally; dashboard is designed for exactly two pilots.
  const kirillOps = useCompleteTaskOptimistic('kirill')
  const romaOps = useCompleteTaskOptimistic('roma')

  const opsByPilot = useMemo(
    () => ({
      kirill: kirillOps,
      roma: romaOps,
    }),
    [kirillOps, romaOps]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4" aria-busy={isLoading}>
      {groups.map((group: DailyGroupSectionModel) => (
        <DailyGroupSection
          key={group.id}
          group={group}
          pilotIds={pilotIds}
          opsByPilot={
            opsByPilot as any as Record<
              PilotId,
              { busyTaskIds: Set<string>; feedback: any; completeTask: (t: AdminDashboardTask) => void; undoTask: (t: AdminDashboardTask) => void }
            >
          }
        />
      ))}
    </div>
  )
}

