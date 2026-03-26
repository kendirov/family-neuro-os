import { cn } from '@/lib/utils'
import { useTimerConnectionState } from '@/features/timer/lib/timer-selectors-hooks'
import { connectionCopy } from '../../lib/admin-timer-ui-model'

export function TimerConnectionBanner() {
  const { connectionStatus, lastServerTickAt, lastError } = useTimerConnectionState()
  const copy = connectionCopy(connectionStatus)

  if (connectionStatus === 'live') return null

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 px-4 py-3 backdrop-blur-xl',
        copy.tone === 'ok'
          ? 'bg-emerald-500/10 text-emerald-200'
          : copy.tone === 'warn'
            ? 'bg-amber-500/10 text-amber-200'
            : 'bg-red-500/10 text-red-200'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">
            {connectionStatus === 'stale' ? 'Связь с сервером потеряна' : copy.label}
          </div>
          <div className="mt-1 text-xs text-white/70">
            {lastError ? lastError : 'Показываем последнее известное состояние. Управление может быть недоступно.'}
          </div>
        </div>
        <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
          {lastServerTickAt ? `tick ${lastServerTickAt.slice(11, 19)}` : 'no tick'}
        </div>
      </div>
    </div>
  )
}

