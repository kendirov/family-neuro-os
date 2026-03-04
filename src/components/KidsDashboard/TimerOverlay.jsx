/**
 * TimerOverlay — массивный пульсирующий Glassmorphism таймер.
 * Red если burning, Cyan если safe zone.
 */
import { useActiveSessionId } from '@/hooks/useActiveSessionId'
import { usePenaltyTimer } from '@/hooks/usePenaltyTimer'
import { cn } from '@/lib/utils'

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerOverlay({ childId }) {
  const sessionId = useActiveSessionId(childId)
  const {
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
        'rounded-2xl border p-4 sm:p-5 backdrop-blur-xl transition-all duration-300',
        'border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.35)]',
        isBurning
          ? 'bg-red-950/50 border-red-500/50 animate-pulse'
          : 'bg-cyan-900/20 border-cyan-500/30'
      )}
    >
      {isBurning ? (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-red-400/90">
            🚨 COINS BURNING
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black tabular-nums text-red-300">
            −{coinsBurned.toFixed(1)} ⚡
          </span>
          <span className="font-mono text-xs text-amber-400/90">
            x{currentMultiplier}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/90">
            Safe
          </span>
          <span className="font-mono text-3xl sm:text-4xl font-black tabular-nums text-cyan-200">
            {formatCountdown(safeTimeRemaining)}
          </span>
        </div>
      )}
    </div>
  )
}
