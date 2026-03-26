import { cn } from '@/lib/utils'

export function WeekdayLessonsCompact({
  lessons,
  highlight,
}: {
  lessons: Array<{ id: string; subject: string; startTime: string; endTime: string }>
  highlight?: boolean
}) {
  if (!lessons.length) {
    return (
      <div className={cn('rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-2 py-1.5', highlight && 'border-white/20')}>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">—</span>
      </div>
    )
  }

  const visible = lessons.slice(0, 3)
  const rest = Math.max(0, lessons.length - visible.length)

  return (
    <div className={cn('flex flex-wrap gap-1.5', highlight && '')}>
      {visible.map((l) => (
        <div
          key={l.id}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1',
            'min-w-0'
          )}
        >
          <span className="font-mono text-[10px] tabular-nums text-slate-500 shrink-0">
            {l.startTime}–{l.endTime}
          </span>
          <span className="font-mono text-[11px] text-slate-200 truncate max-w-[18ch]">
            {l.subject}
          </span>
        </div>
      ))}
      {rest > 0 ? (
        <div className="inline-flex items-center rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">+{rest}</span>
        </div>
      ) : null}
    </div>
  )
}

