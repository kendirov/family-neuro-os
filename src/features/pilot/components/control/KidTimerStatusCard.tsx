import type { UsePenaltyTimerResult } from '@/hooks/usePenaltyTimer'

function statusLabel(result: UsePenaltyTimerResult): string {
  const s = result.session?.status
  if (!s) return 'Остановлено'
  if (s === 'active') return 'Идёт'
  if (s === 'paused') return 'Пауза'
  return 'Время вышло'
}

function statusTone(result: UsePenaltyTimerResult): 'idle' | 'active' | 'paused' | 'expired' {
  const s = result.session?.status
  if (!s) return 'idle'
  if (s === 'active') return 'active'
  if (s === 'paused') return 'paused'
  return 'expired'
}

function toneClasses(tone: ReturnType<typeof statusTone>) {
  if (tone === 'active') return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
  if (tone === 'paused') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  if (tone === 'expired') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  return 'border-white/10 bg-white/5 text-slate-200'
}

function modeLabel(result: UsePenaltyTimerResult): string {
  const t = (result.session?.activity_type ?? '').toLowerCase()
  if (t.includes('game')) return 'Игра'
  if (t.includes('cartoon') || t.includes('youtube') || t.includes('media')) return 'Мультики'
  return 'Другое'
}

export function KidTimerStatusCard({
  pilotName,
  result,
}: {
  pilotName: string
  result: UsePenaltyTimerResult
}) {
  const tone = statusTone(result)
  const sLabel = statusLabel(result)
  const mLabel = modeLabel(result)

  return (
    <section
      className="rounded-3xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-5"
      aria-label="Статус таймера"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-gaming text-base font-black uppercase tracking-wider">Экран активен</h3>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">
            Сессия принадлежит: <span className="text-slate-200 font-bold">{pilotName}</span>
          </p>
        </div>

        <span className={['shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest', toneClasses(tone)].join(' ')}>
          {sLabel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Режим</div>
          <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-slate-100">
            {mLabel}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Пояснение</div>
          <div className="mt-1 font-mono text-xs text-slate-200">
            Старт даёт родитель. Ты просто смотри таймер.
          </div>
        </div>
      </div>

      {tone === 'paused' && (
        <div className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 font-mono text-xs text-amber-200">
          Пауза. Жди сигнала.
        </div>
      )}

      {tone === 'expired' && (
        <div className="mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 font-mono text-xs text-emerald-200">
          Время закончилось. Загляни на Базу или Арену.
        </div>
      )}
    </section>
  )
}

