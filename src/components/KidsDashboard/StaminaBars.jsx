/**
 * StaminaBars — HP/Stamina-бары экранного времени для Kids Dashboard.
 * Safe Zone (0–60 мин): cyan→blue. Danger Zone (60+): orange→red, neon glow.
 * Толстые, округлые, самый заметный элемент.
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const SAFE_THRESHOLD = 60
const BAR_MAX_MINUTES = 120

const PILOTS = [
  { id: 'kirill', name: 'Кирилл', accent: 'purple' },
  { id: 'roma', name: 'Рома', accent: 'cyan' },
]

function StaminaBar({ pilotId, name, accentColor, minutes }) {
  const isPurple = accentColor === 'purple'
  const inDanger = minutes > SAFE_THRESHOLD
  const safePart = Math.min(minutes, SAFE_THRESHOLD)
  const dangerPart = Math.max(0, minutes - SAFE_THRESHOLD)

  const safePercent = (safePart / BAR_MAX_MINUTES) * 100
  const dangerPercent = (dangerPart / BAR_MAX_MINUTES) * 100
  const thresholdPercent = (SAFE_THRESHOLD / BAR_MAX_MINUTES) * 100

  return (
    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
      {/* Label above bar */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest',
            isPurple ? 'text-purple-400/90' : 'text-cyan-400/90'
          )}
        >
          {name}
        </span>
        <span className="font-mono text-xs tabular-nums text-slate-300">
          В игре: {minutes} мин
        </span>
      </div>

      {/* Bar container */}
      <div
        className={cn(
          'relative h-14 sm:h-16 rounded-2xl overflow-hidden',
          'bg-slate-900/80 border border-white/10'
        )}
      >
        {/* Track background */}
        <div className="absolute inset-0 bg-slate-800/60" />

        {/* Safe zone fill (0–60) */}
        {safePart > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-l-2xl transition-all duration-500"
            style={{
              width: `${safePercent}%`,
              background: 'linear-gradient(90deg, rgb(6 182 212), rgb(59 130 246))',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          />
        )}

        {/* Danger zone fill (60+) */}
        {dangerPart > 0 && (
          <div
            className="absolute inset-y-0 rounded-r-2xl transition-all duration-500"
            style={{
              left: `${thresholdPercent}%`,
              width: `${dangerPercent}%`,
              background: 'linear-gradient(90deg, rgb(249 115 22), rgb(220 38 38))',
              boxShadow:
                '0 0 24px rgba(249,115,22,0.6), 0 0 40px rgba(220,38,38,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          />
        )}

        {/* Threshold line at 60 min */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
          style={{ left: `${thresholdPercent}%` }}
          aria-hidden
        />

        {/* Zone label inside bar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={cn(
              'font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-lg',
              inDanger ? 'text-orange-200' : 'text-cyan-100'
            )}
            style={{
              textShadow: inDanger
                ? '0 0 12px rgba(249,115,22,0.8), 0 1px 2px rgba(0,0,0,0.8)'
                : '0 0 8px rgba(34,211,238,0.5), 0 1px 2px rgba(0,0,0,0.6)',
            }}
          >
            {inDanger ? 'ШТРАФ x2' : 'СЕЙФ-ЗОНА (1x)'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function StaminaBars() {
  const getDisplayBreakdownToday = useAppStore((s) => s.getDisplayBreakdownToday)
  const pilots = useAppStore((s) => s.pilots ?? {})
  const dailyGamingBreakdown = useAppStore((s) => s.dailyGamingBreakdown ?? {})

  const gameMinutes = useMemo(() => {
    const { game } = getDisplayBreakdownToday()
    return {
      kirill: game?.kirill ?? 0,
      roma: game?.roma ?? 0,
    }
  }, [getDisplayBreakdownToday, pilots, dailyGamingBreakdown])

  return (
    <div
      className="px-4 py-3 flex flex-col sm:flex-row gap-4"
      role="region"
      aria-label="Экранное время: Кирилл и Рома"
    >
      {PILOTS.map((p) => (
        <StaminaBar
          key={p.id}
          pilotId={p.id}
          name={p.name}
          accentColor={p.accent}
          minutes={gameMinutes[p.id] ?? 0}
        />
      ))}
    </div>
  )
}
