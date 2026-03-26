import { motion, useReducedMotion } from 'motion/react'
import type { UsePenaltyTimerResult } from '@/hooks/usePenaltyTimer'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { ACCENT_THEMES } from '../../lib/pilot-theme'

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

function statusShort(result: UsePenaltyTimerResult) {
  const s = result.session?.status
  if (!s) return 'Остановлено'
  if (s === 'active') return 'Идёт'
  if (s === 'paused') return 'Пауза'
  return 'Время вышло'
}

export function KidTimerHero({
  pilotId,
  pilotName,
  accent,
  result,
}: {
  pilotId: 'kirill' | 'roma'
  pilotName: string
  accent: 'cyan' | 'purple'
  result: UsePenaltyTimerResult
}) {
  const reduce = useReducedMotion()
  const theme = ACCENT_THEMES[accent]

  const isActive = result.session?.status === 'active'
  const isPaused = result.session?.status === 'paused'
  const isExpired = result.session?.status === 'completed'
  const isBurning = isActive && result.isBurning

  const mainSeconds = isActive || isPaused ? result.safeTimeRemaining : 0
  const title = isExpired ? 'Время закончилось' : isPaused ? 'Пауза' : isActive ? 'Экран активен' : 'Остановлено'

  return (
    <motion.section
      className={[
        'panel-glass rounded-3xl border border-white/10 overflow-hidden',
        accent === 'cyan' ? 'border-cyan-500/20' : 'border-purple-500/20',
        'shadow-[0_14px_48px_rgba(0,0,0,0.55)]',
      ].join(' ')}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label={`Таймер: ${pilotName}`}
    >
      <div className="relative p-6">
        <div className={['absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-25', accent === 'cyan' ? 'bg-cyan-500/35' : 'bg-purple-500/35'].join(' ')} aria-hidden />
        {isBurning && !reduce && (
          <div className="absolute inset-0 animate-burn-pulse opacity-60 pointer-events-none" aria-hidden />
        )}

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PilotAvatar pilotId={pilotId} size="engine" className="w-14 h-14 rounded-2xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-gaming text-lg sm:text-xl font-black uppercase tracking-wider truncate text-pop">
                  {pilotName}
                </h2>
                <span className={['rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest', theme.hudChip].join(' ')}>
                  {statusShort(result)}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400/90">
                {title}. Старт даёт родитель.
              </p>
            </div>
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
                    : isActive
                      ? (accent === 'cyan' ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-purple-500/40 bg-purple-500/10 text-purple-200')
                      : 'border-white/10 bg-white/5 text-slate-200',
            ].join(' ')}
          >
            Режим: {((result.session?.activity_type ?? '').toLowerCase().includes('game') && 'Игра') ||
              (((result.session?.activity_type ?? '').toLowerCase().includes('cartoon') ||
                (result.session?.activity_type ?? '').toLowerCase().includes('youtube') ||
                (result.session?.activity_type ?? '').toLowerCase().includes('media') ||
                '')) && 'Мультики' ||
              'Другое'}
          </span>
        </div>

        <div className="relative mt-5 rounded-3xl border border-white/10 bg-slate-950/35 p-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Осталось времени
          </div>
          <div
            className={[
              'mt-2 font-mono text-5xl sm:text-6xl font-black tabular-nums',
              isBurning ? 'text-red-200 drop-shadow-[0_0_22px_rgba(248,113,113,0.45)]' : 'text-cyan-200 drop-shadow-[0_0_26px_rgba(34,211,238,0.55)]',
              !isActive && !isPaused ? 'opacity-40' : '',
            ].join(' ')}
          >
            {(isActive || isPaused) ? formatCountdown(mainSeconds) : '— — : — —'}
          </div>
          <div className="mt-2 font-mono text-[11px] text-slate-400/90">
            {isBurning ? 'Энергия уходит. Смотри индикатор.' : isActive ? 'Спокойное время.' : isPaused ? 'Жди сигнала.' : 'Сейчас экран не запущен.'}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

