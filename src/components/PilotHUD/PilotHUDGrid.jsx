/**
 * Pilot HUD — Bento Box grid. Racing-game интерфейс.
 * Mission Timer (when active) | Status | Timeline
 * Main Focus (center)
 * Rewards
 */
import { useMemo, useState, useEffect } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useActiveSessionId } from '@/hooks/useActiveSessionId'
import { getCurrentFocus, getTodayTimeline } from '@/lib/pilotHudUtils'
import { PilotStatusWidget } from './PilotStatusWidget'
import { PilotMainFocus } from './PilotMainFocus'
import { PilotTodayTimeline } from './PilotTodayTimeline'
import { PilotRewardsWidget } from './PilotRewardsWidget'
import { ActiveMissionHUD } from './ActiveMissionHUD'

export function PilotHUDGrid({
  user,
  onTaskComplete,
  onPurchase,
  disabled,
}) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const accentColor = user?.color === 'purple' ? 'purple' : 'cyan'
  const sessionId = useActiveSessionId(user?.id ?? null)

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const focus = useMemo(
    () => getCurrentFocus(now, user?.id ?? '', (id) => isDailyBaseComplete(user?.id, id)),
    [now, user?.id, isDailyBaseComplete]
  )
  const timeline = useMemo(() => getTodayTimeline(now, user?.id ?? ''), [now, user?.id])

  const handleFocusComplete = (task) => {
    if (!task || !user) return
    onTaskComplete?.({ ...task, isDaily: task.isDaily !== false })
  }

  return (
    <div
      className="grid gap-3 p-4 min-h-[400px]"
      style={{
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: sessionId ? 'auto auto 1fr auto' : 'auto 1fr auto',
        gridTemplateAreas: sessionId
          ? `
            "mission mission"
            "status timeline"
            "focus focus"
            "rewards rewards"
          `
          : `
            "status timeline"
            "focus focus"
            "rewards rewards"
          `,
      }}
    >
      {sessionId && (
        <div style={{ gridArea: 'mission' }}>
          <ActiveMissionHUD sessionId={sessionId} />
        </div>
      )}
      <div style={{ gridArea: 'status' }}>
        <PilotStatusWidget user={user} accentColor={accentColor} />
      </div>
      <div style={{ gridArea: 'timeline' }}>
        <PilotTodayTimeline events={timeline} accentColor={accentColor} />
      </div>
      <div style={{ gridArea: 'focus' }}>
        <PilotMainFocus
          focus={focus}
          onComplete={handleFocusComplete}
          accentColor={accentColor}
          disabled={disabled}
        />
      </div>
      <div style={{ gridArea: 'rewards' }}>
        <PilotRewardsWidget
          balance={user?.balance ?? 0}
          onPurchase={onPurchase}
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
