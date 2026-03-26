import { motion, useReducedMotion } from 'motion/react'
import type { TodaySummaryUiModel } from '../../lib/pilot-base-ui-model'

export function TodaySummaryCard({ model }: { model: TodaySummaryUiModel }) {
  const reduce = useReducedMotion()
  const pct = model.total > 0 ? Math.round((model.done / model.total) * 100) : 0
  const isComplete = model.state === 'complete'

  return (
    <motion.section
      className="rounded-3xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-5 overflow-hidden"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label="Итог дня"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Итог дня</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">
            Быстро видно, сколько уже готово.
          </p>
        </div>
        <span
          className={[
            'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
            isComplete ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-200',
          ].join(' ')}
        >
          {isComplete ? 'Зачёт!' : `${pct}%`}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-4 items-start">
        <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Сделано</div>
          <div className="mt-1 font-gaming text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-100 text-pop">
            {model.done} из {model.total} миссий
          </div>

          <div className="mt-3">
            <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <motion.div
                className={isComplete ? 'h-full bg-gradient-to-r from-emerald-400/80 via-cyan-400/60 to-emerald-400/80' : 'h-full bg-gradient-to-r from-cyan-400/70 via-purple-500/50 to-amber-400/60'}
                initial={false}
                animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                transition={{ duration: reduce ? 0.01 : 0.35 }}
              />
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {isComplete ? 'Сегодня миссии закрыты. Отличный прогон.' : 'Ещё чуть-чуть — и будет зачёт.'}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/20 p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Ждут выполнения</div>
          {model.waitingLabels.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-3 font-mono text-xs text-emerald-200">
              Всё готово. Можно в Арену за наградой.
            </div>
          ) : (
            <ul className="mt-2 space-y-2">
              {model.waitingLabels.slice(0, 3).map((label) => (
                <li key={label} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-200 truncate">{label}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Сейчас</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.section>
  )
}

