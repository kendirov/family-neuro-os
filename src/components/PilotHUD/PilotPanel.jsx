/**
 * PilotPanel — одна половина Kids' Dashboard.
 * Avatar, Level, Turbo Coins, Daily Progress Bar.
 * Переиспользуемый компонент для Kirill и Roma.
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { CountUpNumber } from '@/components/CountUpNumber'
import { QuestTracker } from './QuestTracker'
import { DailyRoulette } from '@/components/DailyRoulette'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 500
const DAILY_MAX = 150

function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function PilotPanel({ childId, accentColor = 'cyan' }) {
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
      {/* Pilot Profile */}
      <div className="shrink-0 p-6 pb-4 flex flex-col items-center">
        <PilotAvatar
          pilotId={childId}
          size="column"
          className="w-20 h-20 sm:w-24 sm:h-24 mb-3"
        />
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest mb-1',
            isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
          )}
        >
          Уровень {level}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-turbo-nums text-4xl sm:text-5xl md:text-6xl font-black tabular-nums',
              isPurple ? 'text-purple-300' : 'text-cyan-300'
            )}
            style={{ textShadow: `0 0 24px ${strokeColor}60` }}
          >
            <CountUpNumber value={balance} duration={400} />
          </span>
          <span className="text-2xl sm:text-3xl text-amber-400/90 font-bold">⚡</span>
        </div>
      </div>

      {/* Daily Progress Bar */}
      <div className="shrink-0 px-6 pb-6">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            Сегодня
          </span>
          <span
            className={cn(
              'font-mono text-sm tabular-nums font-semibold',
              isPurple ? 'text-purple-300' : 'text-cyan-300'
            )}
          >
            {todayEarned}/{DAILY_MAX}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-800/80 border border-slate-700/60 overflow-hidden">
          <div
            className="h-full rounded-full min-w-[4px] transition-[width] duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #06b6d4 0%, #22c55e 100%)',
              boxShadow: `0 0 12px ${strokeColor}50`,
            }}
          />
        </div>
      </div>

      {/* Daily Roulette: Quantum Decrypter */}
      <div className="shrink-0 px-4 pb-4">
        <DailyRoulette childId={childId} accentColor={accentColor} />
      </div>

      {/* Quest Tracker: Active + Completed */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
        <QuestTracker
          childId={childId}
          accentColor={accentColor}
          transactions={transactions}
        />
      </div>
    </div>
  )
}
