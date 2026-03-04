/**
 * KidsDashboardSide — одна половина Split-Screen (Kirill или Roma).
 * Profile Header → Timer Overlay (если активна) → DailyRoulette → Bento (SmartTimeline | ActiveMissions).
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { CountUpNumber } from '@/components/CountUpNumber'
import { DailyRoulette } from '@/components/DailyRoulette'
import { TimerOverlay } from './TimerOverlay'
import { SmartTimeline } from './SmartTimeline'
import { ActiveMissions } from './ActiveMissions'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 500
const DAILY_MAX = 150

function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function KidsDashboardSide({ childId, accentColor = 'cyan' }) {
  const users = useAppStore((s) => s.users)
  const transactions = useAppStore((s) => s.transactions ?? [])

  const user = useMemo(() => users.find((u) => u.id === childId), [users, childId])
  const balance = user?.balance ?? 0
  const level = Math.floor(balance / XP_PER_LEVEL) + 1

  const todayEarned = useMemo(() => {
    const todayStart = getTodayStartTs()
    const todayEnd = todayStart + 24 * 60 * 60 * 1000
    return transactions
      .filter(
        (t) =>
          t.userId === childId &&
          t.at >= todayStart &&
          t.at < todayEnd &&
          t.type !== 'burn'
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions, childId])

  const progressPct = Math.min(100, Math.max(0, (todayEarned / DAILY_MAX) * 100))
  const isPurple = accentColor === 'purple'
  const strokeColor = isPurple ? '#a855f7' : '#22d3ee'

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-950 overflow-hidden',
        isPurple ? 'bg-gradient-to-b from-slate-950 to-purple-950/20' : 'bg-gradient-to-b from-slate-950 to-cyan-950/20'
      )}
    >
      {/* 1. Profile Header */}
      <div className="shrink-0 p-4 pb-3 flex flex-col items-center backdrop-blur-xl border-b border-white/5">
        <PilotAvatar
          pilotId={childId}
          size="column"
          className="w-16 h-16 sm:w-20 sm:h-20 mb-2"
        />
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest mb-1',
            isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
          )}
        >
          Уровень {level}
        </span>
        <div className="w-full max-w-[140px] mb-1">
          <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded-full min-w-[4px] transition-[width] duration-500"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${strokeColor}80, ${strokeColor})`,
              }}
            />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'font-turbo-nums text-3xl sm:text-4xl font-black tabular-nums',
              isPurple ? 'text-purple-300' : 'text-cyan-300'
            )}
            style={{ textShadow: `0 0 20px ${strokeColor}60` }}
          >
            <CountUpNumber value={balance} duration={400} />
          </span>
          <span className="text-xl text-amber-400/90 font-bold">⚡</span>
        </div>
      </div>

      {/* 2. Timer Overlay — только при активной сессии */}
      <div className="shrink-0 px-4 py-2">
        <TimerOverlay childId={childId} />
      </div>

      {/* 3. Engagement Zone — DailyRoulette в центре */}
      <div className="flex-1 min-h-0 flex flex-col justify-center px-4 py-3">
        <DailyRoulette childId={childId} accentColor={accentColor} />
      </div>

      {/* 4. Bento Box — SmartTimeline | ActiveMissions */}
      <div className="shrink-0 grid grid-cols-2 gap-2 px-4 pb-4">
        <SmartTimeline childId={childId} accentColor={accentColor} />
        <ActiveMissions
          childId={childId}
          accentColor={accentColor}
          transactions={transactions}
        />
      </div>
    </div>
  )
}
