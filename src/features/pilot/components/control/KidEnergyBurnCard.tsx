import { motion, useReducedMotion } from 'motion/react'
import type { UsePenaltyTimerResult } from '@/hooks/usePenaltyTimer'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function KidEnergyBurnCard({ result }: { result: UsePenaltyTimerResult }) {
  const reduce = useReducedMotion()

  const safeTotalSeconds = Math.max(0, Number(result.preset?.safe_minutes ?? 0) * 60)
  const usedSafeSeconds = clamp(result.totalSecondsElapsed, 0, safeTotalSeconds || 1)
  const safePct = safeTotalSeconds > 0 ? clamp((usedSafeSeconds / safeTotalSeconds) * 100, 0, 100) : 0

  const isActive = result.session?.status === 'active'
  const isPaused = result.session?.status === 'paused'
  const isExpired = result.session?.status === 'completed'
  const isBurning = result.isBurning && isActive

  const headerBadge =
    isExpired ? 'Финиш' : isPaused ? 'Пауза' : isActive ? (isBurning ? 'Энергия уходит' : 'Стабильно') : 'Остановлено'

  return (
    <section
      className="rounded-3xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-5 overflow-hidden"
      aria-label="Энергия"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-gaming text-base font-black uppercase tracking-wider">Энергия</h3>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">
            Полоса показывает, сколько спокойного времени осталось.
          </p>
        </div>
        <span
          className={[
            'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
            isBurning
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : isPaused
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : isExpired
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/10 bg-white/5 text-slate-200',
          ].join(' ')}
        >
          {headerBadge}
        </span>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/25 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Осталось времени</span>
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
            {Math.max(0, Math.floor(result.safeTimeRemaining))}s
          </span>
        </div>

        <div className="mt-3 relative rounded-2xl border border-white/10 overflow-hidden screen-time-track-bg">
          <div className={['absolute inset-0', isActive ? 'screen-time-track-active' : ''].join(' ')} aria-hidden />
          <motion.div
            className={[
              'relative h-6',
              isBurning ? 'screen-time-neon-penalty' : 'screen-time-neon-cyan',
              !isActive ? 'opacity-40' : '',
            ].join(' ')}
            initial={false}
            animate={{ width: `${100 - safePct}%` }}
            transition={{ duration: reduce ? 0.01 : 0.35 }}
            aria-hidden
          >
            <span
              className={[
                'absolute right-0 top-0',
                'screen-time-leading-edge',
                isBurning ? 'screen-time-leading-edge-penalty' : 'screen-time-leading-edge-cyan',
                !isActive ? 'opacity-0' : '',
              ].join(' ')}
              aria-hidden
            />
          </motion.div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Множитель</div>
            <div className="mt-1 font-gaming text-lg font-black uppercase tracking-wider text-slate-100">
              x{result.currentMultiplier}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Сгорело</div>
            <div className={['mt-1 font-gaming text-lg font-black uppercase tracking-wider', isBurning ? 'text-red-200' : 'text-slate-100'].join(' ')}>
              −{result.coinsBurned.toFixed(1)}
            </div>
          </div>
        </div>

        {!isActive && (
          <div className="mt-3 font-mono text-[11px] text-slate-500">
            Сейчас таймер не тикает.
          </div>
        )}
      </div>
    </section>
  )
}

