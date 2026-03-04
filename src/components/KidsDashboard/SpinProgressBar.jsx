/**
 * SpinProgressBar — прогресс до следующего спина (50 очков = 1 спин).
 * "До рулетки: X ⚡"
 */
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const POINTS_PER_SPIN = 50

export function SpinProgressBar({ childId, accentColor = 'cyan' }) {
  const getPointsToNextSpin = useAppStore((s) => s.getPointsToNextSpin)
  const getAvailableSpins = useAppStore((s) => s.getAvailableSpins)
  const user = useAppStore((s) => s.users.find((u) => u.id === childId))

  const pointsToNext = getPointsToNextSpin(childId)
  const availableSpins = getAvailableSpins(childId)
  const dailyPoints = user?.daily_points_earned ?? 0
  const progressInCurrentBlock = dailyPoints % POINTS_PER_SPIN
  const fillPercent = (progressInCurrentBlock / POINTS_PER_SPIN) * 100

  const isPurple = accentColor === 'purple'
  const strokeColor = isPurple ? '#a855f7' : '#22d3ee'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
          До рулетки: {pointsToNext} ⚡
        </span>
        {availableSpins > 0 && (
          <span
            className={cn(
              'font-mono text-[10px] font-bold tabular-nums',
              isPurple ? 'text-purple-400' : 'text-cyan-400'
            )}
          >
            Спинов: {availableSpins}
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 min-w-[4px]"
          style={{
            width: `${fillPercent}%`,
            background: `linear-gradient(90deg, ${strokeColor}80, ${strokeColor})`,
          }}
        />
      </div>
    </div>
  )
}
