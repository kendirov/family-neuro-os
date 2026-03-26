import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { WeeklySchedule } from '@/types/schedule'
import { PilotWeeklyScheduleCard } from './PilotWeeklyScheduleCard'
import { ScheduleCollapseToggle } from './ScheduleCollapseToggle'

function badgeTone(accent: 'cyan' | 'purple') {
  return accent === 'cyan'
    ? 'border-cyan-500/20 bg-cyan-500/8 text-cyan-100'
    : 'border-purple-500/20 bg-purple-500/8 text-purple-100'
}

export function WeeklySchedulesCard({
  schedule,
  pilots,
}: {
  schedule: WeeklySchedule
  pilots: Array<{ pilotId: 'kirill' | 'roma'; name: string; accent: 'cyan' | 'purple' }>
}) {
  const [collapsed, setCollapsed] = useState(false)
  const now = useMemo(() => new Date(), [])

  return (
    <section
      className={cn(
        'panel-glass rounded-3xl border border-white/10 overflow-hidden',
        'shadow-[0_10px_40px_rgba(0,0,0,0.45)]'
      )}
      aria-label="Расписание"
    >
      <div className="relative p-4 sm:p-5">
        <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Расписание</h2>
            <p className="mt-1 font-mono text-[11px] text-slate-400/90">Неделя · ПН–ПТ</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {collapsed ? (
              <div className="hidden sm:flex items-center gap-2">
                {pilots.map((p) => (
                  <span
                    key={p.pilotId}
                    className={cn('rounded-xl border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]', badgeTone(p.accent))}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ) : null}
            <ScheduleCollapseToggle collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
          </div>
        </div>

        {!collapsed ? (
          <div className="relative mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {pilots.map((p) => (
              <PilotWeeklyScheduleCard
                key={p.pilotId}
                title={p.name}
                accent={p.accent}
                pilotId={p.pilotId}
                schedule={schedule}
                now={now}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

