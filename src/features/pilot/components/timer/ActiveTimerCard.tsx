import { motion, useReducedMotion } from 'motion/react'
import { useActiveSessionId } from '@/hooks/useActiveSessionId'
import { usePenaltyTimer } from '@/hooks/usePenaltyTimer'
import type { PilotAccent, PilotId, TimerSummary } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function computeTimerSummary({
  sessionId,
  status,
  totalElapsedSeconds,
  safeTimeRemainingSeconds,
  multiplier,
  coinsBurned,
  isBurning,
}: {
  sessionId: string | null
  status: TimerSummary['status']
  totalElapsedSeconds: number
  safeTimeRemainingSeconds: number
  multiplier: 1 | 2 | 3
  coinsBurned: number
  isBurning: boolean
}): TimerSummary {
  return {
    sessionId,
    status,
    totalElapsedSeconds,
    safeTimeRemainingSeconds,
    multiplier,
    coinsBurned,
    isBurning,
  }
}

export function ActiveTimerCard({ pilotId, accent }: { pilotId: PilotId; accent: PilotAccent }) {
  const shouldReduceMotion = useReducedMotion()
  const theme = ACCENT_THEMES[accent]
  const sessionId = useActiveSessionId(pilotId)
  const { totalSecondsElapsed, safeTimeRemaining, currentMultiplier, coinsBurned, isBurning, isLoading } = usePenaltyTimer(sessionId)

  const summary = computeTimerSummary({
    sessionId,
    status: !sessionId ? 'idle' : 'active',
    totalElapsedSeconds: totalSecondsElapsed,
    safeTimeRemainingSeconds: safeTimeRemaining,
    multiplier: currentMultiplier,
    coinsBurned,
    isBurning,
  })

  return (
    <section
      className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4"
      aria-label={tgText('kid', 'timer.card.aria')}
    >
      {!sessionId || isLoading ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300/90">{tgText('kid', 'timer.title')}</h3>
          <p className="font-mono text-xs text-slate-500">{tgText('kid', 'timer.waiting')}</p>
        </div>
      ) : (
        <motion.div
          className={[
            'rounded-2xl border-2 p-4',
            isBurning ? 'bg-red-950/40 border-red-500/50' : 'bg-cyan-900/20 border-cyan-500/30',
          ].join(' ')}
          initial={{ opacity: 0, y: 8 }}
          animate={
            isBurning && !shouldReduceMotion
              ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }
              : { opacity: 1, y: 0 }
          }
          transition={
            isBurning && !shouldReduceMotion ? { duration: 0.7, ease: 'easeInOut' } : { duration: 0.3 }
          }
          aria-label={isBurning ? tgText('kid', 'timer.state.active') : tgText('kid', 'timer.state.safe')}
        >
          {summary.isBurning ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400/90">
                  {tgText('kid', 'timer.burning')}
                </span>
                <span className="rounded-lg border border-red-500/40 bg-red-500/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-red-200">
                  x{summary.multiplier}
                </span>
              </div>
              <div className="font-mono text-4xl font-black tabular-nums text-red-200 drop-shadow-[0_0_18px_rgba(248,113,113,0.45)]">
                −{summary.coinsBurned.toFixed(1)}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-300/70">
                <span>{tgText('kid', 'timer.elapsed', { time: formatCountdown(summary.totalElapsedSeconds) })}</span>
                <span>{tgText('kid', 'timer.heat')}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/90">
                  {tgText('kid', 'timer.safeRemaining')}
                </span>
                <span className={['rounded-lg border px-2 py-1 font-mono text-[10px] uppercase tracking-widest', theme.hudChip].join(' ')}>
                  x{summary.multiplier}
                </span>
              </div>
              <div className="font-mono text-4xl font-black tabular-nums text-cyan-200 drop-shadow-[0_0_22px_rgba(34,211,238,0.50)]">
                {formatCountdown(summary.safeTimeRemainingSeconds)}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-300/70">
                <span>{tgText('kid', 'timer.elapsed', { time: formatCountdown(summary.totalElapsedSeconds) })}</span>
                <span>{tgText('kid', 'timer.stable')}</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </section>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

