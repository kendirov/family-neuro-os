/**
 * TimerDispatchPanel — командный центр таймера для Admin.
 * Строго из глобального store: startTimer, pauseTimer, stopTimer (profiles + Realtime).
 */
import { useState, useEffect } from 'react'
import { Gamepad2, Tv, Play, Pause, Square } from 'lucide-react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import { playEngineRev, playError, playCashRegister } from '@/lib/sounds'
import { useAppStore } from '@/stores/useAppStore'

const GLASS = 'bg-white/5 backdrop-blur-xl border border-white/10'
const PILOT_IDS = ['kirill', 'roma']
const PILOT_LABELS = { kirill: 'Кирилл', roma: 'Рома' }
const PILOT_COLORS = { kirill: 'purple', roma: 'cyan' }

/** Форматирует секунды в "MM:SS" или "HH:MM:SS". */
function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TimerDispatchPanel({ onShowToast }) {
  const users = useAppStore((s) => s.users)
  const pilots = useAppStore((s) => s.pilots)
  const startTimer = useAppStore((s) => s.startTimer)
  const pauseTimer = useAppStore((s) => s.pauseTimer)
  const stopTimer = useAppStore((s) => s.stopTimer)

  const [target, setTarget] = useState('both')
  const [activity, setActivity] = useState('game')
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  const selectedUserIds = target === 'both' ? PILOT_IDS : [target]

  const canStart = selectedUserIds.every((id) => {
    const u = users.find((x) => x.id === id)
    return u && u.balance >= 1
  })

  const anyRunning = selectedUserIds.some((id) => pilots?.[id]?.timerStatus === 'running')
  const anyPaused = selectedUserIds.some((id) => pilots?.[id]?.timerStatus === 'paused')
  const canPause = anyRunning
  const canStop = anyRunning || anyPaused

  useEffect(() => {
    if (!anyRunning) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [anyRunning])

  const mode = activity === 'cartoon' ? 'youtube' : 'game'

  const handleStart = async () => {
    if (!canStart) return
    const alreadyRunning = selectedUserIds.filter((id) => pilots?.[id]?.timerStatus === 'running' || pilots?.[id]?.timerStatus === 'paused')
    if (alreadyRunning.length > 0) {
      const names = alreadyRunning.map((id) => PILOT_LABELS[id]).join(', ')
      onShowToast?.({ message: `Уже запущено: ${names}`, variant: 'alert' })
      return
    }
    setLoading(true)
    try {
      for (const id of selectedUserIds) {
        await startTimer(id, mode)
      }
      playEngineRev()
      onShowToast?.({ message: `Старт — ${selectedUserIds.map((id) => PILOT_LABELS[id]).join(', ')}`, variant: 'success' })
    } catch (e) {
      playError()
      onShowToast?.({ message: 'Ошибка запуска', variant: 'alert' })
    } finally {
      setLoading(false)
    }
  }

  const handlePause = async () => {
    if (!canPause) return
    setLoading(true)
    try {
      for (const id of selectedUserIds) {
        if (pilots?.[id]?.timerStatus === 'running') await pauseTimer(id)
      }
      onShowToast?.({ message: 'Пауза', variant: 'success' })
    } catch (e) {
      playError()
      onShowToast?.({ message: 'Ошибка паузы', variant: 'alert' })
    } finally {
      setLoading(false)
    }
  }

  const handleResume = async () => {
    if (!anyPaused) return
    setLoading(true)
    try {
      for (const id of selectedUserIds) {
        if (pilots?.[id]?.timerStatus === 'paused') await startTimer(id, pilots[id].mode ?? mode)
      }
      playEngineRev()
      onShowToast?.({ message: 'Продолжение', variant: 'success' })
    } catch (e) {
      playError()
      onShowToast?.({ message: 'Ошибка продолжения', variant: 'alert' })
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!canStop) return
    setLoading(true)
    try {
      for (const id of selectedUserIds) {
        if (pilots?.[id]?.timerStatus !== 'idle') await stopTimer(id)
      }
      playCashRegister()
      onShowToast?.({ message: 'Сессия завершена, XP списаны', variant: 'success' })
    } catch (e) {
      playError()
      onShowToast?.({ message: 'Ошибка завершения', variant: 'alert' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col gap-4">
      <h3 className="font-gaming text-xs text-slate-400 uppercase tracking-wider shrink-0">
        Диспетчер таймера
      </h3>

      {/* Target Selector */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Цель</span>
        <div className={cn('flex rounded-xl overflow-hidden', GLASS)}>
          {[
            { id: 'roma', label: 'Рома' },
            { id: 'kirill', label: 'Кирилл' },
            { id: 'both', label: 'Оба' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={cn(
                'flex-1 min-h-[44px] px-4 font-mono text-xs font-bold uppercase transition touch-manipulation',
                target === id
                  ? 'bg-white/15 text-white border-b-2 border-cyan-400/60'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Selector */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Активность</span>
        <div className={cn('flex rounded-xl overflow-hidden', GLASS)}>
          <button
            type="button"
            onClick={() => setActivity('game')}
            className={cn(
              'flex-1 min-h-[44px] px-4 font-mono text-xs font-bold uppercase transition touch-manipulation flex items-center justify-center gap-2',
              activity === 'game'
                ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400/60'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}
          >
            <Gamepad2 className="h-4 w-4" strokeWidth={2.5} />
            Игры
          </button>
          <button
            type="button"
            onClick={() => setActivity('cartoon')}
            className={cn(
              'flex-1 min-h-[44px] px-4 font-mono text-xs font-bold uppercase transition touch-manipulation flex items-center justify-center gap-2',
              activity === 'cartoon'
                ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400/60'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}
          >
            <Tv className="h-4 w-4" strokeWidth={2.5} />
            Мультики
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart || loading}
          className={cn(
            'flex-1 min-h-[56px] rounded-xl font-gaming text-sm font-black uppercase transition touch-manipulation flex items-center justify-center gap-2',
            GLASS,
            canStart && !loading
              ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/35'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          <Play className="h-5 w-5" strokeWidth={2.5} />
          СТАРТ
        </button>
        <button
          type="button"
          onClick={anyPaused ? handleResume : handlePause}
          disabled={(!canPause && !anyPaused) || loading}
          className={cn(
            'flex-1 min-h-[56px] rounded-xl font-gaming text-sm font-black uppercase transition touch-manipulation flex items-center justify-center gap-2',
            GLASS,
            (canPause || anyPaused) && !loading
              ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 hover:bg-amber-500/35'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          {anyPaused ? (
            <><Play className="h-5 w-5" strokeWidth={2.5} /> ПРОДОЛЖИТЬ</>
          ) : (
            <><Pause className="h-5 w-5" strokeWidth={2.5} /> ПАУЗА</>
          )}
        </button>
        <button
          type="button"
          onClick={handleStop}
          disabled={!canStop || loading}
          className={cn(
            'flex-1 min-h-[56px] rounded-xl font-gaming text-sm font-black uppercase transition touch-manipulation flex items-center justify-center gap-2',
            GLASS,
            canStop && !loading
              ? 'bg-red-500/25 text-red-300 border-red-400/50 hover:bg-red-500/35'
              : 'opacity-50 cursor-not-allowed'
          )}
        >
          <Square className="h-5 w-5" strokeWidth={2.5} />
          СТОП И СПИСАТЬ
        </button>
      </div>

      {/* Live Monitoring — из pilots (store, Realtime) */}
      {selectedUserIds.some((id) => pilots?.[id]?.timerStatus !== 'idle') && (
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            Активные сессии
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedUserIds
              .filter((id) => pilots?.[id]?.timerStatus !== 'idle')
              .map((id) => {
                const p = pilots[id]
                const isActive = p?.timerStatus === 'running'
                let elapsed = p?.sessionElapsed ?? 0
                if (isActive && p?.timerStartAt) {
                  elapsed = Math.max(0, Math.floor((Date.now() - new Date(p.timerStartAt).getTime()) / 1000))
                }
                const color = PILOT_COLORS[id] ?? 'slate'
                const modeLabel = p?.mode === 'youtube' || p?.mode === 'good' ? '📺 Мультики' : '🎮 Игра'
                return (
                  <div
                    key={id}
                    className={cn(
                      'rounded-xl px-4 py-3 flex items-center justify-between',
                      GLASS,
                      color === 'cyan' && 'border-cyan-500/30',
                      color === 'purple' && 'border-purple-500/30'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        'font-mono text-xs font-bold uppercase',
                        color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'
                      )}>
                        {PILOT_LABELS[id]}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {modeLabel}
                        {isActive && (
                          <span className="ml-1.5 text-emerald-400/80">●</span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-bold tabular-nums text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      {formatElapsed(elapsed)}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
