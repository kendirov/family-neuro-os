import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { SchoolScheduleCardModel } from '../../lib/pilot-home-ui-model'

function statePillClasses(state: 'past' | 'current' | 'next' | 'future') {
  if (state === 'current') return 'border-cyan-500/35 bg-cyan-500/10 text-cyan-100'
  if (state === 'next') return 'border-white/15 bg-white/5 text-slate-200'
  if (state === 'past') return 'border-white/10 bg-white/[0.02] text-slate-500'
  return 'border-white/10 bg-slate-950/20 text-slate-300'
}

function rowClasses(state: 'past' | 'current' | 'next' | 'future') {
  if (state === 'current') return 'border-cyan-500/25 bg-cyan-500/5'
  if (state === 'next') return 'border-white/15 bg-white/[0.03]'
  if (state === 'past') return 'border-white/10 bg-white/[0.01]'
  return 'border-white/10 bg-slate-950/20'
}

export function SchoolScheduleCard({ model }: { model: SchoolScheduleCardModel }) {
  const reduce = useReducedMotion()
  const hasLessons = model.lessons.length > 0

  return (
    <motion.section
      className={cn(
        'panel-glass rounded-3xl border border-white/10 overflow-hidden',
        'shadow-[0_10px_40px_rgba(0,0,0,0.45)]'
      )}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label="Расписание"
    >
      <div className="relative p-5">
        <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Расписание</h2>
            <p className="mt-1 font-mono text-[11px] text-slate-400/90">{model.dayTitle}</p>
          </div>
          <span className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-slate-200">
            {hasLessons ? `${model.lessons.length} уроков` : 'Сегодня'}
          </span>
        </div>

        {!hasLessons ? (
          <div className="relative mt-4 rounded-3xl border border-dashed border-white/10 bg-slate-950/20 p-5">
            <div className="font-gaming text-lg font-black tracking-wide text-slate-100">{model.emptyStateText}</div>
            <div className="mt-1 font-mono text-xs text-slate-500">Спокойный день. Можно заниматься своими делами.</div>
          </div>
        ) : (
          <div className="relative mt-4 space-y-2">
            {model.lessons.map((l) => (
              <div
                key={`${l.pilotId}-${l.id}`}
                className={cn('rounded-2xl border px-3 py-2', rowClasses(l.state))}
              >
                <div className="flex items-center gap-2">
                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-200 tabular-nums">
                    {l.startTime}–{l.endTime}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                        {l.pilotName}
                      </span>
                      <span className={cn('min-w-0 truncate font-gaming text-sm sm:text-base font-black tracking-wide', l.state === 'past' ? 'text-slate-500' : 'text-slate-100')}>
                        {l.subject}
                      </span>
                    </div>
                  </div>
                  <span className={cn('shrink-0 rounded-xl border px-2 py-1 font-mono text-[10px] uppercase tracking-widest', statePillClasses(l.state))}>
                    {l.state === 'current' ? 'Сейчас' : l.state === 'next' ? 'Дальше' : l.state === 'past' ? 'Было' : 'Потом'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  )
}

