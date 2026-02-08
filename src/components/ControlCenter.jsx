import { useState, useEffect, useRef } from 'react'
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

const PILOT_OPTIONS = [
  { id: 'roma', label: 'Рома' },
  { id: 'kirill', label: 'Кирилл' },
  { id: 'both', label: 'Оба' },
]

/** Max minutes for fuel gauge visual (depletes over this range). */
const FUEL_GAUGE_MAX_MIN = 60

/**
 * Control Center: Combustion Engine timer.
 * 1 Credit = 1 Minute. Mode (Game vs YouTube), Pilot (Roma / Kirill / BOTH), START/STOP engine.
 * Deducts 1 cr per pilot every minute while running. Session summary modal on STOP.
 */
export function ControlCenter() {
  const users = useAppStore((s) => s.users)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const addGamingMinutesToday = useAppStore((s) => s.addGamingMinutesToday)

  const [mode, setMode] = useState('game')
  const [pilot, setPilot] = useState('roma') // 'roma' | 'kirill' | 'both'
  const [engineActive, setEngineActive] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [sessionCreditsBurned, setSessionCreditsBurned] = useState(0)
  const [sessionSummary, setSessionSummary] = useState(null) // { totalTimeMin, totalCost }

  const lastDeductedMinuteRef = useRef(0)
  const intervalRef = useRef(null)
  const sessionStartRef = useRef(0)
  const sessionCreditsBurnedRef = useRef(0)
  sessionCreditsBurnedRef.current = sessionCreditsBurned

  const reason = mode === 'game' ? 'Игровое время' : 'YouTube / Мультики'
  const selectedIds = pilot === 'both' ? ['roma', 'kirill'] : [pilot]
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
    setEngineActive(true)
    setElapsedSeconds(0)
    setSessionCreditsBurned(0)
    lastDeductedMinuteRef.current = 0
    sessionStartRef.current = Date.now()
  }

  const stopEngine = () => {
    if (!engineActive) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    const totalMinutes = Math.floor(elapsedSeconds / 60)
    const totalCost = sessionCreditsBurned
    if (totalMinutes > 0) addGamingMinutesToday(totalMinutes)
    playCashRegister()
    setSessionSummary({ totalTimeMin: totalMinutes, totalCost })
    setEngineActive(false)
    setElapsedSeconds(0)
    setSessionCreditsBurned(0)
    lastDeductedMinuteRef.current = 0
  }

  /** Timer: tick every second while engine active. */
  useEffect(() => {
    if (!engineActive) return
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [engineActive])

  /**
   * Per-minute deduction: 1 credit = 1 minute per pilot.
   * If BOTH, deduct 1 from Roma and 1 from Kirill every minute.
   */
  useEffect(() => {
    if (!engineActive || selectedIds.length === 0) return

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
      const totalMinutes = Math.floor(elapsedSeconds / 60)
      const totalCost = sessionCreditsBurnedRef.current
      setSessionSummary({ totalTimeMin: totalMinutes, totalCost })
      if (totalMinutes > 0) addGamingMinutesToday(totalMinutes)
      setEngineActive(false)
      setElapsedSeconds(0)
      setSessionCreditsBurned(0)
      lastDeductedMinuteRef.current = 0
      return
    }

    for (let m = oldLast + 1; m <= currentMinute; m++) {
      selectedIds.forEach((id) => spendPoints(id, 1, reason))
    }
    lastDeductedMinuteRef.current = currentMinute
    setSessionCreditsBurned((prev) => prev + (currentMinute - oldLast) * selectedIds.length)
  }, [engineActive, elapsedSeconds, selectedIds, reason, spendPoints, addGamingMinutesToday])

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

      {/* 2. Pilot Selector: Roma | Kirill | BOTH */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">Пилот</p>
        <div className="flex rounded-2xl border-[3px] border-slate-600 overflow-hidden bg-slate-700/80 p-1">
          {PILOT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPilot(opt.id)}
              disabled={engineActive}
              className={cn(
                'flex-1 min-h-[44px] rounded-xl font-gaming text-sm font-bold uppercase transition touch-manipulation text-pop',
                pilot === opt.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 disabled:opacity-60'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. The Engine: START ENGINE / STOP ENGINE + Fuel Gauge when active */}
      <div className="flex flex-col gap-3">
        <motion.button
          type="button"
          onClick={engineActive ? stopEngine : startEngine}
          disabled={!engineActive && !canStart}
          className={cn(
            'w-full font-gaming font-black uppercase tracking-widest py-6 sm:py-7 text-xl sm:text-2xl rounded-3xl border-[4px] transition touch-manipulation text-pop shadow-[0_6px_0_rgba(0,0,0,0.3)]',
            engineActive
              ? 'border-red-500/90 bg-red-500/20 text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.4)]'
              : canStart
                ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:bg-emerald-500/30'
                : 'border-slate-700 bg-slate-800/60 text-slate-500 cursor-not-allowed'
          )}
          whileHover={engineActive || canStart ? { scale: 1.02 } : undefined}
          whileTap={engineActive || canStart ? { scale: 0.98 } : undefined}
          animate={engineActive ? { boxShadow: ['0 0 24px rgba(239,68,68,0.4)', '0 0 32px rgba(239,68,68,0.6)', '0 0 24px rgba(239,68,68,0.4)'] } : {}}
          transition={{ duration: 1.5, repeat: engineActive ? Infinity : 0 }}
        >
          {engineActive ? '⏹ ОСТАНОВИТЬ ДВИГАТЕЛЬ' : '▶ ЗАПУСК ДВИГАТЕЛЯ'}
        </motion.button>

        {!canStart && !engineActive && selectedIds.length > 0 && (
          <p className="font-mono text-red-400 text-xs uppercase text-center">
            Недостаточно кредитов (1 кр = 1 мин)
          </p>
        )}

        {/* When active: Burning Fuse / Fuel Gauge + Time + Session Cost */}
        {engineActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-[3px] border-orange-500/50 bg-slate-800/95 p-4 sm:p-5 space-y-4 animate-burn-pulse shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
          >
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Время
              </p>
              <div className="font-gaming text-3xl sm:text-4xl font-black tabular-nums rounded-2xl border-[3px] border-orange-500/50 bg-slate-800/95 px-5 py-4 text-center text-orange-100 text-pop">
                {formatElapsed(elapsedSeconds)}
              </div>
            </div>

            {/* Fuel Gauge (depletes as time passes) */}
            <div>
              <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Топливо
              </p>
              <div className="h-3 rounded-full bg-slate-800 border border-slate-600 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600"
                  animate={{ width: `${fuelGaugePercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Session Cost (Burned: X credits) */}
            <div className="rounded-2xl border-[3px] border-red-500/50 bg-slate-800/90 px-4 py-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">
                Сожжено
              </p>
              <p className="font-lcd text-xl sm:text-2xl font-bold tabular-nums text-red-400">
                −{sessionCreditsBurned} кр
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* 5. Session Summary Modal */}
      {sessionSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-end-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 border-[3px] border-slate-600 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
          >
            <h2 id="session-end-title" className="font-gaming text-xl text-white uppercase mb-4">
              Сессия завершена
            </h2>
            <p className="font-mono text-slate-400 text-sm mb-1">Время</p>
            <p className="font-lcd text-2xl font-bold text-cyan-400 mb-4">
              {sessionSummary.totalTimeMin} мин
            </p>
            <p className="font-mono text-slate-400 text-sm mb-1">Списано</p>
            <p className="font-lcd text-2xl font-bold text-red-400 mb-6">
              {sessionSummary.totalCost} кр
            </p>
            <button
              type="button"
              onClick={() => setSessionSummary(null)}
              className="w-full min-h-[52px] rounded-2xl border-[3px] border-cyan-500/70 bg-cyan-500/25 font-gaming font-bold text-cyan-100 uppercase hover:bg-cyan-500/35 transition touch-manipulation text-pop"
            >
              ОК
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
