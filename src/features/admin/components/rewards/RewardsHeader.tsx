import { cn } from '@/lib/utils'

type RewardsHeaderStat = {
  label: string
  value: string
}

type RewardsHeaderProps = {
  title: string
  description: string
  stats?: RewardsHeaderStat[]
  right?: React.ReactNode
  className?: string
}

export function RewardsHeader({ title, description, stats, right, className }: RewardsHeaderProps) {
  return (
    <header className={cn('mb-4 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-300/90">{description}</p>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {stats && stats.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {s.label}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">
                {s.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="h-px w-full bg-white/10" aria-hidden />
    </header>
  )
}

