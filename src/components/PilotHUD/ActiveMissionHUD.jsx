/**
 * ActiveMissionHUD — массивный визуальный таймер для Kids UI.
 * Gamified Risk Management: Safe Zone (cyan) → Penalty Zone (pulsing red).
 * Использует usePenaltyTimer для live-данных.
 */
import { usePenaltyTimer } from '@/hooks/usePenaltyTimer'
import { cn } from '@/lib/utils'

/** Форматирует секунды в MM:SS или HH:MM:SS. */
function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ActiveMissionHUD({ sessionId }) {
  const {
    totalSecondsElapsed,
    safeTimeRemaining,
    currentMultiplier,
    coinsBurned,
    isBurning,
    isLoading,
    error,
  } = usePenaltyTimer(sessionId)

  if (!sessionId || isLoading || error) return null

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-6 sm:p-8 backdrop-blur-xl transition-all duration-300',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.35)]',
        isBurning
          ? 'bg-red-950/40 border-red-500/50 animate-pulse'
          : 'bg-cyan-900/20 border-cyan-500/30'
      )}
    >
      {isBurning ? (
        /* Phase 2: Penalty / Margin Call */
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-red-400/90">
              🚨 COINS BURNING
            </span>
            <span className="font-mono text-3xl sm:text-4xl md:text-5xl font-black tabular-nums text-red-300 drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]">
              −{coinsBurned.toFixed(1)} ⚡
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-amber-400/90">
              ⚠️ MULTIPLIER:
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
              x{currentMultiplier}
            </span>
          </div>
        </div>
      ) : (
        /* Phase 1: Safe Zone */
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-cyan-400/90">
            Safe Time Remaining
          </span>
          <span className="font-mono text-4xl sm:text-5xl md:text-6xl font-black tabular-nums text-cyan-200 drop-shadow-[0_0_24px_rgba(34,211,238,0.5)]">
            {formatCountdown(safeTimeRemaining)}
          </span>
        </div>
      )}
    </div>
  )
}
