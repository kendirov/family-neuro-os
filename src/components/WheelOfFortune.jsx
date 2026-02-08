import { useState, useCallback, useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { PilotAvatar } from '@/components/HelmetAvatar'

/** Weighted prize tiers. Sum = 100. Emoji for lootbox-style UI. */
const PRIZES = [
  { weight: 25, label: 'Вкусняшка (Дошик/Снек)', id: 'snack', xp: 0, emoji: '🍬' },
  { weight: 25, label: '10 Рублей', id: '10r', xp: 0, emoji: '💵' },
  { weight: 30, label: 'Пропуск плохого мультика', id: 'skip', xp: 0, emoji: '📺' },
  { weight: 15, label: '+20 Минут Игры', id: '20min', xp: 20, emoji: '🎮' },
  { weight: 4.9, label: '100 Рублей', id: '100r', xp: 0, emoji: '💵' },
  { weight: 0.1, label: '1000 РУБЛЕЙ!!!', id: '1000r', xp: 0, emoji: '💎' },
]

/** Segment colors (Roblox/Brawl Stars style) and short labels for wheel. */
const WHEEL_SEGMENTS = [
  { color: 'rgb(96,165,250)', label: '🍬 Вкусняшка', emoji: '🍬' },
  { color: 'rgb(74,222,128)', label: '💵 10₽', emoji: '💵' },
  { color: 'rgb(250,204,21)', label: '📺 Пропуск', emoji: '📺' },
  { color: 'rgb(192,132,252)', label: '🎮 +20 мин', emoji: '🎮' },
  { color: 'rgb(248,113,113)', label: '💵 100₽', emoji: '💵' },
  { color: 'rgb(96,165,250)', label: '💎 1000₽', emoji: '💎' },
]

function pickPrize() {
  const r = Math.random() * 100
  let acc = 0
  for (const p of PRIZES) {
    acc += p.weight
    if (r < acc) return p
  }
  return PRIZES[PRIZES.length - 1]
}

/** Simple CSS confetti burst. */
function Confetti({ active, onDone }) {
  if (!active) return null
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100 - 10,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    color: ['#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ec4899', '#fbbf24'][i % 6],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
          onAnimationEnd={p.id === 0 ? onDone : undefined}
        />
      ))}
    </div>
  )
}

export function WheelOfFortune({ open, onClose }) {
  const addPoints = useAppStore((s) => s.addPoints)
  const logWheelWin = useAppStore((s) => s.logWheelWin)

  const [step, setStep] = useState('select')
  const [spinnerPilot, setSpinnerPilot] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [wonPrize, setWonPrize] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setStep('select')
      setSpinnerPilot(null)
      setWonPrize(null)
      setConfetti(false)
    }
  }, [open])

  const userId = spinnerPilot
  const userName = spinnerPilot === 'roma' ? 'Рома' : spinnerPilot === 'kirill' ? 'Кирилл' : ''

  const handleClose = useCallback(() => {
    setStep('select')
    setSpinnerPilot(null)
    setWonPrize(null)
    setConfetti(false)
    onClose()
  }, [onClose])

  const handleSpin = useCallback(() => {
    if (spinning || !userId) return
    setSpinning(true)
    setWonPrize(null)

    const prize = pickPrize()
    const extraTurns = 4 + Math.random() * 2
    const finalDeg = rotation + 360 * extraTurns + Math.random() * 360

    setRotation(finalDeg)

    const spinDuration = 4000
    const timer = setTimeout(() => {
      setSpinning(false)
      setWonPrize(prize)
      setConfetti(true)

      const desc = `🎰 Выигрыш: ${prize.label} (+${prize.xp} XP)`
      logWheelWin(userId, desc)
      if (prize.xp > 0) addPoints(userId, prize.xp, `🎰 Выигрыш: ${prize.label}`)
    }, spinDuration)

    return () => clearTimeout(timer)
  }, [userId, spinning, rotation, addPoints, logWheelWin])

  const closeResult = () => {
    setWonPrize(null)
    setConfetti(false)
    handleClose()
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={wonPrize ? closeResult : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Колесо фортуны"
      >
        <div
          className={cn(
            'relative bg-slate-900 border-4 border-blue-600 rounded-2xl p-8 shadow-2xl transform transition-all flex flex-col items-center w-full max-w-md animate-bounce-in',
            step === 'select' ? 'max-w-lg' : ''
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={wonPrize ? closeResult : handleClose}
            className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-slate-800/90 border border-slate-600 text-slate-400 hover:text-white transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step 1: Pilot selection */}
          {step === 'select' && (
            <>
              <h2 className="font-gaming text-2xl sm:text-3xl font-black uppercase tracking-widest text-amber-400 mb-6 text-center drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                КТО ИСПЫТЫВАЕТ УДАЧУ?
              </h2>
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setSpinnerPilot('roma')
                    setStep('spin')
                  }}
                  className="flex flex-col items-center gap-3 min-h-[140px] rounded-2xl border-2 border-cyan-500/60 bg-cyan-500/15 p-6 text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/25 hover:scale-105 active:scale-100 transition-transform duration-200 touch-manipulation"
                >
                  <PilotAvatar pilotId="roma" size="column" className="shrink-0" />
                  <span className="font-gaming text-lg font-bold uppercase tracking-wider">Рома</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpinnerPilot('kirill')
                    setStep('spin')
                  }}
                  className="flex flex-col items-center gap-3 min-h-[140px] rounded-2xl border-2 border-purple-500/60 bg-purple-500/15 p-6 text-purple-200 hover:border-purple-400 hover:bg-purple-500/25 hover:scale-105 active:scale-100 transition-transform duration-200 touch-manipulation"
                >
                  <PilotAvatar pilotId="kirill" size="column" className="shrink-0" />
                  <span className="font-gaming text-lg font-bold uppercase tracking-wider">Кирилл</span>
                </button>
              </div>
            </>
          )}

          {/* Step 2: Wheel spin */}
          {step === 'spin' && (
            <>
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep('select')}
                className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-slate-700/80 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600 transition"
                aria-label="Назад, выбрать другого пилота"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h2 className="font-gaming text-xl sm:text-2xl font-black uppercase tracking-widest text-white mb-3 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                КОЛЕСО ФОРТУНЫ
              </h2>

              {/* Wheel — lootbox style: 6 segments, thick border, labels + emojis */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0">
                <div
                  className={cn(
                    'absolute inset-0 rounded-full border-4 border-white shadow-[0_0_0_4px_rgba(30,64,175,0.6),0_8px_24px_rgba(0,0,0,0.4)]',
                    spinning && 'transition-transform duration-[4000ms] ease-out'
                  )}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionProperty: spinning ? 'transform' : 'none',
                    background: `conic-gradient(
                      from 0deg,
                      ${WHEEL_SEGMENTS[0].color} 0deg 60deg,
                      ${WHEEL_SEGMENTS[1].color} 60deg 120deg,
                      ${WHEEL_SEGMENTS[2].color} 120deg 180deg,
                      ${WHEEL_SEGMENTS[3].color} 180deg 240deg,
                      ${WHEEL_SEGMENTS[4].color} 240deg 300deg,
                      ${WHEEL_SEGMENTS[5].color} 300deg 360deg
                    )`,
                  }}
                >
                  {/* Segment labels — chunky bold, emoji + text */}
                  {WHEEL_SEGMENTS.map((seg, i) => {
                    const baseAngle = 30 + i * 60
                    return (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 w-[32%] origin-center text-center pointer-events-none"
                        style={{
                          transform: `rotate(${baseAngle}deg) translateY(-52%)`,
                        }}
                      >
                        <span
                          className="inline-block font-black text-slate-900 text-[10px] sm:text-xs uppercase tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]"
                          style={{ transform: `rotate(${-baseAngle}deg)` }}
                        >
                          {seg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {/* Center: large white circle with star */}
                <div className="absolute inset-[18%] rounded-full bg-white border-4 border-slate-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.2)] flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl" aria-hidden>⭐</span>
                </div>
                {/* Pointer: thick white downward triangle (plastic look) */}
                <div
                  className="absolute left-1/2 top-0 w-0 h-0 -translate-x-1/2 -translate-y-0.5 z-10"
                  style={{
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderTop: 'none',
                    borderBottom: '36px solid white',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
                  }}
                  aria-hidden
                />
              </div>

          <p className="mt-4 font-mono text-xs text-slate-400 uppercase tracking-wider">
            {userName} · испытай удачу
          </p>

          {!wonPrize && (
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning}
              className={cn(
                'mt-6 min-h-[56px] px-10 py-3 rounded-xl font-black text-base uppercase tracking-widest border-4 border-white/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2),0_6px_16px_rgba(0,0,0,0.3)] transition touch-manipulation',
                spinning
                  ? 'bg-slate-500 text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-400 hover:scale-105 active:scale-100 animate-pulse'
              )}
            >
              {spinning ? 'Крутится...' : 'ИСПЫТАТЬ УДАЧУ'}
            </button>
          )}

          {wonPrize && (
            <div
              className="mt-6 p-6 rounded-2xl border-4 border-yellow-400 bg-slate-800/95 text-center shadow-[0_0_24px_rgba(250,204,21,0.3)] animate-wheel-result"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400 mb-2">
                Ты выиграл
              </p>
              <p className="font-black text-xl sm:text-2xl text-white break-words">
                {wonPrize.emoji && <span className="mr-2">{wonPrize.emoji}</span>}
                {wonPrize.label}
              </p>
              <button
                type="button"
                onClick={closeResult}
                className="mt-4 min-h-[44px] px-6 rounded-lg font-black text-sm uppercase bg-green-500 text-white border-2 border-white/80 hover:bg-green-400 transition"
              >
                ОК
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      <Confetti active={confetti} onDone={() => setConfetti(false)} />
    </>
  )
}
