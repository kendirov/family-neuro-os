import { cn } from '@/lib/utils'
import type { PilotProgressGroupModel } from '../../lib/pilot-home-ui-model'

function dotClasses(completed: boolean) {
  return completed ? 'bg-emerald-400/80 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]' : 'bg-white/10'
}

function rowClasses(completed: boolean) {
  return completed
    ? 'border-white/10 bg-white/[0.02] text-slate-500'
    : 'border-white/10 bg-slate-950/25 text-slate-200'
}

export function PilotProgressGroupCard({ group, accent }: { group: PilotProgressGroupModel; accent: 'cyan' | 'purple' }) {
  const pct = group.totalCount > 0 ? Math.round((group.completedCount / group.totalCount) * 100) : 0
  const accentBar =
    accent === 'cyan'
      ? 'from-cyan-400/70 via-cyan-400/10 to-transparent'
      : 'from-purple-400/70 via-purple-400/10 to-transparent'

  const core = group.tasks.filter((t) => t.kind === 'core')
  const bonus = group.tasks.filter((t) => t.kind === 'bonus')

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/45 backdrop-blur-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-gaming text-sm sm:text-base font-black uppercase tracking-wider text-slate-100 truncate">
              {group.title}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {group.completedCount}/{group.totalCount}
            </div>
          </div>
          <div className="shrink-0 w-20">
            <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <div className={cn('h-full bg-gradient-to-r', accentBar)} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {core.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 px-3 py-3 font-mono text-xs text-slate-500">
            Нет задач в группе.
          </div>
        ) : (
          <div className="space-y-2">
            {core.map((t) => (
              <div key={t.id} className={cn('rounded-2xl border px-3 py-2 flex items-center gap-2', rowClasses(t.completed))}>
                <span className={cn('shrink-0 h-2.5 w-2.5 rounded-full', dotClasses(t.completed))} aria-hidden />
                <span className={cn('shrink-0 text-sm', t.completed && 'opacity-60')} aria-hidden>
                  {t.emoji}
                </span>
                <span className={cn('min-w-0 flex-1 truncate font-mono text-xs', t.completed && 'line-through decoration-white/20')}>
                  {t.label}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {t.completed ? 'Готово' : 'Ждёт'}
                </span>
              </div>
            ))}
          </div>
        )}

        {bonus.length > 0 ? (
          <div className="pt-2 border-t border-white/10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Бонус</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {bonus.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                    t.completed ? 'border-white/10 bg-white/[0.02] text-slate-500' : 'border-white/10 bg-white/[0.04] text-slate-200'
                  )}
                >
                  <span className={cn('text-[12px]', t.completed && 'opacity-60')} aria-hidden>
                    {t.emoji}
                  </span>
                  <span className={cn('font-mono text-[11px] truncate max-w-[26ch]', t.completed && 'line-through decoration-white/20')}>
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

