import { cn } from '@/lib/utils'

/**
 * TaskGroup: compact control block wrapper for pilot tasks.
 * Renders a titled card with vibrant colors and high-contrast headers.
 */
export function TaskGroup({ title, subtitle, children, className, headerClass, bodyClass, titleColor = 'text-blue-400' }) {
  return (
    <section
      className={cn(
        'rounded-2xl border-[3px] border-slate-600/70 bg-slate-800/70 shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
        'overflow-hidden',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-slate-600/60 bg-gradient-to-r from-slate-800/95 to-slate-700/95',
          headerClass
        )}
      >
        <h3 className={cn('font-gaming text-sm font-black uppercase tracking-wider', titleColor)}>
          {title}
        </h3>
        {subtitle && (
          <p className="font-mono text-[10px] text-slate-300 uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
      <div className={cn('px-3 py-3', bodyClass)}>{children}</div>
    </section>
  )
}

