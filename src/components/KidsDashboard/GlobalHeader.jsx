/**
 * GlobalHeader — тёмный glassmorphism-бар для Kids Dashboard.
 * Дата на русском + массивная типографика очков семьи/пилотов.
 * 2026 terminal aesthetics.
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { CountUpNumber } from '@/components/CountUpNumber'
import { formatDateRuLong } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'

export function GlobalHeader() {
  const users = useAppStore((s) => s.users)

  const { roma, kirill, total } = useMemo(() => {
    const r = users?.find((u) => u.id === 'roma')
    const k = users?.find((u) => u.id === 'kirill')
    const romaBal = r?.balance ?? 0
    const kirillBal = k?.balance ?? 0
    return {
      roma: r,
      kirill: k,
      total: romaBal + kirillBal,
    }
  }, [users])

  return (
    <header
      className={cn(
        'shrink-0 px-4 py-3 border-b border-white/5',
        'bg-slate-900/50 backdrop-blur-md'
      )}
      aria-label="Шапка дашборда"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Дата */}
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Сегодня
          </span>
          <time
            dateTime={new Date().toISOString().slice(0, 10)}
            className="font-mono text-sm sm:text-base font-semibold text-slate-300 tabular-nums"
          >
            {formatDateRuLong()}
          </time>
        </div>

        {/* Очки семьи — массивная типографика */}
        <div className="flex items-baseline gap-4 sm:gap-6">
          <div className="flex flex-col items-end">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">
              Семья
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="font-turbo-nums text-3xl sm:text-4xl md:text-5xl font-black tabular-nums text-cyan-200"
                style={{ textShadow: '0 0 24px rgba(34,211,238,0.5)' }}
              >
                <CountUpNumber value={total} duration={400} />
              </span>
              <span className="text-xl sm:text-2xl text-amber-400/90 font-bold">⚡</span>
            </div>
          </div>

          {/* Индивидуальные очки */}
          <div className="hidden sm:flex items-center gap-4 border-l border-white/10 pl-4">
            {kirill && (
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400/80">
                  Кирилл
                </span>
                <span className="font-turbo-nums text-lg font-bold text-purple-300 tabular-nums">
                  <CountUpNumber value={kirill.balance ?? 0} duration={400} />
                </span>
              </div>
            )}
            {roma && (
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/80">
                  Рома
                </span>
                <span className="font-turbo-nums text-lg font-bold text-cyan-300 tabular-nums">
                  <CountUpNumber value={roma.balance ?? 0} duration={400} />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
