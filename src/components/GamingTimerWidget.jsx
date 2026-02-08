import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playSiren, playError } from '@/lib/sounds'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { cn } from '@/lib/utils'

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Format total minutes as "1ч 20м". */
function formatDailyTotal(minutes) {
  if (minutes < 60) return `${minutes}м`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}ч ${m}м` : `${h}ч`
}

const PLAYER_OPTIONS = [
  { id: 'roma', label: 'РОМА', huge: true },
  { id: 'kirill', label: 'КИРИЛЛ', huge: true },
  { id: 'both', label: 'ОБА ПИЛОТА', huge: false },
]

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 0 = Sun, 1 = Mon, ... 6 = Sat. Weekday = Mon–Fri. */
function isWeekday() {
  const d = new Date().getDay()
  return d >= 1 && d <= 5
}

/**
 * Credits burned for elapsed seconds (stopwatch).
 * Weekday: 1 credit/min first 60 min, then 2 credits/min (overdrive).
 * Weekend: 1 credit/min always.
 */
function creditsBurnedAt(elapsedSeconds, weekday) {
  const minutes = Math.floor(elapsedSeconds / 60)
  if (!weekday) return minutes
  if (minutes <= 60) return minutes
  return 60 + (minutes - 60) * 2
}

/** Current burn rate: 1 or 2 (overdrive only on weekday when elapsed > 60 min). */
function currentBurnRate(elapsedSeconds, weekday) {
  if (!weekday) return 1
  return Math.floor(elapsedSeconds / 60) >= 60 ? 2 : 1
}

export function GamingTimerWidget() {
  const users = useAppStore((s) => s.users)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const addGamingMinutesToday = useAppStore((s) => s.addGamingMinutesToday)
  const gamingToday = useAppStore((s) => s.gamingToday)
  const [playerChoice, setPlayerChoice] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'running'
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [deductedCredits, setDeductedCredits] = useState(0)
  const intervalRef = useRef(null)
  const sirenPlayedRef = useRef(false)

  const selectedUserIds =
    playerChoice === 'both' ? ['roma', 'kirill'] : playerChoice ? [playerChoice] : []
  const weekday = isWeekday()

  /** Can start if at least 1 credit per selected pilot (so we can burn at least 1 minute). */
  const canStart =
    selectedUserIds.length > 0 &&
    selectedUserIds.every((id) => {
      const u = users.find((u) => u.id === id)
      return u && u.balance >= 1
    })

  const totalCreditsBurned = creditsBurnedAt(elapsedSeconds, weekday)
  const burnRate = currentBurnRate(elapsedSeconds, weekday)
  const isOverdrive = weekday && Math.floor(elapsedSeconds / 60) >= 60

  const stopEngine = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setStatus('idle')
    setElapsedSeconds(0)
    setDeductedCredits(0)
    sirenPlayedRef.current = false
  }

  const startEngine = () => {
    if (status !== 'idle' || !canStart) return
    playEngineRev()
    setElapsedSeconds(0)
    setDeductedCredits(0)
    sirenPlayedRef.current = false
    setStatus('running')
  }

  /** Timer tick: count up every second when running. */
  useEffect(() => {
    if (status !== 'running') return
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status])

  /** Every minute: deduct credits. If any pilot hits 0 balance, auto-stop and play failure. */
  useEffect(() => {
    if (status !== 'running') return
    const total = creditsBurnedAt(elapsedSeconds, weekday)
    if (total <= deductedCredits) return
    const delta = total - deductedCredits
    selectedUserIds.forEach((id) => spendPoints(id, delta, 'Игровое время'))
    addGamingMinutesToday(1) // one minute boundary crossed
    setDeductedCredits(total)

    // Safety: after deducting, check if any selected user has balance <= 0 → auto-stop
    const currentUsers = useAppStore.getState().users
    const anyZero = selectedUserIds.some((id) => {
      const u = currentUsers.find((u) => u.id === id)
      return u && u.balance <= 0
    })
    if (anyZero) {
      playError()
      setStatus('idle')
      setElapsedSeconds(0)
      setDeductedCredits(0)
      sirenPlayedRef.current = false
    }
  }, [elapsedSeconds, status, weekday, selectedUserIds, deductedCredits, spendPoints, addGamingMinutesToday])

  /** Overdrive siren (weekday, after 60 min). */
  useEffect(() => {
    if (isOverdrive && !sirenPlayedRef.current) {
      playSiren()
      sirenPlayedRef.current = true
    }
  }, [isOverdrive])

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 shrink-0 flex flex-col gap-3">
      {/* Main action FIRST and BIGGEST: Engine Start (idle) or Stop (running) */}
      <div className="flex flex-col gap-2">
        {status === 'idle' && (
          <button
            type="button"
            onClick={startEngine}
            disabled={!canStart}
            className={cn(
              'w-full font-lcd font-bold uppercase tracking-widest py-5 sm:py-6 text-xl sm:text-2xl md:text-3xl lg:text-4xl transition touch-manipulation rounded-2xl border-[3px]',
              canStart ? 'btn-push-start' : 'border-slate-700 bg-slate-800/60 text-slate-500 cursor-not-allowed'
            )}
          >
            ▶ ЗАПУСК ДВИГАТЕЛЯ
          </button>
        )}
        {status === 'running' && (
          <button
            type="button"
            onClick={stopEngine}
            className="w-full font-lcd font-bold uppercase tracking-widest py-5 sm:py-6 text-xl sm:text-2xl md:text-3xl lg:text-4xl btn-push-stop touch-manipulation rounded-2xl border-[3px] animate-heartbeat"
          >
            СТОП
          </button>
        )}
      </div>

      <h3 className="font-mono text-xs text-slate-400 uppercase tracking-wider">
        СИСТЕМА СЖИГАНИЯ ТОПЛИВА
      </h3>

      {/* Pilot: РОМА | КИРИЛЛ | ОБА ПИЛОТА */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 mb-1.5 uppercase">Пилот</p>
        <div className="flex gap-2">
          {PLAYER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPlayerChoice(opt.id)}
              disabled={status === 'running'}
              className={cn(
                'flex-1 min-h-[36px] rounded-lg border font-mono uppercase transition touch-manipulation',
                opt.huge ? 'text-lg sm:text-xl font-bold' : 'text-xs',
                playerChoice === opt.id
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white disabled:opacity-60'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard HUD: only when Engine is ON */}
      {status === 'running' && (
        <div className="mb-3 rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 sm:p-4">
          {/* Centerpiece: CURRENT SESSION + large digital clock */}
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            ТЕКУЩАЯ СЕССИЯ
          </p>
          <div
            className={cn(
              'font-lcd text-4xl sm:text-5xl md:text-6xl tabular-nums rounded-lg border-2 px-4 py-3 text-center mb-4',
              isOverdrive ? 'timer-overdrive animate-burn-pulse' : 'bg-slate-800/90 border-slate-600 text-cyan-400'
            )}
          >
            {isOverdrive && (
              <span className="flame-bar inline-block mr-1" aria-hidden>🔥</span>
            )}
            <span className="clock-glow">{formatElapsed(elapsedSeconds)}</span>
            {isOverdrive && (
              <span className="flame-bar inline-block ml-1" aria-hidden>🔥</span>
            )}
          </div>

          {/* Burn log: ПОТРАЧЕНО ЗА СЕАНС — prominent when running */}
          <div className="rounded-lg border-2 border-red-500/40 bg-slate-900/90 px-3 py-2.5 mb-3">
            <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">
              ПОТРАЧЕНО ЗА СЕАНС
            </p>
            <p className="font-lcd text-xl sm:text-2xl font-bold tabular-nums text-red-400">
              −<AnimatedNumber value={totalCreditsBurned} format={(n) => String(n)} />
            </p>
          </div>

          {/* Live Stats Grid: 3 columns */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-2.5 text-center">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">РАСХОД</p>
              <p
                className={cn(
                  'font-lcd text-sm sm:text-base font-bold tabular-nums',
                  isOverdrive ? 'text-alert animate-burn-pulse' : 'text-emerald-400'
                )}
              >
                {burnRate} кр/мин
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-2.5 text-center col-span-2">
              <p className="font-mono text-[10px] text-slate-500 uppercase mb-0.5">ВСЕГО СЕГОДНЯ</p>
              <p className="font-lcd text-sm sm:text-base font-bold tabular-nums text-cyan-400">
                {formatDailyTotal(
                  gamingToday?.dateKey === getDateKey() ? (gamingToday?.minutes ?? 0) : 0
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Idle: need at least 1 credit to start */}
      {status === 'idle' && selectedUserIds.length > 0 && !canStart && (
        <p className="font-mono text-alert text-xs uppercase">Недостаточно кредитов (нужен минимум 1 кр)</p>
      )}
    </div>
  )
}
