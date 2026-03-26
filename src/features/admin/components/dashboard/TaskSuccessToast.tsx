import { cn } from '@/lib/utils'

type TaskSuccessToastProps = {
  message: string | null
  tone?: 'success' | 'error'
}

export function TaskSuccessToast({ message, tone = 'success' }: TaskSuccessToastProps) {
  if (!message) return null
  return (
    <div
      className={cn(
        'pointer-events-none absolute right-3 top-3 z-20 rounded-lg border border-white/10',
        tone === 'success'
          ? 'bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-xl'
          : 'bg-red-500/12 px-3 py-1.5 text-xs font-medium text-red-200 backdrop-blur-xl',
        'shadow-[0_6px_16px_rgba(0,0,0,0.25)]'
      )}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
