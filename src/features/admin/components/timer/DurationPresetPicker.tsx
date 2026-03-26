import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTimerDraftState } from '@/features/timer/lib/timer-selectors-hooks'

type DurationPresetPickerProps = {
  className?: string
}

const PRESETS = [15, 30, 60]

export function DurationPresetPicker({ className }: DurationPresetPickerProps) {
  const { uiDraftDurationMinutes, uiDraftCustomMinutes, setDraftDuration, setDraftCustomMinutes } =
    useTimerDraftState()
  const [localInput, setLocalInput] = useState<string>('')

  const effectiveMinutes = uiDraftCustomMinutes ?? uiDraftDurationMinutes
  const isPreset = useMemo(() => PRESETS.includes(uiDraftDurationMinutes), [uiDraftDurationMinutes])

  return (
    <div className={cn(className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Длительность</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{effectiveMinutes}м</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((m) => {
          const active = uiDraftCustomMinutes == null && uiDraftDurationMinutes === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setDraftCustomMinutes(null)
                setDraftDuration(m)
              }}
              className={cn(
                'min-h-[44px] rounded-xl border px-4 text-sm font-semibold tracking-tight transition touch-manipulation',
                active
                  ? 'border-white/20 bg-white/[0.10] text-slate-50'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/20'
              )}
            >
              {m}m
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          inputMode="numeric"
          placeholder="Кастом, мин"
          className={cn(
            'h-11 rounded-xl border border-white/10 bg-slate-950/35 px-3 text-sm text-slate-100',
            'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20'
          )}
          aria-label="Кастомная длительность (минуты)"
        />
        <button
          type="button"
          onClick={() => {
            const n = Math.floor(Number(localInput))
            if (!Number.isFinite(n) || n <= 0) return
            setDraftCustomMinutes(n)
            if (!isPreset) setDraftDuration(uiDraftDurationMinutes)
          }}
          className={cn(
            'h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition',
            'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
        >
          Применить
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Длительность влияет на доступность старта (требует топлива \(\ge\) выбранным минутам).
      </div>
    </div>
  )
}

