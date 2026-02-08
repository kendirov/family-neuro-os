import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const LONG_PRESS_MS = 800

const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function formatTime(date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDate(date) {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function Header() {
  const [now, setNow] = useState(() => new Date())
  const panelLocked = useAppStore((s) => s.panelLocked)
  const setPanelLocked = useAppStore((s) => s.setPanelLocked)
  const longPressTimerRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handlePointerDown = () => {
    clearLongPress()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      setPanelLocked(!panelLocked)
    }, LONG_PRESS_MS)
  }

  const handlePointerUp = () => clearLongPress()
  const handlePointerLeave = () => clearLongPress()
  const handleContextMenu = (e) => e.preventDefault()

  const dayIndex = now.getDay()
  const weekend = dayIndex === 0 || dayIndex === 6

  return (
    <header
      className="h-[60px] flex items-center justify-between px-4 md:px-6 shrink-0 border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-md"
      role="banner"
    >
      {/* Left: app title */}
      <span className="font-mono text-sm md:text-base font-medium tracking-tight text-slate-400">
        ТУРБО-ГАРАЖ v2.7
      </span>

      {/* Right: time, day, date, label + lock */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <time
            dateTime={now.toISOString()}
            className="font-lcd text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums text-cyan-400/95 clock-glow"
          >
            {formatTime(now)}
          </time>
          <div className="flex flex-col items-end">
            <span
              className={cn(
                'font-mono text-xs font-semibold uppercase tracking-wider',
                weekend ? 'text-emerald-400' : 'text-slate-400'
              )}
            >
              {DAY_NAMES_RU[dayIndex]}
            </span>
            <span className="font-mono text-[10px] text-slate-500 tabular-nums">
              {formatDate(now)}
            </span>
          </div>
          <span
            className={cn(
              'font-mono text-[10px] font-medium uppercase tracking-wider whitespace-nowrap',
              weekend ? 'text-emerald-400/90' : 'text-slate-500'
            )}
          >
            {weekend ? 'ВЫХОДНОЙ 🏖' : 'БУДНИ 🏫'}
          </span>
        </div>

        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-2xl border-[3px] border-slate-600/80 bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition touch-manipulation select-none icon-pop"
          aria-label={panelLocked ? 'Панель заблокирована — долгое нажатие для разблокировки' : 'Панель разблокирована — долгое нажатие для блокировки'}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerUp}
          onContextMenu={handleContextMenu}
        >
          {panelLocked ? <Lock className="w-5 h-5" strokeWidth={2.5} /> : <Unlock className="w-5 h-5" strokeWidth={2.5} />}
        </button>
      </div>
    </header>
  )
}
