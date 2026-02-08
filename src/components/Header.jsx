import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

const LONG_PRESS_MS = 800

function formatTime(date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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

  return (
    <header className="flex items-center justify-between px-4 py-3 md:px-6 border-b border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg md:text-xl font-semibold tracking-tight text-white">
          ТУРБО-ГАРАЖ v2.6
        </span>
        <span className="hidden sm:inline font-mono text-xs text-success/80 ml-1" aria-hidden>
          ● СИСТЕМА В НОРМЕ
        </span>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <time
          dateTime={now.toISOString()}
          className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold tabular-nums text-cyan-400 clock-glow"
        >
          {formatTime(now)}
        </time>
      </div>

      {/* Parent panel lock: long-press to toggle */}
      <button
        type="button"
        className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition touch-manipulation select-none"
        aria-label={panelLocked ? 'Панель заблокирована — долгое нажатие для разблокировки' : 'Панель разблокирована — долгое нажатие для блокировки'}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        {panelLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
      </button>
    </header>
  )
}
