import { useState, useEffect, useRef } from 'react'
import { Gamepad2, Tv } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playSiren, playError, playCashRegister } from '@/lib/sounds'
import { cn } from '@/lib/utils'

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Format minutes as "1ч 20м" or "45м". */
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}м`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}ч ${m}м` : `${h}ч`
}

/** Elapsed seconds → "00:15:32" or "01:05:00". */
function formatElapsedHMS(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 0 = Sun … 6 = Sat. Weekday = Mon–Fri. */
function isWeekday() {
  const d = new Date().getDay()
  return d >= 1 && d <= 5
}

/** Credits burned for elapsed seconds. Weekday: 1 cr/min first 60 min, then 2 cr/min. Weekend: 1 cr/min. */
function creditsBurnedAt(elapsedSeconds, weekday) {
  const minutes = Math.floor(elapsedSeconds / 60)
  if (!weekday) return minutes
  if (minutes <= 60) return minutes
  return 60 + (minutes - 60) * 2
}

/** Current burn rate: 1 or 2 (overdrive on weekday when elapsed >= 60 min). */
function currentBurnRate(elapsedSeconds, weekday) {
  if (!weekday) return 1
  return Math.floor(elapsedSeconds / 60) >= 60 ? 2 : 1
}

const PILOT_OPTIONS = [
  { id: 'roma', label: 'РОМА', glow: 'cyan' },
  { id: 'kirill', label: 'КИРИЛЛ', glow: 'purple' },
]

const GAME_MODES = [
  { id: 'game', label: 'ИГРА', Icon: Gamepad2, reason: 'Игровое время' },
  { id: 'youtube', label: 'YOUTUBE / МУЛЬТИКИ', Icon: Tv, reason: 'YouTube / Мультики' },
]

/** Max minutes for "burning fuse" bar scale (visual only). */
const FUSE_BAR_MAX_MIN = 120

export function GamingTimerWidget() {
  const users = useAppStore((s) => s.users)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const addGamingMinutesToday = useAppStore((s) => s.addGamingMinutesToday)
  const gamingToday = useAppStore((s) => s.gamingToday)

  const [gameMode, setGameMode] = useState('game')
  const [activePilots, setActivePilots] = useState([]) // ['roma'] | ['kirill'] | ['roma','kirill'] | []
  const [status, setStatus] = useState('idle') // 'idle' | 'running' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionSummary, setSessionSummary] = useState(null) // { totalTime, totalCost } when finish modal shown

  const intervalRef = useRef(null)
  const sirenPlayedRef = useRef(false)

  const selectedUserIds = activePilots
  const weekday = isWeekday()
  const reason = GAME_MODES.find((m) => m.id === gameMode)?.reason ?? 'Игровое время'

  const canStart =
    selectedUserIds.length > 0 &&
    selectedUserIds.every((id) => {
      const u = users.find((x) => x.id === id)
      return u && u.balance >= 1
    })

  const togglePilot = (id) => {
    if (id === 'roma' || id === 'kirill') {
      setActivePilots((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      )
    }
  }

  const toggleBoth = () => {
    const bothOn = activePilots.length === 2
    setActivePilots(bothOn ? [] : ['roma', 'kirill'])
  }

  const totalCreditsBurned = creditsBurnedAt(elapsedSeconds, weekday)
  const burnRate = currentBurnRate(elapsedSeconds, weekday)
  const isOverdrive = weekday && Math.floor(elapsedSeconds / 60) >= 60
  const isActive = status === 'running' || status === 'paused'

  const startEngine = () => {
    if (status !== 'idle' || !canStart) return
    playEngineRev()
    setElapsedSeconds(0)
    sirenPlayedRef.current = false
    setStatus('running')
  }

  const pauseEngine = () => {
    if (status !== 'running') return
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStatus('paused')
  }

  const resumeEngine = () => {
    if (status !== 'paused') return
    setStatus('running')
  }

  const finishEngine = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const totalCost = totalCreditsBurned
    const totalMinutes = Math.floor(elapsedSeconds / 60)
    if (totalCost > 0) {
      selectedUserIds.forEach((id) => spendPoints(id, totalCost, reason))
      addGamingMinutesToday(totalMinutes)
    }
    playCashRegister()
    const totalTime = formatDuration(totalMinutes)
    setSessionSummary({ totalTime, totalCost })
    setStatus('idle')
    setElapsedSeconds(0)
    sirenPlayedRef.current = false
  }

  /** Timer tick: count up every second only when running. */
  useEffect(() => {
    if (status !== 'running') return
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  /** Sync on Stop only: no per-minute DB writes. Check for insufficient balance (would go negative after session). */
  useEffect(() => {
    if (status !== 'running') return
    const currentUsers = useAppStore.getState().users
    const wouldGoNegative = selectedUserIds.some((id) => {
      const u = currentUsers.find((x) => x.id === id)
      return u && u.balance < totalCreditsBurned
    })
    if (wouldGoNegative) {
      playError()
      if (intervalRef.current) clearInterval(intervalRef.current)
      setStatus('idle')
      setElapsedSeconds(0)
      sirenPlayedRef.current = false
    }
  }, [elapsedSeconds, status, selectedUserIds, totalCreditsBurned])

  useEffect(() => {
    if (isOverdrive && !sirenPlayedRef.current) {
      playSiren()
      sirenPlayedRef.current = true
    }
  }, [isOverdrive])

  const fusePercent = Math.min(100, (Math.floor(elapsedSeconds / 60) / FUSE_BAR_MAX_MIN) * 100)

  return (
    <div className="rounded-xl border-2 border-slate-700 bg-slate-900/50 p-3 sm:p-4 shrink-0 flex flex-col gap-4">
      <h3 className="font-mono text-xs text-slate-400 uppercase tracking-wider">
        ДВИГАТЕЛЬ СЖИГАНИЯ
      </h3>

      {/* Game Mode Selector: ИГРА | YOUTUBE / МУЛЬТИКИ */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">Режим</p>
        <div className="flex gap-2">
          {GAME_MODES.map((mode) => {
            const Icon = mode.Icon
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setGameMode(mode.id)}
                disabled={isActive}
                className={cn(
                  'flex-1 min-h-[44px] rounded-xl border-2 font-mono text-sm font-bold uppercase transition touch-manipulation flex items-center justify-center gap-1.5',
                  gameMode === mode.id
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white disabled:opacity-60'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate">{mode.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pilot: РОМА | КИРИЛЛ (toggle) | ОБА (both on/off) */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">Пилот</p>
        <div className="flex gap-2">
          {PILOT_OPTIONS.map((opt) => {
            const isOn = activePilots.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => togglePilot(opt.id)}
                disabled={isActive}
                className={cn(
                  'flex-1 min-h-[40px] rounded-lg border-2 font-mono text-xs font-bold uppercase transition touch-manipulation',
                  isOn && opt.glow === 'cyan' &&
                    'border-cyan-500 bg-cyan-500/25 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]',
                  isOn && opt.glow === 'purple' &&
                    'border-purple-500 bg-purple-500/25 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]',
                  !isOn && 'border-slate-600 bg-slate-800/50 text-slate-500 opacity-75 hover:opacity-90 hover:border-slate-500 disabled:opacity-60'
                )}
              >
                {opt.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={toggleBoth}
            disabled={isActive}
            className={cn(
              'flex-1 min-h-[40px] rounded-lg border-2 font-mono text-xs font-bold uppercase transition touch-manipulation',
              activePilots.length === 2
                ? 'border-amber-500/80 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'border-slate-600 bg-slate-800/50 text-slate-500 opacity-75 hover:opacity-90 hover:border-slate-500 disabled:opacity-60'
            )}
          >
            ОБА
          </button>
        </div>
      </div>

      {/* Controls: [ ▶ СТАРТ ] | [ ⏸ ПАУЗА ] [ ⏹ ЗАВЕРШИТЬ ] */}
      <div className="flex flex-col gap-2">
        {status === 'idle' && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={startEngine}
              disabled={!canStart}
              className={cn(
                'w-full font-lcd font-bold uppercase tracking-widest py-5 sm:py-6 text-xl sm:text-2xl md:text-3xl rounded-2xl border-[3px] transition touch-manipulation animate-heartbeat',
                canStart ? 'btn-push-start' : 'border-slate-700 bg-slate-800/60 text-slate-500 cursor-not-allowed'
              )}
            >
              ▶ СТАРТ
            </button>
            {selectedUserIds.length === 0 && (
              <p className="font-mono text-[10px] text-red-400 uppercase text-center">
                ВЫБЕРИТЕ ПИЛОТА
              </p>
            )}
          </div>
        )}
        {status === 'running' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={pauseEngine}
              className="flex-1 min-h-[56px] sm:min-h-[64px] rounded-xl border-2 border-amber-500/80 bg-amber-500/25 font-mono font-bold text-amber-200 uppercase hover:bg-amber-500/35 active:scale-[0.98] transition touch-manipulation flex items-center justify-center gap-2"
            >
              <span aria-hidden>⏸</span> ПАУЗА
            </button>
            <button
              type="button"
              onClick={finishEngine}
              className="flex-1 min-h-[56px] sm:min-h-[64px] rounded-xl border-2 border-red-500/80 bg-red-500/25 font-mono font-bold text-red-200 uppercase hover:bg-red-500/35 active:scale-[0.98] transition touch-manipulation flex items-center justify-center gap-2 btn-push-stop"
            >
              <span aria-hidden>⏹</span> ЗАВЕРШИТЬ
            </button>
          </div>
        )}
        {status === 'paused' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resumeEngine}
              className="flex-1 min-h-[56px] sm:min-h-[64px] rounded-xl border-2 border-emerald-500/80 bg-emerald-500/25 font-mono font-bold text-emerald-200 uppercase hover:bg-emerald-500/35 active:scale-[0.98] transition touch-manipulation flex items-center justify-center gap-2"
            >
              <span aria-hidden>▶</span> ПРОДОЛЖИТЬ
            </button>
            <button
              type="button"
              onClick={finishEngine}
              className="flex-1 min-h-[56px] sm:min-h-[64px] rounded-xl border-2 border-red-500/80 bg-red-500/25 font-mono font-bold text-red-200 uppercase hover:bg-red-500/35 active:scale-[0.98] transition touch-manipulation flex items-center justify-center gap-2"
            >
              <span aria-hidden>⏹</span> ЗАВЕРШИТЬ
            </button>
          </div>
        )}
      </div>

      {/* When engine ON or paused: Burning Fuse + CURRENT COST + TIME ELAPSED */}
      {(status === 'running' || status === 'paused') && (
        <div className="rounded-xl border-2 border-slate-700/80 bg-slate-900/80 p-3 sm:p-4 space-y-3">
          {/* TIME ELAPSED — big digital */}
          <div>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              ВРЕМЯ
            </p>
            <div
              className={cn(
                'font-lcd text-3xl sm:text-4xl md:text-5xl tabular-nums rounded-lg border-2 px-4 py-3 text-center',
                isOverdrive ? 'timer-overdrive animate-burn-pulse' : 'bg-slate-800/90 border-slate-600 text-cyan-400'
              )}
            >
              {isOverdrive && <span className="mr-1" aria-hidden>🔥</span>}
              <span className="clock-glow">{formatElapsedHMS(elapsedSeconds)}</span>
              {isOverdrive && <span className="ml-1" aria-hidden>🔥</span>}
            </div>
          </div>

          {/* OVERDRIVE X2 warning */}
          {isOverdrive && (
            <p className="font-mono text-center text-amber-400 font-bold uppercase text-sm animate-burn-pulse">
              ⚠ OVERDRIVE ×2
            </p>
          )}

          {/* Burning Fuse — bar that fills with red/orange */}
          <div>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
              ФУЗА
            </p>
            <div className="h-3 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600"
                style={{ width: `${fusePercent}%` }}
              />
            </div>
          </div>

          {/* CURRENT COST — real-time "-15 kr" */}
          <div className="rounded-lg border-2 border-red-500/40 bg-slate-900/90 px-3 py-2.5">
            <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">
              СТОИМОСТЬ СЕССИИ
            </p>
            <p className="font-lcd text-xl sm:text-2xl font-bold tabular-nums text-red-400">
              −{totalCreditsBurned} кр
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-2 text-center">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">РАСХОД</p>
              <p
                className={cn(
                  'font-lcd text-sm font-bold tabular-nums',
                  isOverdrive ? 'text-red-400' : 'text-slate-300'
                )}
              >
                {burnRate} кр/мин
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-2 text-center">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">СЕГОДНЯ</p>
              <p className="font-lcd text-sm font-bold tabular-nums text-cyan-400">
                {formatDuration(
                  gamingToday?.dateKey === getDateKey() ? gamingToday?.minutes ?? 0 : 0
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'idle' && selectedUserIds.length > 0 && !canStart && (
        <p className="font-mono text-red-400 text-xs uppercase">
          Недостаточно кредитов (минимум 1 кр)
        </p>
      )}

      {/* Finish modal */}
      {sessionSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-end-title"
        >
          <div className="bg-slate-900 border-2 border-slate-600 rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h2 id="session-end-title" className="font-blocky text-xl text-white uppercase mb-4">
              Сессия завершена
            </h2>
            <p className="font-mono text-slate-400 text-sm mb-1">Время</p>
            <p className="font-lcd text-2xl font-bold text-cyan-400 mb-4">
              {sessionSummary.totalTime}
            </p>
            <p className="font-mono text-slate-400 text-sm mb-1">Списано</p>
            <p className="font-lcd text-2xl font-bold text-red-400 mb-6">
              −{sessionSummary.totalCost} кр
            </p>
            <button
              type="button"
              onClick={() => setSessionSummary(null)}
              className="w-full min-h-[48px] rounded-xl border-2 border-cyan-500/70 bg-cyan-500/20 font-mono font-bold text-cyan-300 uppercase hover:bg-cyan-500/30 transition touch-manipulation"
            >
              ОК
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
