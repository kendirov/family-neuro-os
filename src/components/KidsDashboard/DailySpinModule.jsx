/**
 * DailySpinModule — интерактивный модуль спина. Строго из store (Realtime).
 * Math: floor(daily_points_earned/50) - spins_used_today = доступные спины.
 */
import { useMemo, useCallback } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { pickRandomPrize } from '@/data/DailyRoulettePrizes'
import { cn } from '@/lib/utils'

const POINTS_PER_SPIN = 50

export function DailySpinModule({ childId, accentColor = 'cyan' }) {
  const user = useAppStore((s) => s.users.find((u) => u.id === childId))
  const useSpin = useAppStore((s) => s.useSpin)

  const { todayPoints, spinsUsedToday, totalEarnedSpins, pointsInBucket, usableSpins } = useMemo(() => {
    const points = user?.daily_points_earned ?? 0
    const used = user?.spins_used_today ?? 0
    const total = Math.floor(points / POINTS_PER_SPIN)
    const inBucket = points % POINTS_PER_SPIN
    const usable = Math.max(0, total - used)
    return {
      todayPoints: points,
      spinsUsedToday: used,
      totalEarnedSpins: total,
      pointsInBucket: inBucket,
      usableSpins: usable,
    }
  }, [user?.daily_points_earned, user?.spins_used_today])

  const progressPercent = (pointsInBucket / POINTS_PER_SPIN) * 100
  const isLocked = usableSpins <= 0
  const isPurple = accentColor === 'purple'

  const handleClick = useCallback(async () => {
    if (isLocked || usableSpins < 1) return
    const prize = pickRandomPrize()
    await useSpin(childId, prize)
  }, [childId, isLocked, usableSpins, useSpin])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-white/10 p-4',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'
      )}
      aria-label="Ежедневный спин"
    >
      <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        Ежедневный спин
      </h3>

      {/* Progress Bar — "Собрано: X/50 ⚡" */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-slate-400">
            Собрано: <span className="tabular-nums font-semibold text-white">{pointsInBucket}/{POINTS_PER_SPIN}</span> ⚡
          </span>
          {usableSpins > 0 && (
            <span
              className={cn(
                'font-mono text-[10px] font-bold tabular-nums uppercase',
                isPurple ? 'text-fuchsia-400' : 'text-cyan-400'
              )}
            >
              Спинов: {usableSpins}
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-slate-800/80 border border-white/5 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 min-w-[4px]',
              isPurple
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-500'
                : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* The Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLocked}
        className={cn(
          'w-full min-h-[56px] sm:min-h-[64px] rounded-2xl font-gaming text-sm sm:text-base font-black uppercase tracking-wider transition-all duration-300 touch-manipulation',
          isLocked
            ? 'bg-slate-800/60 text-slate-500 grayscale cursor-not-allowed border border-slate-600/50'
            : cn(
                'border-2 animate-pulse',
                'bg-gradient-to-r from-fuchsia-600 via-fuchsia-500 to-cyan-500',
                'text-white',
                'drop-shadow-[0_0_20px_rgba(217,70,239,0.6)]',
                'shadow-[0_4px_24px_rgba(217,70,239,0.4),0_0_0_1px_rgba(34,211,238,0.3)]',
                'border-fuchsia-500/50 hover:border-cyan-400/60',
                'hover:scale-[1.02] active:scale-[0.98] hover:brightness-110'
              )
        )}
        aria-label={isLocked ? 'Спин заблокирован' : `Крутить спин (доступно: ${usableSpins})`}
      >
        {isLocked ? (
          'СПИН ЗАБЛОКИРОВАН'
        ) : (
          <>КРУТИТЬ СПИН! (Доступно: {usableSpins})</>
        )}
      </button>
    </div>
  )
}
