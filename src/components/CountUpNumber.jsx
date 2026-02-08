import { useState, useEffect, useRef } from 'react'

/**
 * Animates number from previous value to current (count-up) over a short duration.
 */
export function CountUpNumber({ value, duration = 400, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(null)

  useEffect(() => {
    const prev = prevRef.current
    if (prev === value) return

    const startTime = performance.now()
    const diff = value - prev

    const tick = (now) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - t) * (1 - t)
      setDisplay(Math.round(prev + diff * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else prevRef.current = value
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return <span className={className}>{display}</span>
}
