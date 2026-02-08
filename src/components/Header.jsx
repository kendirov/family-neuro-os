import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const LONG_PRESS_MS = 800

/** Display order: Mon–Sun. getDay(): 0=Sun, 1=Mon, …, 6=Sat */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

function formatTimeHHMM(date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateShort(date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function Header() {
  const [now, setNow] = useState(() => new Date())
  const users = useAppStore((s) => s.users)
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
  const statusLabel = weekend ? 'ВЫХОДНОЙ' : 'БУДНИ'

  const roma = users?.find((u) => u.id === 'roma')
  const kirill = users?.find((u) => u.id === 'kirill')

  return (
    <header className="command-bridge shrink-0" role="banner">
      <div className="command-bridge-glass flex w-full items-center gap-4 px-3 py-2.5 md:px-4 md:py-3">
        {/* Left: Week Strip — fixed Mon–Sun */}
        <div className="week-strip flex shrink-0 items-center gap-0.5 rounded-xl border border-slate-600/50 bg-slate-900/60 px-1.5 py-1.5">
          {DAY_ORDER.map((d) => {
            const isWeekend = d === 0 || d === 6
            const isActive = d === dayIndex
            return (
              <div
                key={d}
                className={cn(
                  'week-slot flex min-w-[28px] justify-center rounded-lg px-1 py-1 font-lcd text-xs font-bold tabular-nums transition-colors sm:min-w-[32px] sm:text-sm',
                  isActive && 'week-slot-active',
                  !isActive && isWeekend && 'week-slot-weekend',
                  !isActive && !isWeekend && 'week-slot-weekday'
                )}
                aria-current={isActive ? 'date' : undefined}
              >
                {DAY_LABELS[DAY_ORDER.indexOf(d)]}
              </div>
            )
          })}
        </div>

        {/* Center: Total XP summary — mini-badges */}
        <div className="xp-summary flex flex-1 justify-center gap-2 sm:gap-3">
          {roma != null && (
            <span className="xp-badge flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-cyan-300 sm:text-xs">
              <span className="uppercase tracking-wider text-cyan-400/90">Рома</span>
              <span className="font-lcd">{roma.balance ?? 0}</span>
            </span>
          )}
          {kirill != null && (
            <span className="xp-badge flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-500/15 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-purple-300 sm:text-xs">
              <span className="uppercase tracking-wider text-purple-400/90">Кирилл</span>
              <span className="font-lcd">{kirill.balance ?? 0}</span>
            </span>
          )}
        </div>

        {/* Right: Clock, Date, Status, Lock */}
        <div className="status-bar flex shrink-0 items-center gap-2 md:gap-3">
          <span
            className="status-label hidden rounded border border-slate-600/60 bg-slate-800/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:inline"
            title={weekend ? 'Выходной — без лимита' : 'Будни — лимит 1 ч'}
          >
            {statusLabel}
          </span>
          <time
            dateTime={now.toISOString()}
            className="command-bridge-clock font-lcd text-lg font-bold tabular-nums text-cyan-300/95 sm:text-xl"
          >
            {formatTimeHHMM(now)}
          </time>
          <span className="command-bridge-date hidden font-mono text-[10px] tabular-nums text-slate-500 sm:inline md:text-xs">
            {formatDateShort(now)}
          </span>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-slate-600/80 bg-slate-800/80 text-slate-300 transition hover:border-slate-500 hover:text-slate-100 touch-manipulation select-none icon-pop"
            aria-label={panelLocked ? 'Панель заблокирована — долгое нажатие для разблокировки' : 'Панель разблокирована — долгое нажатие для блокировки'}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerUp}
            onContextMenu={handleContextMenu}
          >
            {panelLocked ? <Lock className="h-4 w-4" strokeWidth={2.5} /> : <Unlock className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </header>
  )
}
