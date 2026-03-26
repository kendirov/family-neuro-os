import { useMemo } from 'react'
import { PilotStatusMiniCard } from './PilotStatusMiniCard'
import { getAdminDashboardDailyGroups, type PilotId } from '../../lib/admin-dashboard-grouped-ui-model'

type Pilot = {
  id: PilotId
  name: string
  balance: number
}

type PilotStatusStripProps = {
  pilotIds: PilotId[]
  pilots: Pilot[]
  isLoading?: boolean
}

export function PilotStatusStrip({ pilotIds, pilots, isLoading }: PilotStatusStripProps) {
  const groups = useMemo(() => getAdminDashboardDailyGroups(), [])
  const requiredCoreTaskIds = useMemo(() => {
    const set = new Set<string>()
    for (const g of groups) for (const t of g.coreTasks) set.add(t.id)
    return Array.from(set)
  }, [groups])

  return (
    <section
      className="relative panel-glass rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 sm:px-4 sm:py-3.5"
      aria-busy={isLoading}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">Пилоты</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">статус</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {pilotIds.map((id) => {
          const pilot = pilots.find((p) => p.id === id) ?? null
          return (
            <PilotStatusMiniCard
              key={id}
              pilotId={id}
              pilot={pilot}
              requiredCoreTaskIds={requiredCoreTaskIds}
              isLoading={isLoading}
            />
          )
        })}
      </div>
    </section>
  )
}

