import { cn } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { timerCommands } from '@/features/timer/lib/timer-commands'
import { useTimerConnectionState, useTimerSessionsByPilotId } from '@/features/timer/lib/timer-selectors-hooks'
import { isSessionActive } from '../../lib/admin-timer-ui-model'

export function TimerDevPanel() {
  const { connectionStatus, lastError } = useTimerConnectionState()
  const sessions = useTimerSessionsByPilotId()
  const [enabled] = useState(() => import.meta.env.DEV)

  const active = useMemo(() => Object.values(sessions).filter((s) => isSessionActive(s)), [sessions])

  if (!enabled) return null

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">DEV • TG_TIMER</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {connectionStatus} {lastError ? '• err' : ''}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => timerCommands.dev.connectionLost()}
          className={cn(
            'min-h-[40px] rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 transition',
            'hover:bg-white/[0.06] hover:border-white/20'
          )}
        >
          conn lost
        </button>
        <button
          type="button"
          onClick={() => timerCommands.dev.reconnect()}
          className={cn(
            'min-h-[40px] rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 transition',
            'hover:bg-white/[0.06] hover:border-white/20'
          )}
        >
          reconnect
        </button>
        <button
          type="button"
          onClick={() => timerCommands.startTimer({ pilotId: 'both', durationMinutes: 15, mode: 'game' })}
          className={cn(
            'min-h-[40px] rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 transition',
            'hover:bg-white/[0.06] hover:border-white/20'
          )}
        >
          start both
        </button>
        <button
          type="button"
          onClick={() => active[0]?.sessionId && timerCommands.emergencyStopTimer({ sessionId: active[0].sessionId })}
          className={cn(
            'min-h-[40px] rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-200 transition',
            'hover:bg-white/[0.06] hover:border-white/20'
          )}
          disabled={!active[0]?.sessionId}
        >
          stop first
        </button>
      </div>
    </section>
  )
}

