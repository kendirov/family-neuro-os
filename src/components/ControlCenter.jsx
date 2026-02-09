import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Tv, Flame, Apple } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playCashRegister, playError, playBurnTick } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { PilotEngine } from '@/components/PilotEngine'
import { WheelBanner } from '@/components/WheelBanner'
import { ConsumptionWidget } from '@/components/ConsumptionWidget'

const MODES = [
  { id: 'game', label: 'ИГРЫ', Icon: Gamepad2, color: 'blue', emoji: '🎮' },
  { id: 'youtube', label: 'МУЛЬТИКИ', Icon: Tv, color: 'pink', emoji: '📺' },
  { id: 'good', label: 'ПОЛЕЗНОЕ', Icon: Apple, color: 'green', emoji: '🍏' },
]

// Simplified mode groups: Games vs Media (Cartoons)
const MODE_GROUPS = [
  { id: 'game', label: 'ИГРЫ', Icon: Gamepad2, color: 'blue', emoji: '🎮' },
  { id: 'media', label: 'МУЛЬТИКИ', Icon: Tv, color: 'orange', emoji: '📺', modes: ['youtube', 'good'] },
]

// CRITICAL: Order must be Kirill first, Roma second (for consistent left/right layout)
const PILOT_IDS = ['kirill', 'roma']

/** Будни (Пн–Пт): до 1 ч — 1 кр/мин, после 1 ч — 2 кр/мин. Выходные — всегда 1 кр/мин. */
function isWeekday() {
  const d = new Date().getDay() // 0 = Sun, 6 = Sat
  return d >= 1 && d <= 5
}

/** Date key for today (YYYY-MM-DD). */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * BurnTimeline: Visual timeline showing burn rate zones and current position.
 * Shows colored zones (Green/Yellow/Red for Media, Blue/Red for Games) with a needle indicator.
 */
function BurnTimeline({ pilotId, mode }) {
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  
  const isMediaMode = mode === 'youtube' || mode === 'good'
  const currentMinutes = isMediaMode ? getTodayMediaTime(pilotId) : getTodayGameTime(pilotId)
  
  // Zone configuration
  const maxScale = isMediaMode ? 60 : 60 // Both use 60 as max scale
  const needlePosition = Math.min(100, (currentMinutes / maxScale) * 100)
  
  // Get current rate and zone info
  let currentRate = ''
  let currentZoneLabel = ''
  let currentZoneColor = ''
  
  if (isMediaMode) {
    if (currentMinutes < 20) {
      currentRate = '0 XP/мин'
      currentZoneLabel = 'Бесплатно'
      currentZoneColor = 'text-green-300'
    } else if (currentMinutes < 60) {
      currentRate = '0.5 XP/мин'
      currentZoneLabel = 'Тариф 0.5x'
      currentZoneColor = 'text-yellow-300'
    } else {
      currentRate = '2 XP/мин'
      currentZoneLabel = 'Перегрузка 2x'
      currentZoneColor = 'text-red-400'
    }
  } else {
    // Game mode
    if (currentMinutes < 60) {
      currentRate = '1 XP/мин'
      currentZoneLabel = 'Норма 1x'
      currentZoneColor = 'text-cyan-300'
    } else {
      currentRate = '2 XP/мин'
      currentZoneLabel = 'Перегрузка 2x'
      currentZoneColor = 'text-red-400'
    }
  }
  
  return (
    <div className="w-full space-y-2">
      {/* Timeline Bar */}
      <div className="relative h-6 rounded-lg border-2 border-slate-600/60 bg-slate-900/80 overflow-hidden">
        {/* Zone segments */}
        {isMediaMode ? (
          <>
            {/* Green zone: 0-20 min (33.3% of 60) */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"
              style={{ width: `${(20 / maxScale) * 100}%` }}
            />
            {/* Yellow zone: 20-60 min (66.7% of 60) */}
            <div
              className="absolute inset-y-0 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500"
              style={{ left: `${(20 / maxScale) * 100}%`, width: `${((60 - 20) / maxScale) * 100}%` }}
            />
            {/* Red zone: 60+ min (overflow) - striped pattern */}
            {currentMinutes >= 60 && (
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"
                style={{
                  left: `${(60 / maxScale) * 100}%`,
                  width: `${100 - (60 / maxScale) * 100}%`,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)',
                }}
              />
            )}
            {/* Zone labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute left-0 text-[8px] font-mono font-bold text-green-200 px-1">
                БЕСПЛАТНО
              </div>
              <div className="absolute left-[33.3%] text-[8px] font-mono font-bold text-yellow-200 px-1">
                0.5x
              </div>
              <div className="absolute left-[66.7%] text-[8px] font-mono font-bold text-red-200 px-1">
                2x
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Blue zone: 0-60 min */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500"
              style={{ width: `${(60 / maxScale) * 100}%` }}
            />
            {/* Red zone: 60+ min (overflow) - striped pattern */}
            {currentMinutes >= 60 && (
              <div
                className="absolute inset-y-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse"
                style={{
                  left: `${(60 / maxScale) * 100}%`,
                  width: `${100 - (60 / maxScale) * 100}%`,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)',
                }}
              />
            )}
            {/* Zone labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute left-0 text-[8px] font-mono font-bold text-cyan-200 px-1">
                НОРМА 1x
              </div>
              <div className="absolute left-[50%] text-[8px] font-mono font-bold text-red-200 px-1">
                2x
              </div>
            </div>
          </>
        )}
        
        {/* Needle indicator - glowing white triangle and line */}
        <motion.div
          className="absolute top-0 bottom-0 z-20 transition-all duration-500 ease-out"
          style={{ left: `${Math.min(100, Math.max(0, needlePosition))}%` }}
          initial={false}
        >
          {/* Triangle pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[10px] border-l-transparent border-r-transparent border-b-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
          {/* Vertical line */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white shadow-[0_0_8px_rgba(255,255,255,1),inset_0_0_4px_rgba(255,255,255,0.8)]" />
        </motion.div>
      </div>
      
      {/* Text feedback */}
      <p className={cn('font-mono text-[10px] uppercase tracking-wider text-center', currentZoneColor)}>
        Потрачено: {currentMinutes} мин (Тариф: {currentZoneLabel} — {currentRate})
      </p>
    </div>
  )
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
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  const startEngineStore = useAppStore((s) => s.startEngine)
  const pauseEngineStore = useAppStore((s) => s.pauseEngine)
  const resumeEngineStore = useAppStore((s) => s.resumeEngine)
  const stopEngineStore = useAppStore((s) => s.stopEngine)
  const setPilotSessionMinutes = useAppStore((s) => s.setPilotSessionMinutes)
  const updateLastBurnAt = useAppStore((s) => s.updateLastBurnAt)
  const setLastOfflineSyncToast = useAppStore((s) => s.setLastOfflineSyncToast)
  const addGamingMinutesToday = useAppStore((s) => s.addGamingMinutesToday)

  const [mode, setMode] = useState('game')
  const [tick, setTick] = useState(0)
  const [sessionCreditsBurned, setSessionCreditsBurned] = useState(0)

  const lastDeductedMinuteRef = useRef({ roma: 0, kirill: 0 })
  const intervalRef = useRef(null)

  const anyRunning = (pilots?.roma?.status === 'RUNNING') || (pilots?.kirill?.status === 'RUNNING')

  /** Calculate elapsed seconds from server-authoritative timer state.
   * IF timer_status === 'running': VisualTime = seconds_accumulated_today + (NOW - timer_start_at)
   * IF timer_status === 'paused': VisualTime = seconds_accumulated_today
   */
  const calculateElapsedSeconds = (pilot) => {
    if (!pilot || pilot.timerStatus === 'idle') return 0
    
    const accumulated = pilot.secondsAccumulatedToday ?? 0
    
    if (pilot.timerStatus === 'running' && pilot.timerStartAt) {
      const now = Date.now()
      const startMs = new Date(pilot.timerStartAt).getTime()
      const currentSegmentSeconds = Math.floor((now - startMs) / 1000)
      return accumulated + currentSegmentSeconds
    }
    
    // Paused: just return accumulated seconds
    return accumulated
  }
  
  const romaElapsedSeconds = calculateElapsedSeconds(pilots?.roma)
  const kirillElapsedSeconds = calculateElapsedSeconds(pilots?.kirill)

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
    lastDeductedMinuteRef.current = { roma: 0, kirill: 0 }
    setSessionCreditsBurned(0)
  }

  const pauseAll = () => {
    PILOT_IDS.forEach((id) => {
      if (pilots?.[id]?.status !== 'RUNNING') return
      pauseEngineStore(id)
    })
  }

  // Callbacks for PilotEngine (no longer need local state management)
  const onStartRefs = (id) => {
    lastDeductedMinuteRef.current[id] = 0
  }

  const onPause = (id) => {
    // Server handles pause state
  }

  const onResume = (id) => {
    // Server handles resume state
  }

  const onStop = (id) => {
    lastDeductedMinuteRef.current[id] = 0
  }

  /** Tick every 1000ms: update UI counter based on server timer state. */
  useEffect(() => {
    if (!anyRunning) return
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1)
      PILOT_IDS.forEach((id) => {
        const p = pilots?.[id]
        if (!p || p.status !== 'RUNNING') return
        
        // Calculate elapsed seconds from server state
        // IF status == 'running': seconds_today + (NOW - timer_start_at)
        // IF status == 'paused': seconds_today
        const secondsToday = p.secondsToday ?? 0
        let elapsedSeconds = secondsToday
        if (p.timerStatus === 'running' && p.timerStartAt) {
          const now = Date.now()
          const startMs = new Date(p.timerStartAt).getTime()
          const currentSegmentSeconds = Math.floor((now - startMs) / 1000)
          elapsedSeconds = secondsToday + currentSegmentSeconds
        }
        
        const rawMinutes = Math.floor(elapsedSeconds / 60)
        const cap = p?.sessionBalanceAtStart != null ? p.sessionBalanceAtStart : Infinity
        const sessionMinutes = Math.min(rawMinutes, cap)
        setPilotSessionMinutes(id, sessionMinutes)
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [anyRunning, setPilotSessionMinutes, pilots?.roma?.status, pilots?.kirill?.status, pilots?.roma?.timerStartAt, pilots?.kirill?.timerStartAt, pilots?.roma?.secondsToday, pilots?.kirill?.secondsToday, pilots?.roma?.timerStatus, pilots?.kirill?.timerStatus])

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

      const maxMinute = Math.min(currentMinute, cap)
      let burned = 0
      // Track time locally as we process each minute to ensure correct tier calculation
      const initialState = useAppStore.getState()
      let localGameTime = initialState.getTodayGameTime(id)
      let localMediaTime = initialState.getTodayMediaTime(id)
      
      for (let m = oldLast + 1; m <= maxMinute; m++) {
        const nowState = useAppStore.getState()
        const pilotUser = nowState.users.find((x) => x.id === id)
        if (!pilotUser || pilotUser.balance <= 0) {
          playError()
          stopEngineStore(id)
          lastDeductedMinuteRef.current[id] = oldLast
          return
        }

        const mode = p.mode ?? 'game'
        // Calculate burn rate using tiered system based on current accumulated time
        let rate
        if (mode === 'good') {
          // Media mode (good): tiered rate based on today_media_time
          if (localMediaTime < 20) rate = 0
          else if (localMediaTime < 60) rate = 0.5
          else rate = 2
        } else if (mode === 'youtube') {
          // Media mode (youtube): tiered rate based on today_media_time
          if (localMediaTime < 20) rate = 0
          else if (localMediaTime < 60) rate = 0.5
          else rate = 2
        } else {
          // Game mode: tiered rate based on today_game_time
          if (localGameTime < 60) rate = 1
          else rate = 2
        }

        // Update local time tracking for next iteration
        if (mode === 'good' || mode === 'youtube') {
          localMediaTime += 1
        } else {
          localGameTime += 1
        }

        if (rate === 0) {
          // 0 XP, но считаем экранное время.
          addGamingMinutesToday(1, mode, [id])
          continue
        }

        const amount = Math.min(rate, pilotUser.balance)
        if (amount <= 0) break
        updateSessionBurn(id, amount, m, mode)
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
    <div className="rounded-2xl border-[3px] border-slate-600 bg-slate-800/95 p-3 sm:p-4 shrink-0 flex flex-col gap-3 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
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

      {/* Master controls: Large mode toggles + ЗАПУСТИТЬ ОБОИХ (зелёный) + ПАУЗА ВСЕМ (жёлтый) */}
      <div className="flex flex-col gap-2.5 py-2 border-b border-slate-600/60">
        {/* Large Mode Toggles: Games vs Media (sliding pill) */}
        <div className="relative rounded-2xl border-[3px] border-slate-600/70 bg-slate-900/80 p-1 flex gap-1">
          {MODE_GROUPS.map((group) => {
            const Icon = group.Icon
            const isGameGroup = group.id === 'game'
            const isMediaGroup = group.id === 'media'
            const isSelected = isGameGroup
              ? mode === 'game'
              : isMediaGroup
                ? mode === 'youtube' || mode === 'good'
                : false

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => {
                  if (isGameGroup) {
                    setMode('game')
                  } else if (isMediaGroup) {
                    // Default to youtube for media group
                    setMode('youtube')
                  }
                }}
                className={cn(
                  'relative flex-1 min-h-[44px] rounded-xl font-gaming text-[11px] font-bold uppercase transition-all touch-manipulation flex items-center justify-center gap-1.5 overflow-hidden',
                  'text-slate-400'
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="engineModeActiveTab"
                    className={cn(
                      'absolute inset-0 rounded-xl',
                      isGameGroup
                        ? 'bg-gradient-to-br from-blue-500/40 to-cyan-500/40 shadow-[0_0_18px_rgba(59,130,246,0.5)]'
                        : 'bg-gradient-to-br from-orange-500/40 to-amber-500/40 shadow-[0_0_18px_rgba(251,146,60,0.5)]'
                    )}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className={cn('relative z-10 flex items-center gap-1.5', isSelected && 'text-white')}>
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                  <span aria-hidden className="text-base">
                    {group.emoji}
                  </span>
                  <span>{group.label}</span>
                </span>
              </button>
            )
          })}
        </div>
        
        {/* Sub-mode selector for Media (only shown when media is selected) */}
        {(mode === 'youtube' || mode === 'good') && (
          <div className="flex gap-1.5 justify-center">
            <button
              type="button"
              onClick={() => setMode('youtube')}
              className={cn(
                'min-h-[32px] px-2.5 rounded-lg border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation flex items-center gap-1.5',
                mode === 'youtube'
                  ? 'border-pink-500 bg-pink-500/25 text-pink-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              )}
            >
              <Tv className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>📺 Обычные</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('good')}
              className={cn(
                'min-h-[32px] px-2.5 rounded-lg border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation flex items-center gap-1.5',
                mode === 'good'
                  ? 'border-emerald-500 bg-emerald-500/25 text-emerald-200'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
              )}
            >
              <Apple className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>🍏 Полезные</span>
            </button>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-1.5 flex-1 min-w-0 justify-end">
          <motion.button
            type="button"
            onClick={startBoth}
            disabled={!bothCanStart}
            className={cn(
              'min-h-[36px] px-3 rounded-xl border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation',
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
              'min-h-[36px] px-3 rounded-xl border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation',
              anyRunning
                ? 'border-amber-500/80 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                : 'border-slate-600 text-slate-500 opacity-60 cursor-not-allowed'
            )}
          >
            ⏸ ПАУЗА ВСЕМ
          </motion.button>
        </div>
      </div>

      {/* Visual Burn Rate Timeline for each pilot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-1.5">
        <BurnTimeline pilotId="kirill" mode={mode} />
        <BurnTimeline pilotId="roma" mode={mode} />
      </div>

      {/* Dual cockpit: two pilot cards - Kirill LEFT, Roma RIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-h-0">
        <PilotEngine
          id="kirill"
          elapsedSeconds={kirillElapsedSeconds}
          mode={mode}
          onStartRefs={onStartRefs}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />
        <PilotEngine
          id="roma"
          elapsedSeconds={romaElapsedSeconds}
          mode={mode}
          onStartRefs={onStartRefs}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />
      </div>

      {/* Daily consumption gauges (per-pilot fuel tanks) */}
      <ConsumptionWidget />

      {/* Reactor Core + Daily Stats below cards */}
      <ReactorCore />
      <DailyFlightLog />
    </div>
  )
}
