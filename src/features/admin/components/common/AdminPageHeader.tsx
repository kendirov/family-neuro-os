import { cn } from '@/lib/utils'

type AdminPageHeaderProps = {
  title: string
  description?: string
  right?: React.ReactNode
  className?: string
}

export function AdminPageHeader({ title, description, right, className }: AdminPageHeaderProps) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-300/90">{description}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="h-px w-full bg-white/10" aria-hidden />
    </header>
  )
}

