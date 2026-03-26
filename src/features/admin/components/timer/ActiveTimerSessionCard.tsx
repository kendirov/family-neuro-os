import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PilotId, TimerSession } from '@/features/timer/lib/timer-types'
import { useTimerConnectionState } from '@/features/timer/lib/timer-selectors-hooks'
import { formatHms, modeLabel, pilotLabel, statusLabel } from '../../lib/admin-timer-ui-model'
import { timerCommands } from '@/features/timer/lib/timer-commands'

type ActiveTimerSessionCardProps = {
  pilotId: PilotId
  session: TimerSession
}

function clamp(n: number) {
  return Math.max(0, Math.floor(n))
}

export function ActiveTimerSessionCard({ pilotId, session }: ActiveTimerSessionCardProps) {
  const { connectionStatus } = useTimerConnectionState()

  const canPause = session.status === 'running'
  const canResume = session.status === 'paused'
  const canStop = session.status === 'running' || session.status === 'paused'

  const remainingSeconds = clamp(session.remainingSeconds ?? 0)
  const remainingLabel = useMemo(() => formatHms(remainingSeconds), [remainingSeconds])

  const stale = connectionStatus === 'stale' || connectionStatus === 'error' || connectionStatus === 'connecting'

  return (
    <section
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.22)]'
      )}
      aria-busy={stale}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold tracking-tight text-slate-100">{pilotLabel(pilotId)}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {modeLabel(session.mode)} • {statusLabel(session.status)}
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl font-semibold tabular-nums text-slate-50">{remainingLabel}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            остаток топлива
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={!canPause || stale}
          onClick={() => timerCommands.pauseTimer({ sessionId: session.sessionId })}
          className={cn(
            'min-h-[44px] rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-100 transition',
            'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            (!canPause || stale) && 'opacity-60 cursor-not-allowed'
          )}
        >
          Пауза
        </button>
        <button
          type="button"
          disabled={!canResume || stale}
          onClick={() => timerCommands.resumeTimer({ sessionId: session.sessionId })}
          className={cn(
            'min-h-[44px] rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-100 transition',
            'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            (!canResume || stale) && 'opacity-60 cursor-not-allowed'
          )}
        >
          Продолжить
        </button>
        <button
          type="button"
          disabled={!canStop || stale}
          onClick={() => timerCommands.emergencyStopTimer({ sessionId: session.sessionId })}
          className={cn(
            'min-h-[44px] rounded-xl border border-white/10 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition',
            'hover:bg-red-500/15 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            (!canStop || stale) && 'opacity-60 cursor-not-allowed'
          )}
        >
          Emergency Stop
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={stale}
          onClick={() => timerCommands.adjustTimerMinutes({ sessionId: session.sessionId, deltaMinutes: 5 })}
          className={cn(
            'min-h-[42px] rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-100 transition',
            'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            stale && 'opacity-60 cursor-not-allowed'
          )}
        >
          +5 минут
        </button>
        <button
          type="button"
          disabled={stale}
          onClick={() => timerCommands.adjustTimerMinutes({ sessionId: session.sessionId, deltaMinutes: -5 })}
          className={cn(
            'min-h-[42px] rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm font-semibold text-slate-300 transition',
            'hover:bg-white/[0.06] hover:border-white/20 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            stale && 'opacity-60 cursor-not-allowed'
          )}
        >
          −5 минут
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span className="truncate">
          {stale ? 'Состояние может быть устаревшим' : 'Сервер: live'}
        </span>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
          {session.updatedAt ? `upd ${String(session.updatedAt).slice(11, 19)}` : 'upd —'}
        </span>
      </div>
    </section>
  )
}

