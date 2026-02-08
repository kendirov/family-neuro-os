import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { useAppStore } from '@/stores/useAppStore'
import { playAlarm, playStart } from '@/lib/sounds'
import { cn } from '@/lib/utils'

const PLAYER_OPTIONS = [
  { id: 'roma', label: 'РОМА' },
  { id: 'kirill', label: 'КИРИЛЛ' },
  { id: 'both', label: 'ОБА ПИЛОТА' },
]

const MIN_MINUTES = 1
const MAX_MINUTES = 120

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function GamingProtocol() {
  const users = useAppStore((s) => s.users)
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)

  const [screen, setScreen] = useState('setup') // 'setup' | 'active' | 'expired'
  const [playerChoice, setPlayerChoice] = useState(null) // 'roma' | 'kirill' | 'both'
  const [minutes, setMinutes] = useState(30)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [userIds, setUserIds] = useState([])
  const intervalRef = useRef(null)
  const alarmPlayedRef = useRef(false)

  const selectedUserIds =
    playerChoice === 'both' ? ['roma', 'kirill'] : playerChoice ? [playerChoice] : []
  const costPerUser = minutes
  const totalCostDisplay =
    playerChoice === 'both' ? `${minutes} XP каждому (всего ${minutes * 2})` : `${minutes} XP`
  const canStart =
    selectedUserIds.length > 0 &&
    selectedUserIds.every((id) => {
      const u = users.find((u) => u.id === id)
      return u && u.balance >= minutes
    })

  const startSession = () => {
    if (!canStart) return
    playStart()
    selectedUserIds.forEach((id) => spendPoints(id, minutes, 'Игровое время'))
    setUserIds(selectedUserIds)
    setSecondsRemaining(minutes * 60)
    setScreen('active')
  }

  const stopAndRefund = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    const remainingMinutes = Math.ceil(secondsRemaining / 60)
    userIds.forEach((id) => addPoints(id, remainingMinutes, 'Возврат за игру'))
    setScreen('setup')
    setPlayerChoice(null)
    setMinutes(30)
  }

  useEffect(() => {
    if (screen !== 'active') return
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [screen])

  useEffect(() => {
    if (screen === 'active' && secondsRemaining === 0) {
      setScreen('expired')
      if (!alarmPlayedRef.current) {
        playAlarm()
        alarmPlayedRef.current = true
      }
    }
  }, [screen, secondsRemaining])

  const resetAfterExpired = () => {
    alarmPlayedRef.current = false
    setScreen('setup')
    setPlayerChoice(null)
    setMinutes(30)
    setUserIds([])
  }

  if (screen === 'expired') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-alert text-white">
        <div className="animate-expire-flash absolute inset-0 bg-alert" />
        <p className="font-mono text-2xl md:text-3xl font-bold tracking-wide text-center px-4">
          СЕССИЯ ЗАВЕРШЕНА. ВЫХОД.
        </p>
        <button
          type="button"
          onClick={resetAfterExpired}
          className="mt-8 px-6 py-3 rounded-lg border-2 border-white/50 font-mono text-sm hover:bg-white/10 transition"
        >
          ОК
        </button>
      </div>
    )
  }

  if (screen === 'active') {
    return (
      <KioskLayout>
        <div className="absolute inset-0 bg-slate-950/95 pointer-events-none" aria-hidden />
        <div
          className="absolute inset-0 bg-roma/20 animate-gaming-pulse pointer-events-none"
          aria-hidden
        />
        <Header />
        <main className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-0">
          <div className="font-mono text-7xl md:text-8xl tabular-nums text-white drop-shadow-lg">
            {formatCountdown(secondsRemaining)}
          </div>
          <p className="font-mono text-slate-400 mt-2 text-sm">
            {userIds.length > 1 ? 'Рома и Кирилл' : userIds[0] === 'roma' ? 'Рома' : 'Кирилл'}
          </p>
          <button
            type="button"
            onClick={stopAndRefund}
            className="mt-8 min-h-[52px] px-8 rounded-lg border border-slate-500 bg-slate-800/80 font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
          >
            Стоп и возврат
          </button>
        </main>
      </KioskLayout>
    )
  }

  return (
    <KioskLayout>
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>
          <span className="font-mono text-xs text-slate-600">ИГРОВОЙ ПРОТОКОЛ</span>
        </div>

        <div className="max-w-md mx-auto space-y-8">
          <section>
            <h2 className="font-mono text-sm text-slate-500 mb-3">Выбери пилотов</h2>
            <div className="flex gap-2 flex-wrap">
              {PLAYER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlayerChoice(opt.id === playerChoice ? null : opt.id)}
                  className={cn(
                    'min-h-[48px] px-5 rounded-lg border font-mono transition touch-manipulation',
                    playerChoice === opt.id
                      ? 'border-roma bg-roma/20 text-roma'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-mono text-sm text-slate-500 mb-3">Время (минуты)</h2>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="flex-1 h-3 rounded-full appearance-none bg-slate-700 accent-roma"
              />
              <input
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={minutes}
                onChange={(e) => {
                  const v = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Number(e.target.value) || MIN_MINUTES))
                  setMinutes(v)
                }}
                className="w-20 min-h-[48px] rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-white text-center tabular-nums"
              />
            </div>
          </section>

          <section>
            <p className="font-mono text-slate-400">
              Стоимость: <span className="text-roma font-semibold">{totalCostDisplay}</span>
              {playerChoice === 'both' && ' (спишется с каждого)'}
            </p>
            {selectedUserIds.length > 0 && !canStart && (
              <p className="font-mono text-alert text-sm mt-2">
                Недостаточно XP у одного или обоих пилотов.
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={startSession}
            disabled={!canStart}
            className={cn(
              'w-full min-h-[56px] rounded-xl border font-mono font-semibold transition touch-manipulation',
              canStart
                ? 'border-roma bg-roma/20 text-roma hover:bg-roma/30'
                : 'border-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            Начать сессию
          </button>
        </div>
      </main>
    </KioskLayout>
  )
}
