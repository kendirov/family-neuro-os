import { cn } from '@/lib/utils'

type PilotQuickXpAdjustProps = {
  busy?: boolean
  onPlus: () => void
  onMinus: () => void
}

export function PilotQuickXpAdjust({ busy, onPlus, onMinus }: PilotQuickXpAdjustProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={onPlus}
        className={cn(
          'min-h-[38px] rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold',
          'text-slate-100 transition hover:bg-white/[0.08] hover:border-white/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          busy && 'opacity-60 cursor-not-allowed'
        )}
      >
        +XP
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onMinus}
        className={cn(
          'min-h-[38px] rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold',
          'text-slate-300 transition hover:bg-white/[0.06] hover:border-white/20 hover:text-slate-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
          busy && 'opacity-60 cursor-not-allowed'
        )}
      >
        -XP
      </button>
    </div>
  )
}
