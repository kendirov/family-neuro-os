import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Tv, Flame } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playCashRegister, playError, playBurnTick } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { PilotEngine } from '@/components/PilotEngine'
import { WheelBanner } from '@/components/WheelBanner'

const MODES = [
  { id: 'game', label: 'ИГРАТЬ', Icon: Gamepad2, color: 'blue' },
  { id: 'youtube', label: 'ЮТУБ / МУЛЬТИКИ', Icon: Tv, color: 'pink' },
]

const PILOT_IDS = ['roma', 'kirill']

/** Будни (Пн–Пт): до 1 ч — 1 кр/мин, после 1 ч — 2 кр/мин. Выходные — всегда 1 кр/мин. */
function isWeekday() {
  const d = new Date().getDay() // 0 = Sun, 6 = Sat
  return d >= 1 && d <= 5
}

/** Date key for today (YYYY-MM-DD). */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Reactor Core: heat gauge for total daily play time. Weekday: 0–45 зелёный, 45–60 жёлтый, 60+ красный пульс. Weekend: фиолет/золото. */
function ReactorCore() {
  const gamingToday = useAppStore((s) => s.gamingToday)
  const pilots = useAppStore((s) => s.pilots)
  const totalDailyMinutes = useMemo(() => {
    const today = getDateKey()
    const saved = gamingToday?.dateKey === today ? (gamingToday?.minutes ?? 0) : 0
    const roma = pilots?.roma?.sessionMinutes ?? 0
    const kirill = pilots?.kirill?.sessionMinutes ?? 0
    return saved + roma + kirill
  }, [gamingToday, pilots])

  const day = new Date().getDay()
  const isWeekend = day === 0 || day === 6
  const REACTOR_MAX_MIN = 60
  const fillPercent = Math.min(100, (totalDailyMinutes / REACTOR_MAX_MIN) * 100)

  let barBg = 'bg-cyan-500'
  let statusText = 'НОРМА'
  let statusClass = 'text-cyan-400'
  let overheat = false
  if (isWeekend) {
    barBg = 'bg-gradient-to-r from-violet-500 to-amber-500'
    statusText = 'РЕЖИМ: ВЫХОДНОЙ'
    statusClass = 'text-amber-300'
  } else {
    if (totalDailyMinutes >= 60) {
      barBg = 'bg-red-500'
      statusText = 'ПЕРЕГРЕВ! РАСХОД x2 🔥'
      statusClass = 'text-red-400'
      overheat = true
    } else if (totalDailyMinutes >= 45) {
      barBg = 'bg-gradient-to-r from-amber-400 to-orange-500'
      statusText = 'ВНИМАНИЕ'
      statusClass = 'text-amber-400'
    }
  }

  return (
    <div className="rounded-xl border-2 border-slate-600/70 bg-slate-800/90 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
      <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2">
        Реактор (время за день)
      </p>
      <div className="relative h-8 rounded-lg bg-slate-900/80 border border-slate-600/60 overflow-hidden">
        <motion.div
          className={cn(
            'reactor-core-bar absolute inset-y-0 left-0 rounded-lg',
            barBg,
            overheat && 'reactor-core-overheat'
          )}
          style={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.5 }}
        />
        <span
          className="absolute inset-y-0 flex items-center pointer-events-none transition-all duration-500 -translate-x-1/2"
          style={{ left: `${Math.min(100, Math.max(0, fillPercent))}%` }}
          aria-hidden
        >
          <Flame className="h-5 w-5 text-white/90 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" strokeWidth={2} />
        </span>
      </div>
      <p className={cn('font-lcd text-xs font-bold uppercase tracking-wider mt-1.5', statusClass)}>
        {statusText}
      </p>
      <p className="font-mono text-[10px] text-slate-500 tabular-nums mt-0.5">
        {totalDailyMinutes} мин / {REACTOR_MAX_MIN} мин
      </p>
    </div>
  )
}

/** Daily Flight Log: цифровая панель (LCD), колонки Рома/Кирилл, 🎮 Игра и 📺 Мультики. */
function DailyFlightLog() {
  const pilots = useAppStore((s) => s.pilots ?? {})
  const dailyGamingBreakdown = useAppStore((s) => s.dailyGamingBreakdown ?? {})

  const dailyStats = useMemo(() => {
    const state = useAppStore.getState()
    return state.getDisplayBreakdownToday()
  }, [pilots, dailyGamingBreakdown])

  const { game, youtube } = dailyStats

  return (
    <div className="rounded-2xl border-[3px] border-slate-600/80 bg-slate-900/95 overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.3)]">
      <h3 className="font-lcd text-[11px] text-slate-400 uppercase tracking-widest px-4 py-3 border-b-2 border-cyan-500/30 bg-slate-900/90 text-cyan-400/90">
        Бортжурнал за сегодня
      </h3>
      <div className="grid grid-cols-2 gap-0 font-lcd">
        <div className="border-r-2 border-slate-600/60 p-3 space-y-3 bg-slate-900/50">
          <p className="font-lcd text-xs text-cyan-400 uppercase tracking-wider mb-2">Рома</p>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">🎮</span>
            <span className="font-lcd text-[10px] uppercase text-slate-500">Игра</span>
            <span className="font-lcd text-base font-bold tabular-nums text-cyan-300 ml-auto drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">
              {(game?.roma ?? 0)} мин
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">📺</span>
            <span className="font-lcd text-[10px] uppercase text-slate-500">Мультики</span>
            <span className="font-lcd text-base font-bold tabular-nums text-pink-300 ml-auto drop-shadow-[0_0_6px_rgba(236,72,153,0.4)]">
              {(youtube?.roma ?? 0)} мин
            </span>
          </div>
        </div>
        <div className="p-3 space-y-3 bg-slate-900/50">
          <p className="font-lcd text-xs text-purple-400 uppercase tracking-wider mb-2">Кирилл</p>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">🎮</span>
            <span className="font-lcd text-[10px] uppercase text-slate-500">Игра</span>
            <span className="font-lcd text-base font-bold tabular-nums text-cyan-300 ml-auto drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]">
              {(game?.kirill ?? 0)} мин
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg">📺</span>
            <span className="font-lcd text-[10px] uppercase text-slate-500">Мультики</span>
            <span className="font-lcd text-base font-bold tabular-nums text-pink-300 ml-auto drop-shadow-[0_0_6px_rgba(236,72,153,0.4)]">
              {(youtube?.kirill ?? 0)} мин
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Control Center: Combustion Engine timer.
 * 1 Credit = 1 Minute (будни: после 60 мин — 2 кр/мин). Pilot toggles. Session summary on STOP.
 * Optional: wheelPilot, setWheelPilot, setWheelOpen for WheelBanner (always clickable; opens selector if no pilot).
 */
export function ControlCenter({ wheelPilot, setWheelPilot, setWheelOpen } = {}) {
  const users = useAppStore((s) => s.users)
  const pilots = useAppStore((s) => s.pilots)
  const updateSessionBurn = useAppStore((s) => s.updateSessionBurn)
  const getGamingMinutesToday = useAppStore((s) => s.getGamingMinutesToday)
  const startEngineStore = useAppStore((s) => s.startEngine)
  const pauseEngineStore = useAppStore((s) => s.pauseEngine)
  const resumeEngineStore = useAppStore((s) => s.resumeEngine)
  const stopEngineStore = useAppStore((s) => s.stopEngine)
  const setPilotSessionMinutes = useAppStore((s) => s.setPilotSessionMinutes)
  const updateLastBurnAt = useAppStore((s) => s.updateLastBurnAt)
  const setLastOfflineSyncToast = useAppStore((s) => s.setLastOfflineSyncToast)

  const [mode, setMode] = useState('game')
  const [tick, setTick] = useState(0)
  const [sessionCreditsBurned, setSessionCreditsBurned] = useState(0)

  const startTimeRef = useRef({ roma: 0, kirill: 0 })
  const pausedElapsedRef = useRef({ roma: 0, kirill: 0 })
  const lastDeductedMinuteRef = useRef({ roma: 0, kirill: 0 })
  const intervalRef = useRef(null)

  const anyRunning = (pilots?.roma?.status === 'RUNNING') || (pilots?.kirill?.status === 'RUNNING')

  /** Per-pilot elapsed: prefer startTimeRef when set (pause/resume), else drift-free from sessionStartAt (server). */
  const romaStartMs =
    startTimeRef.current.roma
      ? startTimeRef.current.roma
      : pilots?.roma?.sessionStartAt
        ? new Date(pilots.roma.sessionStartAt).getTime()
        : Date.now()
  const kirillStartMs =
    startTimeRef.current.kirill
      ? startTimeRef.current.kirill
      : pilots?.kirill?.sessionStartAt
        ? new Date(pilots.kirill.sessionStartAt).getTime()
        : Date.now()
  const romaElapsedSeconds =
    pilots?.roma?.status === 'RUNNING'
      ? (Date.now() / 1000 - romaStartMs / 1000) | 0
      : pilots?.roma?.status === 'PAUSED'
        ? (pausedElapsedRef.current.roma || 0) | 0
        : 0
  const kirillElapsedSeconds =
    pilots?.kirill?.status === 'RUNNING'
      ? (Date.now() / 1000 - kirillStartMs / 1000) | 0
      : pilots?.kirill?.status === 'PAUSED'
        ? (pausedElapsedRef.current.kirill || 0) | 0
        : 0

  const startBoth = () => {
    const bothCanStart =
      users.find((u) => u.id === 'roma')?.balance >= 1 && users.find((u) => u.id === 'kirill')?.balance >= 1
    if (!bothCanStart) {
      playError()
      return
    }
    playEngineRev()
    startEngineStore('roma', mode)
    startEngineStore('kirill', mode)
    startTimeRef.current.roma = Date.now()
    startTimeRef.current.kirill = Date.now()
    pausedElapsedRef.current = { roma: 0, kirill: 0 }
    lastDeductedMinuteRef.current = { roma: 0, kirill: 0 }
    setSessionCreditsBurned(0)
  }

  const pauseAll = () => {
    PILOT_IDS.forEach((id) => {
      if (pilots?.[id]?.status !== 'RUNNING') return
      const elapsed = (Date.now() - (startTimeRef.current[id] || Date.now())) / 1000 + (pausedElapsedRef.current[id] || 0)
      pausedElapsedRef.current[id] = elapsed
      pauseEngineStore(id)
    })
  }

  const onStartRefs = (id) => {
    startTimeRef.current[id] = Date.now()
    pausedElapsedRef.current[id] = 0
    lastDeductedMinuteRef.current[id] = 0
  }

  const onPause = (id) => {
    const elapsed = (Date.now() - (startTimeRef.current[id] || Date.now())) / 1000 + (pausedElapsedRef.current[id] || 0)
    pausedElapsedRef.current[id] = elapsed
  }

  const onResume = (id) => {
    startTimeRef.current[id] = Date.now() - (pausedElapsedRef.current[id] || 0) * 1000
  }

  const onStop = (id) => {
    startTimeRef.current[id] = 0
    pausedElapsedRef.current[id] = 0
    lastDeductedMinuteRef.current[id] = 0
  }

  /** Tick every 1000ms: drift-free elapsed from sessionStartAt (or startTimeRef); store session MINUTES for deduction. */
  useEffect(() => {
    if (!anyRunning) return
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1)
      PILOT_IDS.forEach((id) => {
        if (pilots?.[id]?.status !== 'RUNNING') return
        const p = pilots[id]
        const startMs = p?.sessionStartAt ? new Date(p.sessionStartAt).getTime() : (startTimeRef.current[id] || Date.now())
        const elapsedSeconds = (Date.now() - startMs) / 1000
        const rawMinutes = Math.floor(elapsedSeconds / 60)
        const cap = p?.sessionBalanceAtStart != null ? p.sessionBalanceAtStart : Infinity
        const sessionMinutes = Math.min(rawMinutes, cap)
        setPilotSessionMinutes(id, sessionMinutes)
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [anyRunning, setPilotSessionMinutes, pilots?.roma?.status, pilots?.kirill?.status, pilots?.roma?.sessionStartAt, pilots?.kirill?.sessionStartAt])

  /**
   * Per-MINUTE deduction only: for each RUNNING pilot, deduct 1 XP (or 2 on weekday overdrive) per elapsed minute.
   * Uses the ACTIVE session transaction ID (pilot.activeSessionId). We only UPDATE that single row via
   * updateSessionBurn — never create/insert a new transaction in this loop.
   * Weekend (Sat/Sun): rate is ALWAYS 1x. Safety: if balance <= 0, force stop engine.
   */
  useEffect(() => {
    PILOT_IDS.forEach((id) => {
      const p = pilots?.[id]
      if (p?.status !== 'RUNNING') return
      const currentMinute = p.sessionMinutes ?? 0
      const cap = p?.sessionBalanceAtStart != null ? p.sessionBalanceAtStart : Infinity
      if (currentMinute > cap) {
        playError()
        stopEngineStore(id)
        setLastOfflineSyncToast({ message: 'Двигатель остановлен: кончилось топливо (защита от минуса)' })
        lastDeductedMinuteRef.current[id] = 0
        return
      }
      const oldLast = lastDeductedMinuteRef.current[id] ?? 0
      if (currentMinute <= oldLast) return

      const state = useAppStore.getState()
      const user = state.users.find((x) => x.id === id)
      if (!user || user.balance < 1) {
        playError()
        stopEngineStore(id)
        lastDeductedMinuteRef.current[id] = 0
        return
      }

      const weekend = !isWeekday() // Sat/Sun: never overdrive, always 1 XP/min
      const maxMinute = Math.min(currentMinute, cap)
      let burned = 0
      for (let m = oldLast + 1; m <= maxMinute; m++) {
        const nowState = useAppStore.getState()
        const pilotUser = nowState.users.find((x) => x.id === id)
        if (!pilotUser || pilotUser.balance <= 0) {
          playError()
          stopEngineStore(id)
          lastDeductedMinuteRef.current[id] = oldLast
          return
        }
        const totalBeforeThisMinute = nowState.getGamingMinutesToday()
        const rate = weekend ? 1 : totalBeforeThisMinute + 1 > 60 ? 2 : 1
        const amount = Math.min(rate, pilotUser.balance)
        if (amount <= 0) break
        updateSessionBurn(id, amount, m, p.mode ?? 'game')
        burned += amount
      }
      if (burned > 0) playBurnTick()
      lastDeductedMinuteRef.current[id] = maxMinute
      setSessionCreditsBurned((prev) => prev + burned)
      updateLastBurnAt(id)
      if (maxMinute >= cap) {
        setLastOfflineSyncToast({ message: 'Двигатель остановлен: кончилось топливо (защита от минуса)' })
      }
    })
  }, [pilots?.roma?.sessionMinutes, pilots?.roma?.status, pilots?.kirill?.sessionMinutes, pilots?.kirill?.status, pilots?.roma?.sessionBalanceAtStart, pilots?.kirill?.sessionBalanceAtStart, updateSessionBurn, stopEngineStore, updateLastBurnAt, setLastOfflineSyncToast])

  const bothCanStart =
    users.find((u) => u.id === 'roma')?.balance >= 1 && users.find((u) => u.id === 'kirill')?.balance >= 1

  return (
    <div className="rounded-2xl border-[3px] border-slate-600 bg-slate-800/95 p-4 sm:p-5 shrink-0 flex flex-col gap-4 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
      {/* Wheel of Fortune — banner always clickable; opens wheel or pilot selector */}
      {typeof setWheelOpen === 'function' && (
        <WheelBanner
          wheelPilot={wheelPilot}
          setWheelPilot={setWheelPilot}
          setWheelOpen={setWheelOpen}
        />
      )}

      <h3 className="font-gaming text-xs text-slate-400 uppercase tracking-wider">
        Двигатель сгорания
      </h3>

      {/* Master controls: slim bar — режим + ЗАПУСТИТЬ ОБОИХ (зелёный) + ПАУЗА ВСЕМ (жёлтый) */}
      <div className="flex flex-wrap items-center gap-2 py-2 border-b border-slate-600/60">
        <div className="flex gap-1.5 shrink-0">
          {MODES.map((m) => {
            const Icon = m.Icon
            const isSelected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                disabled={anyRunning}
                className={cn(
                  'min-h-[40px] px-3 rounded-xl border-2 font-gaming text-xs font-bold uppercase transition touch-manipulation flex items-center gap-1.5',
                  m.color === 'blue' &&
                    (isSelected ? 'border-blue-500 bg-blue-500/25 text-blue-300' : 'border-slate-600 text-slate-400'),
                  m.color === 'pink' &&
                    (isSelected ? 'border-pink-500 bg-pink-500/25 text-pink-300' : 'border-slate-600 text-slate-400')
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.5} />
                <span>{m.id === 'game' ? 'ИГРА' : 'ЮТУБ'}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 flex-1 min-w-0 justify-end">
          <motion.button
            type="button"
            onClick={startBoth}
            disabled={!bothCanStart}
            className={cn(
              'min-h-[40px] px-3 sm:px-4 rounded-xl border-2 font-gaming text-xs font-bold uppercase transition touch-manipulation',
              bothCanStart
                ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'border-slate-600 text-slate-500 opacity-60 cursor-not-allowed'
            )}
          >
            ▶ ЗАПУСТИТЬ ОБОИХ
          </motion.button>
          <motion.button
            type="button"
            onClick={pauseAll}
            disabled={!anyRunning}
            className={cn(
              'min-h-[40px] px-3 sm:px-4 rounded-xl border-2 font-gaming text-xs font-bold uppercase transition touch-manipulation',
              anyRunning
                ? 'border-amber-500/80 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                : 'border-slate-600 text-slate-500 opacity-60 cursor-not-allowed'
            )}
          >
            ⏸ ПАУЗА ВСЕМ
          </motion.button>
        </div>
      </div>

      {/* Dual cockpit: two pilot cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0">
        <PilotEngine
          id="roma"
          elapsedSeconds={romaElapsedSeconds}
          mode={mode}
          onStartRefs={onStartRefs}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />
        <PilotEngine
          id="kirill"
          elapsedSeconds={kirillElapsedSeconds}
          mode={mode}
          onStartRefs={onStartRefs}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />
      </div>

      {/* Reactor Core + Daily Stats below cards */}
      <ReactorCore />
      <DailyFlightLog />
    </div>
  )
}
