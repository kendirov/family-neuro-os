import { motion, useReducedMotion } from 'motion/react'
import type { PilotBaseScheduleUiModel } from '../../lib/pilot-base-ui-model'

function toneClasses(tone: 'info' | 'success' | 'warning') {
  if (tone === 'success') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  if (tone === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
}

export function NowScheduleCard({ model }: { model: PilotBaseScheduleUiModel }) {
  const reduce = useReducedMotion()

  return (
    <section
      className={[
        'panel-glass rounded-3xl border border-white/10 overflow-hidden',
        'shadow-[0_10px_40px_rgba(0,0,0,0.45)]',
      ].join(' ')}
      aria-label="Расписание"
    >
      <div className="relative p-5">
        <div className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Расписание</h2>
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-200">
                {model.timeBlockLabel}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-400/90">
              Что сейчас делать — и что дальше.
            </p>
          </div>
          <span className={['shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest', toneClasses(model.badge.tone)].join(' ')}>
            {model.badge.label}
          </span>
        </div>

        <div className="relative mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            className="rounded-3xl border border-white/10 bg-slate-950/30 p-4"
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.25 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{model.nowTitle}</span>
              <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan-200">
                На линии
              </span>
            </div>
            <div className="mt-2 font-gaming text-lg sm:text-xl font-black tracking-wide text-white text-pop">
              {model.nowAction}
            </div>
            <div className="mt-2 font-mono text-[11px] text-slate-400/90">
              Выполни это — и получишь импульс к XP.
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl border border-white/10 bg-slate-950/20 p-4"
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.25, delay: reduce ? 0 : 0.05 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">{model.nextTitle}</span>
              <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-200">
                Следующая миссия
              </span>
            </div>
            <div className="mt-2 font-gaming text-base sm:text-lg font-black tracking-wide text-slate-100">
              {model.nextAction}
            </div>
            {model.prepAction && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{model.prepTitle}</span>
                  <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-200">
                    Готовься
                  </span>
                </div>
                <div className="mt-2 font-mono text-xs text-slate-200">{model.prepAction}</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

