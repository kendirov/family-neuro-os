/**
 * Today Timeline: компактный список событий дня. Прошлое — приглушено.
 */
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'

export function PilotTodayTimeline({ events, accentColor = 'cyan' }) {
  const todayEvents = events.slice(0, 8)

  if (todayEvents.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
          Сегодня
        </h3>
        <p className="text-slate-500 text-sm">— событий нет</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
        Сегодня
      </h3>
      <ul className="space-y-2">
        {todayEvents.map((e, i) => (
          <li
            key={`${e.time}-${e.label}-${i}`}
            className={cn(
              'flex items-center gap-2 font-mono text-sm',
              e.isPast && !e.isNow && 'opacity-40',
              e.isNow && (accentColor === 'purple' ? 'text-purple-300' : 'text-cyan-300')
            )}
          >
            <span className="tabular-nums text-slate-500 shrink-0 w-10">{e.time}</span>
            <span className="truncate">{e.emoji ? `${e.emoji} ` : ''}{e.label}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}
