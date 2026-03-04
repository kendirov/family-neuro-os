/**
 * RouletteCard — Gacha/Spin механика. Next-Gen Gaming HUD.
 * State 1 (Locked): grayscale, "НЕДОСТАТОЧНО ОЧКОВ"
 * State 2 (Ready): pulsing glow, "КРУТИТЬ РУЛЕТКУ (Доступно: X)"
 * Rolling animation like CS:GO/Roblox cases.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'
import { DAILY_ROULETTE_PRIZES, pickRandomPrize } from '@/data/DailyRoulettePrizes'
import { cn } from '@/lib/utils'

const SPIN_DURATION_MS = 3500

function createAudioContext() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch (_) {
    return null
  }
}

function playTick(ctx) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  } catch (_) {}
}

function playWin(ctx) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch (_) {}
}

export function RouletteCard({ childId, accentColor = 'cyan' }) {
  const useSpin = useAppStore((s) => s.useSpin)
  const getAvailableSpins = useAppStore((s) => s.getAvailableSpins)

  const availableSpins = getAvailableSpins(childId)
  const isLocked = availableSpins <= 0

  const [spinning, setSpinning] = useState(false)
  const [wonPrize, setWonPrize] = useState(null)
  const [displayIndex, setDisplayIndex] = useState(0)

  const isCyan = accentColor === 'cyan'
  const glowRgba = isCyan ? 'rgba(6,182,212,0.6)' : 'rgba(217,70,239,0.6)'

  const handleSpin = useCallback(() => {
    if (isLocked || spinning) return
    if (getAvailableSpins(childId) < 1) return

    const audioCtx = createAudioContext()
    playTick(audioCtx)

    const prize = pickRandomPrize()
    const prizeIndex = DAILY_ROULETTE_PRIZES.findIndex((p) => p.id === prize.id)
    const targetIndex = prizeIndex >= 0 ? prizeIndex : 0

    setSpinning(true)
    setWonPrize(null)

    const totalItems = DAILY_ROULETTE_PRIZES.length
    const extraLoops = 4 + Math.floor(Math.random() * 2)
    const finalOffset = extraLoops * totalItems + targetIndex

    const startTime = performance.now()
    let tickCount = 0

    const tick = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(1, elapsed / SPIN_DURATION_MS)
      const eased = 1 - Math.pow(1 - progress, 3)
      const currentOffset = Math.floor(eased * finalOffset)
      setDisplayIndex(currentOffset % totalItems)

      if (progress < 1) {
        tickCount++
        if (tickCount % 2 === 0) playTick(audioCtx)
        requestAnimationFrame(tick)
      } else {
        setDisplayIndex(targetIndex)
        setSpinning(false)
        setWonPrize(prize)
        playWin(audioCtx)
        useSpin(childId, prize)
      }
    }
    requestAnimationFrame(tick)
  }, [childId, isLocked, spinning, useSpin, getAvailableSpins])

  const currentPrize = DAILY_ROULETTE_PRIZES[displayIndex] ?? DAILY_ROULETTE_PRIZES[0]

  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300',
        isLocked && 'grayscale opacity-50'
      )}
      style={{
        background: 'rgba(2, 6, 23, 0.95)',
        borderColor: isLocked ? 'rgba(100,116,139,0.3)' : (isCyan ? 'rgba(34,211,238,0.5)' : 'rgba(217,70,239,0.5)'),
        boxShadow: isLocked ? 'none' : `0 0 20px ${glowRgba}`,
      }}
    >
      {/* Rolling window */}
      <div
        className="relative h-24 flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.8)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayIndex}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: spinning ? 0.04 : 0.2 }}
            className="flex flex-col items-center gap-0.5"
          >
            <span className="text-4xl">{currentPrize?.icon ?? '🎁'}</span>
            <span
              className="font-mono text-sm font-bold uppercase tracking-wider text-center px-2"
              style={{ color: currentPrize?.color ?? '#94a3b8' }}
            >
              {currentPrize?.label ?? '—'}
            </span>
          </motion.div>
        </AnimatePresence>

        {spinning && (
          <div
            className="absolute inset-0 pointer-events-none opacity-20 animate-daily-roulette-scan"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${glowRgba} 50%, transparent 100%)`,
            }}
          />
        )}
      </div>

      {/* Main CTA button */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={isLocked || spinning}
        className={cn(
          'w-full py-4 font-mono text-sm font-black uppercase tracking-widest transition-all touch-manipulation',
          isLocked
            ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
            : spinning
              ? 'bg-slate-700/60 text-slate-400 cursor-wait'
              : isCyan
                ? 'bg-cyan-500/25 text-cyan-200 border-t border-cyan-400/40 hover:bg-cyan-500/35 active:scale-[0.98] animate-pulse'
                : 'bg-fuchsia-500/25 text-fuchsia-200 border-t border-fuchsia-400/40 hover:bg-fuchsia-500/35 active:scale-[0.98] animate-pulse'
        )}
        style={
          !isLocked && !spinning
            ? { boxShadow: `0 0 20px ${glowRgba}` }
            : undefined
        }
      >
        {spinning
          ? 'Крутится...'
          : isLocked
            ? 'НЕДОСТАТОЧНО ОЧКОВ'
            : `КРУТИТЬ РУЛЕТКУ (Доступно: ${availableSpins})`}
      </button>

      {/* Result overlay */}
      <AnimatePresence>
        {wonPrize && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-4 z-20"
            style={{
              background: 'rgba(2, 6, 23, 0.98)',
              boxShadow: `inset 0 0 60px ${glowRgba}`,
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Результат
            </p>
            <p className="text-5xl mb-2">{wonPrize.icon}</p>
            <p
              className="font-mono text-lg font-bold uppercase"
              style={{ color: wonPrize.color }}
            >
              {wonPrize.label}
            </p>
            <button
              type="button"
              onClick={() => setWonPrize(null)}
              className="mt-4 px-6 py-2 rounded-xl font-mono text-xs font-bold uppercase bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              ОК
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
