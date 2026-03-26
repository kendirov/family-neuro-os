import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { PilotTimerSelector } from './PilotTimerSelector'
import { DurationPresetPicker } from './DurationPresetPicker'
import { useTimerDraftState, useTimerConnectionState, useTimerSessionsByPilotId } from '@/features/timer/lib/timer-selectors-hooks'
import { isSessionActive } from '../../lib/admin-timer-ui-model'
import { timerCommands } from '@/features/timer/lib/timer-commands'
import type { TimerMode } from '@/features/timer/lib/timer-types'
import { useAppStore } from '@/stores/useAppStore'

type AdminTimerControlPanelProps = {
  className?: string
}

function getTargetIds(selected: 'both' | 'kirill' | 'roma' | null) {
  if (!selected) return [] as Array<'kirill' | 'roma'>
  if (selected === 'both') return ['kirill', 'roma']
  return [selected]
}

export function AdminTimerControlPanel({ className }: AdminTimerControlPanelProps) {
  const { selectedPilotId, uiDraftDurationMinutes, uiDraftCustomMinutes } = useTimerDraftState()
  const { connectionStatus } = useTimerConnectionState()
  const sessionsByPilotId = useTimerSessionsByPilotId()

  const users = useAppStore((s) => s.users)
  const [busy, setBusy] = useState(false)

  const durationMinutes = uiDraftCustomMinutes ?? uiDraftDurationMinutes
  const targets = getTargetIds(selectedPilotId as any)
  const stale = connectionStatus === 'stale' || connectionStatus === 'error' || connectionStatus === 'connecting'

  const blockers = useMemo(() => {
    const reasons: string[] = []
    if (!targets.length) reasons.push('Выберите пилота')
    if (durationMinutes <= 0) reasons.push('Укажите длительность')

    for (const id of targets) {
      const session = sessionsByPilotId?.[id]
      if (isSessionActive(session)) reasons.push(`Уже активна сессия: ${id}`)
      const bal = users.find((u) => u.id === id)?.balance ?? 0
      if (bal < durationMinutes) reasons.push(`Недостаточно топлива у ${id} (нужно ${durationMinutes}м)`)
    }

    if (stale) reasons.push('Нет live-связи с сервером')
    return reasons
  }, [targets, durationMinutes, sessionsByPilotId, users, stale])

  const canStart = blockers.length === 0

  const handleStart = async () => {
    if (!canStart) return
    setBusy(true)
    try {
      const mode: TimerMode = 'game'
      await timerCommands.startTimer({
        pilotId: (selectedPilotId ?? 'both') as any,
        durationMinutes,
        mode,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={cn(
        className,
        'rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_24px_rgba(0,0,0,0.22)]'
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">Управление</h2>
          <p className="mt-1 text-xs text-slate-400">
            Сервер — источник правды. Эта панель только отправляет команды и слушает live-состояние.
          </p>
        </div>
        <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          draft {durationMinutes}m
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <PilotTimerSelector />
        <DurationPresetPicker />

        <div className="pt-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart || busy}
            className={cn(
              'w-full min-h-[54px] rounded-2xl border px-5 text-sm font-semibold tracking-tight transition touch-manipulation',
              canStart && !busy
                ? 'border-white/20 bg-white/[0.10] text-slate-50 hover:bg-white/[0.14]'
                : 'border-white/10 bg-white/[0.03] text-slate-500 cursor-not-allowed'
            )}
          >
            Ignite Engine
          </button>
          {!canStart ? (
            <div className="mt-2 text-xs text-slate-500">
              {blockers.slice(0, 2).join(' · ')}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

