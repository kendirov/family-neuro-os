import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Tv } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playCashRegister, playError } from '@/lib/sounds'
import { cn } from '@/lib/utils'

/** Elapsed seconds → "00:15" or "01:05:00". */
function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

const MODES = [
  { id: 'game', label: 'ИГРАТЬ', Icon: Gamepad2, color: 'blue' },
  { id: 'youtube', label: 'ЮТУБ / МУЛЬТИКИ', Icon: Tv, color: 'pink' },
]

const PILOT_IDS = ['roma', 'kirill'] // order for display

/** Toggle pilot: single click = toggle that user ON/OFF; "Оба" = if any ON -> both OFF, else both ON. */
function togglePilot(selectedIds, pilotId) {
  if (pilotId === 'roma' || pilotId === 'kirill') {
    const has = selectedIds.includes(pilotId)
    return has ? selectedIds.filter((id) => id !== pilotId) : [...selectedIds, pilotId]
  }
  if (pilotId === 'both') {
    const anyOn = selectedIds.length > 0
    return anyOn ? [] : ['roma', 'kirill']
  }
  return selectedIds
}

/** Max minutes for fuel gauge visual (depletes over this range). */
const FUEL_GAUGE_MAX_MIN = 60

/** Будни (Пн–Пт): до 1 ч — 1 кр/мин, после 1 ч — 2 кр/мин. Выходные — всегда 1 кр/мин. */
function isWeekday() {
  const d = new Date().getDay() // 0 = Sun, 6 = Sat
  return d >= 1 && d <= 5
}

/** Date key for today (YYYY-MM-DD). */
function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Daily Flight Log: цифровая панель (LCD), колонки Рома/Кирилл, 🎮 Игра и 📺 Мультики. */
function DailyFlightLog() {
  const currentSessionMinutes = useAppStore((s) => s.currentSessionMinutes)
  const currentSessionMode = useAppStore((s) => s.currentSessionMode)
  const currentSessionPilotIds = useAppStore((s) => s.currentSessionPilotIds ?? [])
  const dailyGamingBreakdown = useAppStore((s) => s.dailyGamingBreakdown ?? {})

  const dailyStats = useMemo(() => {
    const today = getDateKey()
    const saved = dailyGamingBreakdown[today] ?? {
      game: { roma: 0, kirill: 0 },
      youtube: { roma: 0, kirill: 0 },
    }
    const game = { roma: saved.game?.roma ?? 0, kirill: saved.game?.kirill ?? 0 }
    const youtube = { roma: saved.youtube?.roma ?? 0, kirill: saved.youtube?.kirill ?? 0 }
    if (currentSessionMinutes > 0 && currentSessionMode && currentSessionPilotIds.length > 0) {
      const key = currentSessionMode === 'youtube' ? 'youtube' : 'game'
      currentSessionPilotIds.forEach((id) => {
        if (id === 'roma' || id === 'kirill') {
          const cur = currentSessionMinutes
          if (key === 'game') game[id] = (game[id] ?? 0) + cur
          else youtube[id] = (youtube[id] ?? 0) + cur
        }
      })
    }
    return { game, youtube }
  }, [currentSessionMinutes, currentSessionMode, currentSessionPilotIds, dailyGamingBreakdown])

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
 */
export function ControlCenter() {
  const users = useAppStore((s) => s.users)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const addGamingMinutesToday = useAppStore((s) => s.addGamingMinutesToday)
  const getGamingMinutesToday = useAppStore((s) => s.getGamingMinutesToday)
  const setCurrentSessionMinutes = useAppStore((s) => s.setCurrentSessionMinutes)
  const setCurrentSessionInfo = useAppStore((s) => s.setCurrentSessionInfo)

  const [mode, setMode] = useState('game')
  /** Выбранные пилоты: массив id. Клик по имени — вкл/выкл; «Оба» — оба вкл или оба выкл. */
  const [selectedPilotIds, setSelectedPilotIds] = useState(['roma'])
  const [engineActive, setEngineActive] = useState(false)
  const [enginePaused, setEnginePaused] = useState(false) // пауза: таймер не тикает, списание не идёт
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionCreditsBurned, setSessionCreditsBurned] = useState(0)

  const lastDeductedMinuteRef = useRef(0)
  const intervalRef = useRef(null)
  const sessionStartRef = useRef(0)
  const sessionCreditsBurnedRef = useRef(0)
  const sessionStartSavedMinutesRef = useRef(0) // минут за день на старте сессии (для X1/X2)
  sessionCreditsBurnedRef.current = sessionCreditsBurned

  const reason = mode === 'game' ? 'Игровое время' : 'Ютуб / Мультики'
  const selectedIds = selectedPilotIds
  const creditsPerMinute = selectedIds.length

  const canStart =
    selectedIds.length > 0 &&
    selectedIds.every((id) => {
      const u = users.find((x) => x.id === id)
      return u && u.balance >= 1
    })

  const startEngine = () => {
    if (!canStart || engineActive) return
    playEngineRev()
    sessionStartSavedMinutesRef.current = getGamingMinutesToday()
    setCurrentSessionInfo(mode, selectedIds)
    setEngineActive(true)
    setEnginePaused(false)
    setElapsedSeconds(0)
    setSessionCreditsBurned(0)
    lastDeductedMinuteRef.current = 0
    sessionStartRef.current = Date.now()
  }

  const stopEngine = () => {
    if (!engineActive) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    const totalMinutes = Math.floor(elapsedSeconds / 60)
    const oldLast = lastDeductedMinuteRef.current
    for (let m = oldLast + 1; m <= totalMinutes; m++) {
      const saved = sessionStartSavedMinutesRef.current + m
      const rate = isWeekday() && saved > 60 ? 2 : 1
      selectedIds.forEach((id) => spendPoints(id, rate, reason))
      addGamingMinutesToday(1, mode, selectedIds)
    }
    setCurrentSessionMinutes(0)
    setCurrentSessionInfo(null, [])
    playCashRegister()
    setEngineActive(false)
    setEnginePaused(false)
    setElapsedSeconds(0)
    setSessionCreditsBurned(0)
    lastDeductedMinuteRef.current = 0
  }

  /** Timer: tick every second when running and not paused. */
  useEffect(() => {
    if (!engineActive || enginePaused) return
    intervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [engineActive, enginePaused])

  /** Обновляем currentSessionMinutes для «фитилька» в реальном времени. */
  useEffect(() => {
    if (!engineActive) {
      setCurrentSessionMinutes(0)
      return
    }
    setCurrentSessionMinutes(Math.floor(elapsedSeconds / 60))
  }, [engineActive, elapsedSeconds, setCurrentSessionMinutes])

  /**
   * Per-minute deduction: будни — до 60 мин 1 кр/мин, после 60 мин 2 кр/мин; выходные — 1 кр/мин. Не списываем на паузе.
   */
  useEffect(() => {
    if (!engineActive || enginePaused || selectedIds.length === 0) return

    const currentMinute = Math.floor(elapsedSeconds / 60)
    const oldLast = lastDeductedMinuteRef.current
    if (currentMinute <= oldLast) return

    const state = useAppStore.getState()
    const pilotsWithBalance = selectedIds.filter((id) => {
      const u = state.users.find((x) => x.id === id)
      return u && u.balance >= 1
    })

    if (pilotsWithBalance.length < selectedIds.length) {
      playError()
      if (intervalRef.current) clearInterval(intervalRef.current)
      setCurrentSessionMinutes(0)
      setCurrentSessionInfo(null, [])
      setEngineActive(false)
      setEnginePaused(false)
      setElapsedSeconds(0)
      setSessionCreditsBurned(0)
      lastDeductedMinuteRef.current = 0
      return
    }

    const saved = sessionStartSavedMinutesRef.current
    const weekday = isWeekday()
    let burned = 0
    for (let m = oldLast + 1; m <= currentMinute; m++) {
      const totalAfterThisMinute = saved + m
      const rate = weekday && totalAfterThisMinute > 60 ? 2 : 1
      selectedIds.forEach((id) => spendPoints(id, rate, reason))
      addGamingMinutesToday(1, mode, selectedIds)
      burned += rate * selectedIds.length
    }
    lastDeductedMinuteRef.current = currentMinute
    setSessionCreditsBurned((prev) => prev + burned)
  }, [engineActive, enginePaused, elapsedSeconds, selectedIds, reason, spendPoints, addGamingMinutesToday, setCurrentSessionMinutes, mode])

  const fuelGaugePercent = Math.max(
    0,
    100 - (Math.floor(elapsedSeconds / 60) / FUEL_GAUGE_MAX_MIN) * 100
  )

  return (
    <div className="rounded-2xl border-[3px] border-slate-600 bg-slate-800/95 p-4 sm:p-5 shrink-0 flex flex-col gap-4 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
      <h3 className="font-gaming text-xs text-slate-400 uppercase tracking-wider">
        Двигатель сгорания
      </h3>

      {/* 1. Mode Selector: GAME MODE (Blue) vs YOUTUBE/CARTOONS (Pink) */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">Режим</p>
        <div className="flex gap-2">
          {MODES.map((m) => {
            const Icon = m.Icon
            const isSelected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                disabled={engineActive}
                className={cn(
                  'flex-1 min-h-[52px] rounded-2xl border-[3px] font-gaming text-base font-bold uppercase transition touch-manipulation flex items-center justify-center gap-2 text-pop',
                  m.color === 'blue' &&
                    (isSelected
                      ? 'border-blue-500 bg-blue-500/25 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.4)]'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 disabled:opacity-60'),
                  m.color === 'pink' &&
                    (isSelected
                      ? 'border-pink-500 bg-pink-500/25 text-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.4)]'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 disabled:opacity-60')
                )}
              >
                <Icon className="h-5 w-5 shrink-0 icon-pop" strokeWidth={2.5} aria-hidden />
                <span className="truncate">{m.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Pilot Selector: Рома / Кирилл / Оба — активные с неоновым свечением */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">
          Пилот — нажми, чтобы включить или выключить
        </p>
        <div className="flex gap-2 flex-wrap">
          {PILOT_IDS.map((id) => {
            const label = id === 'roma' ? 'Рома' : 'Кирилл'
            const isSelected = selectedIds.includes(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedPilotIds((prev) => togglePilot(prev, id))}
                disabled={engineActive}
                className={cn(
                  'flex-1 min-w-0 min-h-[44px] rounded-2xl border-[3px] font-gaming text-sm font-bold uppercase transition touch-manipulation text-pop',
                  isSelected
                    ? 'bg-cyan-500/35 text-cyan-200 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.6),0_0_28px_rgba(34,211,238,0.35)]'
                    : 'border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700/60 hover:border-slate-500 disabled:opacity-60'
                )}
              >
                {label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setSelectedPilotIds((prev) => togglePilot(prev, 'both'))}
            disabled={engineActive}
            className={cn(
              'flex-1 min-w-0 min-h-[44px] rounded-2xl border-[3px] font-gaming text-sm font-bold uppercase transition touch-manipulation text-pop',
              selectedIds.length === 2
                ? 'bg-cyan-500/35 text-cyan-200 border-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.6),0_0_28px_rgba(34,211,238,0.35)]'
                : 'border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700/60 hover:border-slate-500 disabled:opacity-60'
            )}
          >
            Оба
          </button>
        </div>
      </div>

      {/* 3. Engine: Idle = green START; Running = yellow PAUSE + red STOP, RPM ring */}
      <div className="flex flex-col gap-3">
        {!engineActive && (
          <motion.button
            type="button"
            onClick={startEngine}
            disabled={!canStart}
            className={cn(
              'w-full font-gaming font-black uppercase tracking-widest py-6 sm:py-7 text-xl sm:text-2xl rounded-3xl border-[4px] transition touch-manipulation text-pop shadow-[0_6px_0_rgba(0,0,0,0.3)]',
              canStart
                ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-emerald-500/30'
                : 'border-slate-700 bg-slate-800/60 text-slate-500 cursor-not-allowed'
            )}
            whileHover={canStart ? { scale: 1.02 } : undefined}
            whileTap={canStart ? { scale: 0.98 } : undefined}
          >
            ▶ ЗАПУСК ДВИГАТЕЛЯ
          </motion.button>
        )}

        {engineActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col gap-3"
          >
            {/* Pulsing RPM ring around main control */}
            <div className="relative flex justify-center items-center">
              <motion.div
                className="absolute inset-0 rounded-3xl border-[3px] border-amber-400/60 pointer-events-none"
                style={{ padding: 4 }}
                animate={{
                  boxShadow: [
                    '0 0 12px rgba(251,191,36,0.4), inset 0 0 12px rgba(251,191,36,0.1)',
                    '0 0 24px rgba(251,191,36,0.7), inset 0 0 20px rgba(251,191,36,0.2)',
                    '0 0 12px rgba(251,191,36,0.4), inset 0 0 12px rgba(251,191,36,0.1)',
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-full h-full rounded-3xl border-2 border-amber-400/40 pointer-events-none"
                style={{ borderStyle: 'dashed' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              <div className="relative w-full flex flex-col gap-2">
                <motion.button
                  type="button"
                  onClick={() => setEnginePaused((p) => !p)}
                  className={cn(
                    'w-full font-gaming font-black uppercase tracking-widest py-5 sm:py-6 text-lg sm:text-xl rounded-3xl border-[4px] transition touch-manipulation text-pop',
                    'border-amber-500/90 bg-amber-500/25 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:bg-amber-500/35'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {enginePaused ? '▶ ПРОДОЛЖИТЬ' : '⏸ ПАУЗА'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={stopEngine}
                  className="w-full font-gaming font-bold uppercase tracking-wider py-3 sm:py-3.5 text-sm sm:text-base rounded-2xl border-[3px] border-red-500/90 bg-red-500/20 text-red-200 shadow-[0_0_12px_rgba(239,68,68,0.35)] hover:bg-red-500/30 transition touch-manipulation text-pop"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ⏹ СТОП
                </motion.button>
              </div>
            </div>

            {/* Time + Fuel + Burned */}
            <div className="rounded-2xl border-[3px] border-orange-500/50 bg-slate-800/95 p-4 sm:p-5 space-y-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">Время</p>
                <div className="font-gaming text-2xl sm:text-3xl font-black tabular-nums rounded-2xl border-[3px] border-orange-500/50 bg-slate-800/95 px-4 py-3 text-center text-orange-100 text-pop">
                  {formatElapsed(elapsedSeconds)}
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">Топливо</p>
                <div className="h-2.5 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600"
                    animate={{ width: `${fuelGaugePercent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
              <div className="rounded-xl border-[2px] border-red-500/50 bg-slate-800/90 px-3 py-2">
                <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">Сожжено</p>
                <p className="font-lcd text-lg font-bold tabular-nums text-red-400">−{sessionCreditsBurned} кр</p>
              </div>
            </div>
          </motion.div>
        )}

        {!engineActive && selectedIds.length === 0 && (
          <p className="font-mono text-amber-400 text-xs uppercase text-center">
            Выберите пилота (Рома / Кирилл / Оба)
          </p>
        )}
        {!canStart && !engineActive && selectedIds.length > 0 && (
          <p className="font-mono text-red-400 text-xs uppercase text-center">
            Недостаточно кредитов (1 кр = 1 мин)
          </p>
        )}
      </div>

      {/* 4. Daily Flight Log — всегда виден, обновляется в реальном времени */}
      <DailyFlightLog />
    </div>
  )
}
