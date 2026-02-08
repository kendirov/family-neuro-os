import { useMemo, useEffect, useState } from 'react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { cn } from '@/lib/utils'

const BUBBLE_COUNT = 8

/**
 * Liquid fuel tank: gradient fill, number floating inside, optional bubbles.
 * Wobble/rise animation when points added (floatEarn set).
 */
export function FuelTank({
  value,
  floatEarn,
  variant = 'roma',
  max = 200,
  className = '',
}) {
  const percent = Math.min(100, (value / max) * 100)
  const isRoma = variant === 'roma'
  const [liquidBump, setLiquidBump] = useState(false)

  useEffect(() => {
    if (floatEarn == null) return
    setLiquidBump(true)
    const t = setTimeout(() => setLiquidBump(false), 600)
    return () => clearTimeout(t)
  }, [floatEarn])

  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, (_, i) => ({
        id: i,
        left: `${10 + i * 12}%`,
        size: 4 + (i % 3),
        delay: i * 0.35,
        duration: 2.2 + (i % 5) * 0.3,
      })),
    []
  )

  const tankGlowClass =
    value > 500
      ? 'fuel-tank-glow-high'
      : value < 50
        ? 'fuel-tank-glow-low fuel-tank-flicker'
        : isRoma
          ? 'border-cyan-500/40 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
          : 'border-purple-500/40 shadow-[0_0_16px_rgba(168,85,247,0.25)]'

  const liquidGradient = isRoma
    ? 'linear-gradient(180deg, #67e8f9 0%, #22d3ee 35%, #0891b2 70%, #0e7490 100%)'
    : 'linear-gradient(180deg, #c084fc 0%, #a855f7 35%, #7c3aed 70%, #6b21a8 100%)'

  const numberClass = isRoma
    ? 'text-cyan-400 drop-shadow-[0_0_14px_rgba(34,211,238,0.7)]'
    : 'text-purple-400 drop-shadow-[0_0_14px_rgba(168,85,247,0.7)]'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 bg-slate-900/95 min-h-[64px] flex items-center justify-center',
        tankGlowClass,
        className
      )}
    >
      {/* Progress bar: liquid fill from bottom; wobble when points added */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-b-[14px] transition-[height] duration-500 ease-out min-h-[8%]',
          liquidBump && 'fuel-tank-liquid-bump'
        )}
        style={{
          height: `${Math.max(8, percent)}%`,
          background: value > 500 ? 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)' : liquidGradient,
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.25)',
        }}
      />
      {/* Bubbles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {bubbles.map((b) => (
          <span
            key={b.id}
            className="fuel-tank-bubble"
            style={{
              left: b.left,
              bottom: '5%',
              width: b.size,
              height: b.size,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>
      {/* Number floating in liquid (floating +N now spawns from avatar) */}
      <div className="relative z-10 flex items-center justify-center">
        <span
          className={cn(
            'font-mono text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums',
            value > 500 ? 'text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]' : numberClass
          )}
        >
          <AnimatedNumber value={value} />
        </span>
      </div>
    </div>
  )
}
