import { cn } from '@/lib/utils'
import { useTimerDraftState } from '@/features/timer/lib/timer-selectors-hooks'

type PilotTimerSelectorProps = {
  className?: string
}

export function PilotTimerSelector({ className }: PilotTimerSelectorProps) {
  const { selectedPilotId, setSelectedPilot } = useTimerDraftState()

  return (
    <div className={cn(className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Пилот</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
          {selectedPilotId === 'both' ? 'оба' : selectedPilotId ?? '—'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'kirill' as const, label: 'Кирилл' },
          { id: 'roma' as const, label: 'Рома' },
          { id: 'both' as const, label: 'Оба' },
        ].map((opt) => {
          const active = selectedPilotId === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedPilot(opt.id)}
              className={cn(
                'min-h-[44px] rounded-xl border px-4 text-sm font-semibold tracking-tight transition touch-manipulation',
                active
                  ? 'border-white/20 bg-white/[0.10] text-slate-50'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:border-white/20'
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

