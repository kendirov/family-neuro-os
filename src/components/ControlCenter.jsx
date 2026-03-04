import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Tv, Flame, Apple } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playCashRegister, playError, playBurnTick } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { PilotEngine } from '@/components/PilotEngine'
import { WheelBanner } from '@/components/WheelBanner'
import { ConsumptionWidget } from '@/components/ConsumptionWidget'
import { useRealtimeTimer } from '@/hooks/useRealtimeTimer'
import {
  startActiveTimer,
  pauseActiveTimer,
  stopActiveTimer,
} from '@/lib/activeTimersService'

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
  const [target, setTarget] = useState('both') // 'roma' | 'kirill' | 'both'
  const [tick, setTick] = useState(0)
  const [sessionCreditsBurned, setSessionCreditsBurned] = useState(0)
  const [actionPending, setActionPending] = useState(false)

  const lastDeductedMinuteRef = useRef({ roma: 0, kirill: 0 })
  const intervalRef = useRef(null)

  // active_timers: live-состояние из Supabase Realtime
  // Используем режим пилота при активной сессии, иначе выбранный mode
  const romaActivityMode = pilots?.roma?.mode ?? mode
  const kirillActivityMode = pilots?.kirill?.mode ?? mode
  const romaTimer = useRealtimeTimer('roma', romaActivityMode)
  const kirillTimer = useRealtimeTimer('kirill', kirillActivityMode)

  const romaElapsedSeconds = romaTimer.displaySeconds
  const kirillElapsedSeconds = kirillTimer.displaySeconds

  const anyRunning =
    (pilots?.roma?.status === 'RUNNING') || (pilots?.kirill?.status === 'RUNNING')

  const targetIds = target === 'both' ? PILOT_IDS : [target]

  // Состояние кнопок из active_timers (приоритет) + store (fallback)
  const getTimerStatus = (id) => {
    const t = id === 'roma' ? romaTimer : kirillTimer
    if (t.row?.status) return t.row.status
    const p = pilots?.[id]
    if (p?.status === 'RUNNING') return 'playing'
    if (p?.status === 'PAUSED') return 'paused'
    return 'stopped'
  }

  const anyTargetPlaying = targetIds.some((id) => getTimerStatus(id) === 'playing')
  const anyTargetPaused = targetIds.some((id) => getTimerStatus(id) === 'paused')

  const canStart = targetIds.every((id) => (users.find((u) => u.id === id)?.balance ?? 0) >= 1)
  const canPause = anyTargetPlaying
  const canStop = anyTargetPlaying || anyTargetPaused

  const startSelected = async () => {
    if (!canStart || actionPending) {
      playError()
      return
    }
    setActionPending(true)
    playEngineRev()
    try {
      for (const id of targetIds) {
        await startActiveTimer(id, mode)
        startEngineStore(id, mode)
      }
      lastDeductedMinuteRef.current = { roma: 0, kirill: 0 }
      setSessionCreditsBurned(0)
    } catch (e) {
      console.error('startActiveTimer:', e)
      playError()
      setLastOfflineSyncToast({ message: 'Ошибка старта таймера. Проверьте консоль (F12).' })
    } finally {
      setActionPending(false)
    }
  }

  const pauseSelected = async () => {
    if (!canPause || actionPending) return
    setActionPending(true)
    try {
      for (const id of targetIds) {
        const t = id === 'roma' ? romaTimer : kirillTimer
        if (t.row?.status === 'playing') {
          await pauseActiveTimer(id, t.row.activity_type ?? mode, t.row)
          pauseEngineStore(id)
        }
      }
    } catch (e) {
      console.error('pauseActiveTimer:', e)
      playError()
      setLastOfflineSyncToast({ message: 'Ошибка паузы. Проверьте консоль (F12).' })
    } finally {
      setActionPending(false)
    }
  }

  const stopSelected = async () => {
    if (!canStop || actionPending) return
    setActionPending(true)
    playCashRegister()
    try {
      for (const id of targetIds) {
        const t = id === 'roma' ? romaTimer : kirillTimer
        const status = getTimerStatus(id)
        if (status === 'playing' || status === 'paused') {
          const activityType = t.row?.activity_type ?? mode
          await stopActiveTimer(id, activityType, t.row, (pilotName, actType, elapsedMinutes) => {
            addGamingMinutesToday(elapsedMinutes, actType, [pilotName])
          })
          stopEngineStore(id)
        }
      }
      lastDeductedMinuteRef.current = { roma: 0, kirill: 0 }
    } catch (e) {
      console.error('stopActiveTimer:', e)
      playError()
      setLastOfflineSyncToast({ message: 'Ошибка остановки. Проверьте консоль (F12).' })
    } finally {
      setActionPending(false)
    }
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

  // Small realtime sync indicator (multi-device timer sync)
  const realtimeStatus = useAppStore((s) => s.realtimeStatus)

  const syncDotConnected = realtimeStatus === 'connected'
  const syncDotOffline = realtimeStatus === 'error' || realtimeStatus === 'idle'

  const TARGET_OPTIONS = [
    { id: 'kirill', label: 'Кирилл', accent: 'purple' },
    { id: 'roma', label: 'Рома', accent: 'cyan' },
    { id: 'both', label: 'Оба', accent: 'slate' },
  ]

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-3 sm:p-4 shrink-0 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.35)]">
      {/* Sync Status: tiny pulsing dot in top-right corner */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1.5"
        title={realtimeStatus === 'connected' ? 'Синхронизировано' : realtimeStatus === 'error' ? 'Нет связи' : realtimeStatus === 'connecting' ? 'Подключение...' : 'Оффлайн'}
      >
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            realtimeStatus === 'connected' && 'bg-emerald-400 sync-dot-connected shadow-[0_0_8px_rgba(16,185,129,0.8)]',
            realtimeStatus === 'connecting' && 'bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.6)]',
            (realtimeStatus === 'error' || realtimeStatus === 'idle' || !realtimeStatus) && 'bg-red-500/90 sync-dot-offline'
          )}
        />
      </div>

      {/* Wheel of Fortune — banner always clickable */}
      {typeof setWheelOpen === 'function' && (
        <WheelBanner
          wheelPilot={wheelPilot}
          setWheelPilot={setWheelPilot}
          setWheelOpen={setWheelOpen}
        />
      )}

      <h3 className="font-gaming text-xs text-slate-400 uppercase tracking-wider pr-8">
        Двигатель сгорания
      </h3>

      {/* 1. Target Selection */}
      <div className="space-y-1.5">
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
          Цель
        </span>
        <div className="flex gap-px rounded-xl border border-white/10 bg-slate-950/80 p-0.5">
          {TARGET_OPTIONS.map((opt) => {
            const isSelected = target === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTarget(opt.id)}
                className={cn(
                  'flex-1 min-h-[40px] font-mono text-[10px] font-bold uppercase tracking-wider transition-all touch-manipulation',
                  isSelected
                    ? opt.accent === 'cyan'
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60 shadow-[inset_0_0_20px_rgba(34,211,238,0.15),0_0_12px_rgba(34,211,238,0.3)]'
                      : opt.accent === 'purple'
                        ? 'bg-purple-500/25 text-purple-200 border border-purple-400/60 shadow-[inset_0_0_20px_rgba(168,85,247,0.15),0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-white/15 text-white border border-white/25 shadow-[inset_0_0_16px_rgba(255,255,255,0.08),0_0_8px_rgba(255,255,255,0.1)]'
                  : 'text-slate-500 border border-transparent hover:bg-white/5 hover:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Mode Selection */}
      <div className="space-y-1.5">
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
          Режим
        </span>
        <div className="relative rounded-xl border border-white/10 bg-slate-950/80 p-1 flex gap-1">
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
                  if (isGameGroup) setMode('game')
                  else if (isMediaGroup) setMode('youtube')
                }}
                className={cn(
                  'relative flex-1 min-h-[44px] rounded-lg font-gaming text-[11px] font-bold uppercase transition-all touch-manipulation flex items-center justify-center gap-1.5 overflow-hidden',
                  isSelected ? 'text-white' : 'text-slate-400'
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="engineModeActiveTab"
                    className={cn(
                      'absolute inset-0 rounded-lg',
                      isGameGroup
                        ? 'bg-gradient-to-br from-cyan-500/35 to-blue-500/35 border border-cyan-400/50 shadow-[inset_0_0_24px_rgba(34,211,238,0.2),0_0_16px_rgba(34,211,238,0.4)]'
                        : 'bg-gradient-to-br from-orange-500/35 to-pink-500/35 border border-orange-400/50 shadow-[inset_0_0_24px_rgba(251,146,60,0.2),0_0_16px_rgba(251,113,133,0.35)]'
                    )}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                  <span aria-hidden className="text-base">{group.emoji}</span>
                  <span>{group.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Sub-mode: Обычные / Полезные (when Media) */}
        {(mode === 'youtube' || mode === 'good') && (
          <div className="flex gap-1.5">
            {[
              { id: 'youtube', label: '📺 Обычные', Icon: Tv },
              { id: 'good', label: '🍏 Полезные', Icon: Apple },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className={cn(
                  'flex-1 min-h-[32px] px-2.5 rounded-lg border font-gaming text-[10px] font-bold uppercase transition touch-manipulation flex items-center justify-center gap-1.5',
                  mode === opt.id
                    ? 'border-pink-400/70 bg-pink-500/20 text-pink-200 shadow-[inset_0_0_12px_rgba(236,72,153,0.15)]'
                    : 'border-white/10 text-slate-500 hover:bg-white/5 hover:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Action Buttons: Start | Pause | Stop — визуально отражают статус active_timers */}
      <div className="space-y-1.5">
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block">
          Действия
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startSelected}
            disabled={!canStart || actionPending}
            className={cn(
              'flex-1 min-h-[44px] rounded-xl border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation',
              canStart
                ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                : 'btn-control-disabled border-slate-600/60 bg-slate-800/40 text-slate-500',
              anyTargetPlaying &&
                'shadow-[0_0_16px_rgba(34,197,94,0.4)] ring-1 ring-emerald-400/50',
              actionPending && 'opacity-70 pointer-events-none'
            )}
          >
            ▶ СТАРТ
          </button>
          <button
            type="button"
            onClick={pauseSelected}
            disabled={!canPause || actionPending}
            className={cn(
              'flex-1 min-h-[44px] rounded-xl border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation',
              canPause
                ? 'border-amber-500/70 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 shadow-[inset_0_0_12px_rgba(251,191,36,0.1)]'
                : 'btn-control-disabled border-slate-600/60 bg-slate-800/40 text-slate-500',
              actionPending && 'opacity-70 pointer-events-none'
            )}
          >
            ⏸ ПАУЗА
          </button>
          <button
            type="button"
            onClick={stopSelected}
            disabled={!canStop || actionPending}
            className={cn(
              'flex-1 min-h-[44px] rounded-xl border-2 font-gaming text-[10px] font-bold uppercase transition touch-manipulation',
              canStop
                ? 'border-red-500/80 bg-red-500/20 text-red-200 hover:bg-red-500/30 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)]'
                : 'btn-control-disabled border-slate-600/60 bg-slate-800/40 text-slate-500',
              actionPending && 'opacity-70 pointer-events-none'
            )}
          >
            ■ СТОП
          </button>
        </div>
      </div>

      <div className="border-b border-white/10" aria-hidden />

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
