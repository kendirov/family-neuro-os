import { useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Brief toast for add-points feedback. No global store — pass message + onDone.
 */
export function Toast({ message, variant = 'success', onDone, duration = 2000 }) {
  useEffect(() => {
    const id = setTimeout(() => onDone?.(), duration)
    return () => clearTimeout(id)
  }, [onDone, duration])

  const styles = {
    success: 'bg-success/90 text-white border-success',
    cyan: 'bg-roma/90 text-slate-950 border-roma',
    purple: 'bg-kirill/90 text-white border-kirill',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-3 font-mono text-sm shadow-lg animate-toast-in',
        styles[variant] ?? styles.success
      )}
    >
      {message}
    </div>
  )
}
