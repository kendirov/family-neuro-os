import { cn } from '@/lib/utils'

type MacroButtonProps = {
  label: string
  summary?: string
  disabled?: boolean
  onClick: () => void
}

export function MacroButton({ label, summary, disabled, onClick }: MacroButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-[44px] rounded-xl border border-white/10 px-4 text-sm font-semibold tracking-tight',
        'bg-white/[0.04] text-slate-100 transition',
        'hover:bg-white/[0.08] hover:border-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <span className="block">{label}</span>
      {summary ? (
        <span className="mt-0.5 block font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {summary}
        </span>
      ) : null}
    </button>
  )
}
