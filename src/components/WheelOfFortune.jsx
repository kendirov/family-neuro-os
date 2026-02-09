import { useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { PilotAvatar } from '@/components/HelmetAvatar'

// Safe import with fallback to prevent crashes
import { WHEEL_ITEMS as IMPORTED_WHEEL_ITEMS, spinWheel as importedSpinWheel, generateWheelSegments as importedGenerateWheelSegments } from '@/data/WheelData'

// Fallback items in case import fails or is empty
const FALLBACK_WHEEL_ITEMS = [
  { id: 'default', label: '50 XP', type: 'xp', value: 50, weight: 1, color: '#3b82f6', icon: '⚡' }
]

// Ensure we always have valid data
const WHEEL_ITEMS = (IMPORTED_WHEEL_ITEMS && IMPORTED_WHEEL_ITEMS.length > 0) 
  ? IMPORTED_WHEEL_ITEMS 
  : FALLBACK_WHEEL_ITEMS

const spinWheel = importedSpinWheel || ((items) => items && items.length > 0 ? items[0] : FALLBACK_WHEEL_ITEMS[0])
const generateWheelSegments = importedGenerateWheelSegments || (() => [])

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
  const addWheelSpin = useAppStore((s) => s.addWheelSpin)
  const spinsUsedTodayRaw = useAppStore((s) => s.spinsUsedToday)
  const spinHistory = useAppStore((s) => s.spinHistory ?? [])
  
  // Safety check: ensure spinsUsedToday is always an object with safe defaults
  const spinsUsedToday = spinsUsedTodayRaw && typeof spinsUsedTodayRaw === 'object' 
    ? spinsUsedTodayRaw 
    : { date: new Date().toISOString().slice(0, 10), roma: 0, kirill: 0 }

  const [activePilot, setActivePilot] = useState('kirill')
  const [spinning, setSpinning] = useState(false)
  const [wonPrize, setWonPrize] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => {
    if (open) {
      setActivePilot('kirill')
      setWonPrize(null)
      setConfetti(false)
    }
  }, [open])

  const userId = activePilot
  const userName = activePilot === 'roma' ? 'Рома' : 'Кирилл'

  // Safe access to spinsUsedToday with fallbacks
  const spinsForPilot = spinsUsedToday?.[activePilot] ?? 0
  const maxSpinsPerDay = 3
  const spinsLeft = Math.max(0, maxSpinsPerDay - spinsForPilot)
  const limitReached = spinsLeft <= 0

  const handleClose = useCallback(() => {
    setActivePilot('kirill')
    setWonPrize(null)
    setConfetti(false)
    onClose()
  }, [onClose])

  const handleSpin = useCallback(() => {
    if (spinning || !userId || limitReached || !WHEEL_ITEMS || WHEEL_ITEMS.length === 0) return
    if (!spinWheel) {
      console.error('[WheelOfFortune] spinWheel function not available')
      return
    }
    
    setSpinning(true)
    setWonPrize(null)

    // Use weighted random selection from config (with safety check)
    const prize = spinWheel(WHEEL_ITEMS) || WHEEL_ITEMS[0]
    if (!prize) {
      console.error('[WheelOfFortune] No prize selected, aborting spin')
      setSpinning(false)
      return
    }
    
    // Geometry: equal-sized segments for ALL items (visual size != drop chance)
    const segmentsCount = Math.max(1, WHEEL_ITEMS.length) // Prevent division by zero
    const segmentAngle = 360 / segmentsCount
    const winningIndex = WHEEL_ITEMS.findIndex((item) => item && item.id === prize.id)
    const safeIndex = winningIndex >= 0 ? winningIndex : 0
    
    const extraTurns = 4 + Math.random() * 2
    // Target: center of winning segment under the pointer (top).
    const targetAngle =
      360 - safeIndex * segmentAngle - segmentAngle / 2
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.3) // small jitter inside slice
    const finalDeg = rotation + 360 * extraTurns + targetAngle + randomOffset

    setRotation(finalDeg)

    const spinDuration = 4000
    const timer = setTimeout(() => {
      setSpinning(false)
      setWonPrize(prize)
      setConfetti(true)

      // Handle different prize types
      let desc = `🎰 Выигрыш: ${prize.label}`
      if (prize.type === 'xp') {
        desc += ` (+${prize.value} XP)`
        logWheelWin(userId, desc)
        addPoints(userId, prize.value, `🎰 Выигрыш: ${prize.label}`)
      } else if (prize.type === 'item') {
        desc += ` (${prize.value})`
        logWheelWin(userId, desc)
        // Items are manual rewards - just log, don't auto-add
      } else if (prize.type === 'penalty') {
        desc += ` (${prize.value})`
        logWheelWin(userId, desc)
        // Penalties are fun/joke items - just log
      } else {
        logWheelWin(userId, desc)
      }

      // Track spin usage and history (per-pilot + global)
      addWheelSpin(userId, prize)
    }, spinDuration)

    return () => clearTimeout(timer)
  }, [userId, spinning, rotation, addPoints, logWheelWin, addWheelSpin, limitReached])

  const closeResult = () => {
    setWonPrize(null)
    setConfetti(false)
    handleClose()
  }

  if (!open) return null

  // Safety check: ensure WHEEL_ITEMS is available
  if (!WHEEL_ITEMS || WHEEL_ITEMS.length === 0) {
    console.error('[WheelOfFortune] WHEEL_ITEMS is empty, cannot render')
    return null
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        onClick={wonPrize ? closeResult : undefined}
        role="dialog"
        aria-modal="true"
        aria-label="Колесо фортуны"
      >
        <div
          className="relative bg-slate-900 border-4 border-blue-600 rounded-2xl p-8 shadow-2xl transform transition-all flex flex-col items-center w-full max-w-md animate-bounce-in"
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

          {/* Header: pilot toggle + remaining spins */}
          <div className="w-full mb-4 flex flex-col gap-3 items-stretch">
            <h2 className="font-gaming text-xl sm:text-2xl font-black uppercase tracking-widest text-white text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              ПОЛЕ ЧУДЕС
            </h2>
            <div className="flex items-center justify-between gap-3">
              {/* Pilot toggle */}
              <div className="flex flex-1 gap-2">
                <button
                  type="button"
                  onClick={() => !spinning && setActivePilot('kirill')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 font-gaming text-xs sm:text-sm font-bold uppercase tracking-wider transition-all touch-manipulation',
                    activePilot === 'kirill'
                      ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'border-slate-600 bg-slate-800/80 text-slate-400 hover:border-slate-500 hover:scale-105 active:scale-95',
                    spinning && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={spinning}
                >
                  <PilotAvatar pilotId="kirill" size="chip" />
                  <span>КИРИЛЛ</span>
                </button>
                <button
                  type="button"
                  onClick={() => !spinning && setActivePilot('roma')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 font-gaming text-xs sm:text-sm font-bold uppercase tracking-wider transition-all touch-manipulation',
                    activePilot === 'roma'
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                      : 'border-slate-600 bg-slate-800/80 text-slate-400 hover:border-slate-500 hover:scale-105 active:scale-95',
                    spinning && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={spinning}
                >
                  <PilotAvatar pilotId="roma" size="chip" />
                  <span>РОМА</span>
                </button>
              </div>
              {/* Spins left */}
              <div className="px-3 py-2 rounded-xl border-2 border-amber-400/70 bg-amber-500/10 text-amber-200 font-mono text-[11px] uppercase tracking-wider text-center min-w-[110px]">
                Осталось: <span className="font-bold">{spinsLeft}</span>/<span>{maxSpinsPerDay}</span>
              </div>
            </div>
          </div>

          {/* Wheel spin */}
          <>

              {/* Wheel — lootbox style: 6 segments, thick border, labels + emojis */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex-shrink-0">
                <div
                  className={cn(
                    'absolute inset-0 rounded-full border-4 border-white shadow-[0_0_0_4px_rgba(30,64,175,0.6),0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden',
                    spinning && 'transition-transform duration-[4000ms] ease-out'
                  )}
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transitionProperty: spinning ? 'transform' : 'none',
                  }}
                >
                  {/* Equal-sized slices for ALL items: visual fairness, math driven by weight */}
                  {WHEEL_ITEMS.map((item, index) => {
                    if (!item || !item.id) {
                      console.warn('[WheelOfFortune] Invalid item at index', index)
                      return null
                    }
                    const angle = 360 / WHEEL_ITEMS.length
                    const rotate = index * angle
                    return (
                      <div
                        key={item.id || `item-${index}`}
                        className="absolute left-1/2 top-1/2 w-1/2 h-1/2 origin-left"
                        style={{
                          transform: `rotate(${rotate}deg)`,
                        }}
                      >
                        {/* Slice background */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundColor: item.color || '#3b82f6',
                            clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)',
                          }}
                        />
                        {/* Label (rotated back to be readable) */}
                        <div
                          className="absolute left-[45%] top-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
                          style={{ transform: `rotate(${angle / 2}deg)` }}
                        >
                          <span className="text-lg sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                            {item.icon || '🎁'}
                          </span>
                          <span className="font-gaming text-[9px] sm:text-[10px] font-bold uppercase tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] max-w-[80px] leading-tight">
                            {item.label || 'Приз'}
                          </span>
                        </div>
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
            <>
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || limitReached}
                className={cn(
                  'mt-6 min-h-[56px] px-10 py-3 rounded-xl font-black text-base uppercase tracking-widest border-4 border-white/90 shadow-[0_4px_0_0_rgba(0,0,0,0.2),0_6px_16px_rgba(0,0,0,0.3)] transition touch-manipulation',
                  spinning
                    ? 'bg-slate-500 text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed'
                    : limitReached
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-400 hover:scale-105 active:scale-100 animate-pulse'
                )}
              >
                {spinning ? 'Крутится...' : 'ИСПЫТАТЬ УДАЧУ'}
              </button>
              {limitReached && (
                <p className="mt-2 font-mono text-[11px] text-red-400 uppercase tracking-wider text-center">
                  Лимит на сегодня исчерпан!
                </p>
              )}
            </>
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
                {wonPrize.icon && <span className="mr-2">{wonPrize.icon}</span>}
                {wonPrize.label}
              </p>
              {wonPrize.type === 'item' && (
                <p className="mt-2 text-sm text-slate-300">{wonPrize.value}</p>
              )}
              {wonPrize.type === 'penalty' && (
                <p className="mt-2 text-sm text-yellow-300">😄 {wonPrize.value}</p>
              )}
              <button
                type="button"
                onClick={closeResult}
                className="mt-4 min-h-[44px] px-6 rounded-lg font-black text-sm uppercase bg-green-500 text-white border-2 border-white/80 hover:bg-green-400 transition"
              >
                ОК
              </button>
            </div>
          )}

          {/* History section: last prizes for each pilot */}
          <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-600/70 bg-slate-900/80 p-3">
              <p className="font-gaming text-xs text-purple-300 uppercase tracking-wider mb-2">
                Кирилл: последние призы
              </p>
              <ul className="space-y-1 text-xs text-slate-200">
                {spinHistory
                  .filter((h) => h.pilotId === 'kirill')
                  .slice(-3)
                  .reverse()
                  .map((h, idx) => (
                    <li key={`${h.timestamp}-${idx}`} className="flex items-center gap-2">
                      <span className="text-base">{h.icon ?? '🎁'}</span>
                      <span className="truncate">{h.itemName}</span>
                    </li>
                  ))}
                {spinHistory.filter((h) => h.pilotId === 'kirill').length === 0 && (
                  <li className="text-slate-500 text-[11px]">Пока нет выигрышей</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-600/70 bg-slate-900/80 p-3">
              <p className="font-gaming text-xs text-cyan-300 uppercase tracking-wider mb-2">
                Рома: последние призы
              </p>
              <ul className="space-y-1 text-xs text-slate-200">
                {spinHistory
                  .filter((h) => h.pilotId === 'roma')
                  .slice(-3)
                  .reverse()
                  .map((h, idx) => (
                    <li key={`${h.timestamp}-${idx}`} className="flex items-center gap-2">
                      <span className="text-base">{h.icon ?? '🎁'}</span>
                      <span className="truncate">{h.itemName}</span>
                    </li>
                  ))}
                {spinHistory.filter((h) => h.pilotId === 'roma').length === 0 && (
                  <li className="text-slate-500 text-[11px]">Пока нет выигрышей</li>
                )}
              </ul>
            </div>
          </div>

          </>
        </div>
      </div>

      <Confetti active={confetti} onDone={() => setConfetti(false)} />
    </>
  )
}
