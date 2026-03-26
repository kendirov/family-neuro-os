import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FuelStateModel, PilotAccent } from '../../lib/pilot-ui-model'
import { FUEL_THEMES, ACCENT_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

const BUBBLE_COUNT = 10

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function FuelTankCard({
  fuel,
  accent,
}: {
  fuel: FuelStateModel
  accent: PilotAccent
}) {
  const shouldReduceMotion = useReducedMotion()
  const fuelTheme = FUEL_THEMES[fuel.kind]
  const accentTheme = ACCENT_THEMES[accent]

  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
        id: i,
        left: `${8 + i * 9}%`,
        size: 4 + (i % 4),
        delay: i * 0.22,
        duration: 2.3 + (i % 5) * 0.25,
      })),
    []
  )

  const [isShaking, setIsShaking] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  const prevKindRef = useRef<FuelStateModel['kind']>(fuel.kind)
  useEffect(() => {
    const prev = prevKindRef.current
    if (prev === fuel.kind) return
    prevKindRef.current = fuel.kind

    if (shouldReduceMotion) return
    if (fuel.kind === 'overheat') {
      setIsShaking(true)
      window.setTimeout(() => setIsShaking(false), 720)
    }
    if (fuel.kind === 'premium_fuel') {
      setIsPulsing(true)
      window.setTimeout(() => setIsPulsing(false), 900)
    }
  }, [fuel.kind, shouldReduceMotion])

  const percent = clamp((fuel.value / fuel.max) * 100, 0, 100)

  const overheatText = fuel.kind === 'overheat' ? 'text-red-200' : undefined
  const multiplierText =
    fuel.xpDayMultiplier === 1
      ? 'x1.00'
      : fuel.xpDayMultiplier === 1.25
        ? 'x1.25'
        : fuel.xpDayMultiplier === 0.85
          ? 'x0.85'
          : fuel.xpDayMultiplier === 0.7
            ? 'x0.70'
            : `x${fuel.xpDayMultiplier.toFixed(2)}`

  return (
    <section
      className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4"
      aria-label={tgText('kid', 'fuel.card.aria')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-gaming text-[11px] uppercase tracking-[0.25em] text-slate-300/90">
            {tgText('kid', 'fuel.title')}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">
            {fuel.label} · {tgText('kid', 'fuel.todayMult', { mult: multiplierText })}
          </p>
        </div>
        <div
          className={[
            'shrink-0 rounded-xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
            fuelTheme.border,
            fuelTheme.text,
            'bg-slate-950/30',
          ].join(' ')}
          aria-label={tgText('kid', 'fuel.state.aria', { label: fuelTheme.label })}
        >
          {fuel.kind === 'empty_low'
            ? tgText('kid', 'fuel.state.low')
            : fuel.kind === 'normal'
              ? tgText('kid', 'fuel.state.ok')
              : fuel.kind === 'premium_fuel'
                ? tgText('kid', 'fuel.state.boost')
                : tgText('kid', 'fuel.state.danger')}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <motion.div
            className={[
              'relative overflow-hidden rounded-2xl border-2 bg-slate-950/40',
              fuelTheme.border,
              'min-h-[120px]',
              shouldReduceMotion ? '' : fuelTheme.glowClass,
            ].join(' ')}
            initial={false}
            animate={isShaking && !shouldReduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={fuel.max}
            aria-valuenow={fuel.value}
            aria-label={tgText('kid', 'fuel.level.aria', { pct: percent.toFixed(0) })}
          >
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.10)_0,transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(34,211,238,0.10)_0,transparent_60%)]" />
            </div>

            {/* Fill */}
            <motion.div
              className={[
                'absolute inset-x-0 bottom-0 rounded-b-[14px] transition-[height] duration-500 ease-out',
              ].join(' ')}
              animate={{ height: `${Math.max(8, percent)}%` }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.35 }}
              style={{
                background:
                  fuel.kind === 'overheat'
                    ? 'linear-gradient(180deg, rgba(239,68,68,0.85) 0%, rgba(245,158,11,0.12) 55%, rgba(0,0,0,0) 100%)'
                    : fuel.kind === 'premium_fuel'
                      ? 'linear-gradient(180deg, rgba(251,191,36,0.95) 0%, rgba(245,158,11,0.30) 55%, rgba(0,0,0,0) 100%)'
                      : accent === 'cyan'
                        ? 'linear-gradient(180deg, rgba(34,211,238,0.75) 0%, rgba(6,182,212,0.18) 55%, rgba(0,0,0,0) 100%)'
                        : 'linear-gradient(180deg, rgba(168,85,247,0.70) 0%, rgba(124,58,237,0.18) 55%, rgba(0,0,0,0) 100%)',
                boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.20), inset 0 -2px 10px rgba(0,0,0,0.25)',
              }}
            />

            {/* Bubbles (disabled under reduced motion) */}
            {!shouldReduceMotion && (
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                {bubbles.map((b) => (
                  <span
                    key={b.id}
                    className="fuel-tank-bubble"
                    style={{
                      left: b.left,
                      bottom: '6%',
                      width: b.size,
                      height: b.size,
                      animationDelay: `${b.delay}s`,
                      animationDuration: `${b.duration}s`,
                      background: fuel.kind === 'overheat' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.35)',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Center number */}
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <span
                  className={[
                    'font-mono font-black tabular-nums',
                    'text-[34px] leading-none',
                    overheatText ?? fuelTheme.text,
                    shouldReduceMotion ? '' : isPulsing ? 'filter brightness(1.15) drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]' : '',
                    fuel.kind === 'premium_fuel' ? 'drop-shadow-[0_0_20px_rgba(251,191,36,0.35)]' : '',
                  ].join(' ')}
                >
                  {Math.round(fuel.value)}
                </span>
                <span className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-400/90">
                  / {fuel.max}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Horizontal scale */}
      <div className="mt-4">
        <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <motion.div
            className={[
              'h-full rounded-full',
              fuel.kind === 'overheat'
                ? 'bg-gradient-to-r from-red-500 via-amber-400/60 to-red-600'
                : fuel.kind === 'premium_fuel'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300/50 to-amber-500'
                  : accentTheme.text,
            ].join(' ')}
            initial={false}
            animate={{ width: `${Math.max(2, percent)}%` }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.35 }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <span>{fuel.kind === 'empty_low' ? tgText('kid', 'fuel.band.danger') : tgText('kid', 'fuel.band.safe')}</span>
          <span className="text-slate-400">
            {fuel.kind === 'overheat'
              ? tgText('kid', 'fuel.tag.heat')
              : fuel.kind === 'premium_fuel'
                ? tgText('kid', 'fuel.tag.boost')
                : tgText('kid', 'fuel.tag.routine')}
          </span>
        </div>
      </div>
    </section>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

