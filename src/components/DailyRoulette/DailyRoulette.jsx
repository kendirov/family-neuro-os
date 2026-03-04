/**
 * DailyRoulette — "Quantum Decrypter" / Loot Box.
 * Expensive Minimalism: slate-950, cyan/fuchsia glows, sleek high-tech.
 * Спин списывается из daily_spins_remaining в БД.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'
import { DAILY_ROULETTE_PRIZES, pickRandomPrize } from '@/data/DailyRoulettePrizes'
import { cn } from '@/lib/utils'

const SPIN_DURATION_MS = 3500

/**
 * Web Audio — инициализация СТРОГО внутри onClick (user gesture).
 * Один ctx на весь спин: tick и win используют его.
 */
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

export function DailyRoulette({ childId, accentColor = 'cyan' }) {
  const users = useAppStore((s) => s.users)
  const consumeDailySpin = useAppStore((s) => s.consumeDailySpin)
  const addPoints = useAppStore((s) => s.addPoints)
  const user = users.find((u) => u.id === childId)
  const spinsRemaining = user?.daily_spins_remaining ?? 3

  const [spinning, setSpinning] = useState(false)
  const [wonPrize, setWonPrize] = useState(null)
  const [displayIndex, setDisplayIndex] = useState(0)

  const isLocked = spinsRemaining <= 0 || spinning
  const isCyan = accentColor === 'cyan'
  const glowColor = isCyan ? 'rgba(6,182,212,0.5)' : 'rgba(217,70,239,0.5)'
  const borderGlow = isCyan ? 'rgba(34,211,238,0.4)' : 'rgba(217,70,239,0.4)'

  const applyPrize = useCallback(
    (prize) => {
      if (prize.type === 'xp') {
        addPoints(childId, prize.value, `🎰 Daily Roulette: ${prize.label}`)
      }
      // time, item, money — пока только отображаем, можно расширить
    },
    [childId, addPoints]
  )

  const handleSpin = useCallback(() => {
    if (isLocked) return
    const consumed = consumeDailySpin(childId)
    if (!consumed) return

    // AudioContext: создаём СТРОГО внутри onClick (user gesture)
    const audioCtx = createAudioContext()
    playTick(audioCtx)

    const prize = pickRandomPrize()
    const prizeIndex = DAILY_ROULETTE_PRIZES.findIndex((p) => p.id === prize.id)
    const targetIndex = prizeIndex >= 0 ? prizeIndex : 0

    setSpinning(true)
    setWonPrize(null)

    // Быстрая прокрутка: несколько полных циклов + финальная позиция
    const totalItems = DAILY_ROULETTE_PRIZES.length
    const extraLoops = 4 + Math.floor(Math.random() * 2)
    const finalOffset = extraLoops * totalItems + targetIndex

    const startTime = performance.now()
    let tickCount = 0

    const tick = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(1, elapsed / SPIN_DURATION_MS)
      // Ease-out cubic: быстро в начале, медленно в конце
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
        applyPrize(prize)
      }
    }
    requestAnimationFrame(tick)
  }, [childId, consumeDailySpin, applyPrize, isLocked])

  const currentPrize = DAILY_ROULETTE_PRIZES[displayIndex] ?? DAILY_ROULETTE_PRIZES[0]

  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300',
        isLocked && 'opacity-60 pointer-events-none'
      )}
      style={{
        background: 'rgba(2, 6, 23, 0.95)',
        borderColor: borderGlow,
        boxShadow: `0 0 15px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b"
        style={{ borderColor: 'rgba(100,116,139,0.3)' }}
      >
        <span
          className="font-mono text-[10px] uppercase tracking-widest"
          style={{ color: isCyan ? '#22d3ee' : '#e879f9' }}
        >
          Quantum Decrypter
        </span>
        <span className="font-mono text-[10px] tabular-nums text-slate-400">
          {spinsRemaining}/3
        </span>
      </div>

      {/* Decoder window — один приз в центре */}
      <div
        className="relative h-20 flex items-center justify-center overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.6)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayIndex}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: spinning ? 0.05 : 0.2 }}
            className="flex flex-col items-center gap-0.5"
          >
            <span className="text-3xl">{currentPrize?.icon ?? '🎁'}</span>
            <span
              className="font-gaming text-xs font-bold uppercase tracking-wider text-center px-2"
              style={{ color: currentPrize?.color ?? '#94a3b8' }}
            >
              {currentPrize?.label ?? '—'}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Scan line effect при спинe */}
        {spinning && (
          <div
            className="absolute inset-0 pointer-events-none opacity-30 animate-daily-roulette-scan"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${glowColor} 50%, transparent 100%)`,
            }}
          />
        )}
      </div>

      {/* Spin button */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={isLocked}
        className={cn(
          'w-full py-3 font-gaming text-xs font-black uppercase tracking-widest transition-all touch-manipulation',
          isLocked
            ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed'
            : isCyan
              ? 'bg-cyan-500/20 text-cyan-300 border-t border-cyan-400/30 hover:bg-cyan-500/30 active:scale-[0.98]'
              : 'bg-fuchsia-500/20 text-fuchsia-300 border-t border-fuchsia-400/30 hover:bg-fuchsia-500/30 active:scale-[0.98]'
        )}
        style={
          !isLocked
            ? {
                boxShadow: `0 0 12px ${glowColor}`,
              }
            : undefined
        }
      >
        {spinning ? 'Декодирование...' : spinsRemaining > 0 ? 'Декодировать' : 'Лимит исчерпан'}
      </button>

      {/* Result overlay */}
      <AnimatePresence>
        {wonPrize && !spinning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-4"
            style={{
              background: 'rgba(2, 6, 23, 0.98)',
              boxShadow: `inset 0 0 40px ${glowColor}`,
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-1">
              Результат
            </p>
            <p className="text-4xl mb-1">{wonPrize.icon}</p>
            <p
              className="font-gaming text-lg font-bold uppercase"
              style={{ color: wonPrize.color }}
            >
              {wonPrize.label}
            </p>
            <button
              type="button"
              onClick={() => setWonPrize(null)}
              className="mt-4 px-6 py-2 rounded-lg font-mono text-xs font-bold uppercase bg-white/10 hover:bg-white/20 border border-white/20 transition"
            >
              ОК
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
