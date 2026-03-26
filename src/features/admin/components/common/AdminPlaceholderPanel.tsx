import { cn } from '@/lib/utils'

type AdminPlaceholderPanelProps = {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
  tone?: 'default' | 'quiet'
}

export function AdminPlaceholderPanel({
  title,
  subtitle,
  children,
  className,
  tone = 'default',
}: AdminPlaceholderPanelProps) {
  return (
    <section
      className={cn(
        'panel-glass rounded-2xl border border-white/10',
        tone === 'quiet' ? 'bg-slate-950/40' : 'bg-white/5',
        'p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.25)]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">
          Placeholder
        </span>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  )
}

