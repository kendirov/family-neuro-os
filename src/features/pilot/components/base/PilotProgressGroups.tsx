import { cn } from '@/lib/utils'
import type { PilotProgressPilotSectionModel } from '../../lib/pilot-home-ui-model'
import { PilotProgressGroupCard } from './PilotProgressGroupCard'

function accentHeader(accent: 'cyan' | 'purple') {
  return accent === 'cyan' ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-100' : 'border-purple-500/20 bg-purple-500/5 text-purple-100'
}

export function PilotProgressGroups({ pilots }: { pilots: PilotProgressPilotSectionModel[] }) {
  return (
    <section aria-label="Прогресс дня">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Прогресс дня</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">Спокойная доска: что уже сделано и что ещё впереди.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pilots.map((p) => (
          <div key={p.pilotId} className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-gaming text-sm sm:text-base font-black uppercase tracking-wider text-slate-100 truncate">
                    {p.pilotName}
                  </h3>
                  <span className={cn('rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest', accentHeader(p.accent))}>
                    {p.done}/{p.total}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {p.groups.map((g) => (
                <PilotProgressGroupCard key={g.id} group={g} accent={p.accent} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

