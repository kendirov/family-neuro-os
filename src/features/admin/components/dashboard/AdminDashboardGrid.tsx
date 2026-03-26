import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PilotStatusStrip } from './PilotStatusStrip'
import { DailyGroupsBoard } from './DailyGroupsBoard'

export function AdminDashboardGrid() {
  const users = useAppStore((s) => s.users)
  const isLoading = useAppStore((s) => s.isLoading)

  const pilots = useMemo(() => {
    const kirill = users.find((u) => u.id === 'kirill')
    const roma = users.find((u) => u.id === 'roma')
    return [kirill, roma].filter(Boolean) as Array<{
      id: 'roma' | 'kirill'
      name: string
      balance: number
    }>
  }, [users])

  // Keep layout stable: dashboard is designed for 2 pilots, always render in fixed order.
  const pilotIds: Array<'kirill' | 'roma'> = ['kirill', 'roma']

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
      <PilotStatusStrip pilotIds={pilotIds} pilots={pilots} isLoading={isLoading} />
      <DailyGroupsBoard pilotIds={pilotIds} pilots={pilots} isLoading={isLoading} />
    </div>
  )
}
