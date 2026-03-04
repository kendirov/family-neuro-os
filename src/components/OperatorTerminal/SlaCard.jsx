/**
 * SlaCard — одна карточка SLA: toggle + countdown.
 * Failed: красный, locked. Completed: зелёный glow.
 */
import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/GlassCard'
import {
  getSecondsRemaining,
  formatCountdown,
  getSlaStatus,
} from '@/lib/operatorSlaUtils'
import { cn } from '@/lib/utils'

export function SlaCard({ sla, completed, onToggle }) {
  const [now, setNow] = useState(() => new Date())
  const sec = getSecondsRemaining(sla.deadlineTime, now)
  const status = getSlaStatus(sla, completed, now)
  const locked = status === 'failed'

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleToggle = () => {
    if (locked) return
    onToggle?.(sla.id, !completed)
  }

  return (
    <GlassCard
      className={cn(
        'p-4 flex items-center justify-between gap-4 transition-colors',
        status === 'failed' && 'bg-red-900/20 border-red-500/30',
        status === 'completed' && 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-medium text-slate-200 truncate">
          {sla.label}
        </p>
        <p className="font-mono text-[10px] text-slate-500 mt-0.5">
          Дедлайн {sla.deadlineTime}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            'font-mono text-sm tabular-nums w-14 text-right',
            status === 'pending' && 'text-amber-400/90',
            status === 'failed' && 'text-red-400',
            status === 'completed' && 'text-emerald-400/90'
          )}
        >
          {status === 'completed' ? 'OK' : formatCountdown(sec)}
        </span>

        <button
          type="button"
          onClick={handleToggle}
          disabled={locked}
          role="switch"
          aria-checked={completed}
          aria-label={completed ? `${sla.label} — выполнено` : `${sla.label} — отметить`}
          className={cn(
            'relative w-11 h-6 rounded-full border transition shrink-0',
            locked && 'cursor-not-allowed opacity-60',
            completed
              ? 'bg-emerald-500/60 border-emerald-400/50'
              : 'bg-slate-700/80 border-slate-600',
            !locked && !completed && 'hover:border-slate-500'
          )}
        >
          <span
            className={cn(
              'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
              completed ? 'left-6' : 'left-1'
            )}
          />
        </button>
      </div>

      {status === 'failed' && (
        <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider shrink-0">
          SLA Failed
        </span>
      )}
    </GlassCard>
  )
}
