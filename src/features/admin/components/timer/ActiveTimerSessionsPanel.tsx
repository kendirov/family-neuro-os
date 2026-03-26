import { cn } from '@/lib/utils'
import { useTimerSessionsByPilotId } from '@/features/timer/lib/timer-selectors-hooks'
import { isSessionActive } from '../../lib/admin-timer-ui-model'
import { ActiveTimerSessionCard } from './ActiveTimerSessionCard'

type ActiveTimerSessionsPanelProps = {
  className?: string
}

export function ActiveTimerSessionsPanel({ className }: ActiveTimerSessionsPanelProps) {
  const sessions = useTimerSessionsByPilotId()

  const activeEntries = Object.entries(sessions).filter(([, s]) => isSessionActive(s))

  return (
    <div className={cn(className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">Активные сессии</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          {activeEntries.length ? `${activeEntries.length}` : '0'}
        </span>
      </div>

      {activeEntries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Нет активных сессий. Запустите двигатель через панель управления.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {activeEntries.map(([pilotId, session]) => (
            <ActiveTimerSessionCard key={pilotId} pilotId={pilotId} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}

