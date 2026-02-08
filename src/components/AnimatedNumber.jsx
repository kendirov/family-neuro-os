import { motion, AnimatePresence } from 'framer-motion'

/**
 * Number that scrolls up when value increases (balance / countdown style).
 */
export function AnimatedNumber({ value, className = '', format = (n) => n }) {
  const display = format(value)

  return (
    <span className={`inline-block tabular-nums overflow-hidden min-w-[1.2em] ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="inline-block"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
