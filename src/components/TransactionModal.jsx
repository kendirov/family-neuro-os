import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playCoin, playError } from '@/lib/sounds'
import { cn } from '@/lib/utils'

const MAX_DIGITS = 6
const REASON_BONUS = 'Бонус (ручное)'
const REASON_FINE = 'Штраф (ручное)'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Quick Calculator modal for manual add/fine on a single user.
 * Display, numpad, presets [+10] [+50] [+100] [-10] [-50], ADD (green) / FINE (red), last 3 transactions.
 */
export function TransactionModal({ user, transactions = [], onClose, onShowToast }) {
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)

  const [display, setDisplay] = useState('')
  const [exiting, setExiting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const value = parseInt(display, 10)
  const numericValue = Number.isNaN(value) ? 0 : value
  const absValue = Math.min(999999, Math.abs(numericValue))

  const append = (digit) => {
    if (digit === '0' && (display === '' || display === '-')) return
    if (display.replace('-', '').length >= MAX_DIGITS) return
    setDisplay((d) => d + digit)
  }

  const clear = () => setDisplay('')
  const toggleSign = () => setDisplay((d) => (d === '' || d === '0' ? '-' : d.startsWith('-') ? d.slice(1) || '0' : '-' + d))

  const applyPreset = (delta) => {
    setDisplay(String(numericValue + delta))
  }

  const handleAdd = () => {
    if (absValue <= 0 || isSubmitting) return
    setIsSubmitting(true)
    addPoints(user.id, absValue, REASON_BONUS)
    playCoin()
    onShowToast?.({ message: `+${absValue} — ${user.name ?? user.id}`, variant: 'success' })
    clear()
    // Небольшой debounce + плавное закрытие, чтобы избежать двойных тапов.
    setTimeout(() => {
      setIsSubmitting(false)
      setExiting(true)
    }, 500)
  }

  const handleFine = () => {
    if (absValue <= 0 || isSubmitting) return
    setIsSubmitting(true)
    spendPoints(user.id, absValue, REASON_FINE)
    playError()
    onShowToast?.({ message: `−${absValue} — ${user.name ?? user.id}`, variant: 'alert' })
    clear()
    setTimeout(() => {
      setIsSubmitting(false)
      setExiting(true)
    }, 500)
  }

  const lastThree = (transactions ?? [])
    .filter((t) => t.userId === user.id)
    .slice(0, 3)

  const numpadDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

  const handleClose = () => {
    setExiting(true)
  }

  const modal = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.2 }}
      onAnimationComplete={() => exiting && onClose()}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: exiting ? 0.95 : 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border-[3px] border-slate-600 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-600 bg-slate-700/80">
            <h2
              id="transaction-modal-title"
              className="font-gaming text-base text-slate-200 uppercase tracking-wider text-pop"
            >
              {user.name ?? user.id} — Корректировка
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-600 transition touch-manipulation icon-pop"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Display */}
            <div className="rounded-2xl border-[3px] border-slate-600 bg-slate-900 px-5 py-5 text-right text-pop">
              <span
                className={cn(
                  'font-gaming text-3xl sm:text-4xl font-black tabular-nums',
                  numericValue < 0 ? 'text-red-400' : 'text-emerald-400'
                )}
              >
                {display === '' ? '0' : display}
              </span>
              <span className="font-gaming text-slate-400 text-base ml-1 font-bold">⚡ XP</span>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: '+10', delta: 10 },
                { label: '+50', delta: 50 },
                { label: '+100', delta: 100 },
                { label: '-10', delta: -10 },
                { label: '-50', delta: -50 },
              ].map(({ label, delta }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => !isSubmitting && applyPreset(delta)}
                  className={cn(
                    'min-h-[48px] flex-1 min-w-[64px] rounded-2xl border-[3px] font-gaming text-sm font-bold tabular-nums transition touch-manipulation text-pop',
                    delta >= 0
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 active:scale-95'
                      : 'border-red-500/60 bg-red-500/20 text-red-200 hover:bg-red-500/30 active:scale-95'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Numpad — big, finger-friendly */}
            <div className="grid grid-cols-3 gap-2">
              {numpadDigits.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => !isSubmitting && append(d)}
                  className="min-h-[52px] sm:min-h-[56px] rounded-2xl border-[3px] border-slate-600 bg-slate-700/90 font-gaming text-xl font-bold text-white hover:bg-slate-600 active:scale-95 transition touch-manipulation text-pop"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={toggleSign}
                className="min-h-[52px] sm:min-h-[56px] rounded-2xl border-[3px] border-slate-600 bg-slate-700/90 font-gaming text-sm font-bold text-slate-300 hover:bg-slate-600 active:scale-95 transition touch-manipulation"
              >
                +/−
              </button>
              <button
                type="button"
                onClick={clear}
                className="min-h-[52px] sm:min-h-[56px] rounded-2xl border-[3px] border-slate-600 bg-slate-700/90 font-gaming text-sm font-bold text-slate-300 hover:bg-slate-600 active:scale-95 transition touch-manipulation"
              >
                Очистить
              </button>
            </div>

            {/* Action buttons: ADD (green) / FINE (red) */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={absValue <= 0 || isSubmitting}
                className="min-h-[60px] rounded-2xl border-[3px] border-emerald-500 bg-emerald-500/30 font-gaming text-lg font-bold text-emerald-100 uppercase tracking-wider hover:bg-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition touch-manipulation text-pop shadow-[0_4px_0_rgba(0,0,0,0.2),0_0_20px_rgba(52,211,153,0.25)]"
              >
                НАЧИСЛИТЬ
              </button>
              <button
                type="button"
                onClick={handleFine}
                disabled={absValue <= 0 || isSubmitting}
                className="min-h-[60px] rounded-2xl border-[3px] border-red-500 bg-red-500/30 font-gaming text-lg font-bold text-red-100 uppercase tracking-wider hover:bg-red-500/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition touch-manipulation text-pop shadow-[0_4px_0_rgba(0,0,0,0.2),0_0_20px_rgba(239,68,68,0.25)]"
              >
                ШТРАФ
              </button>
            </div>

            {/* Last 3 transactions */}
            <div className="rounded-2xl border-[3px] border-slate-600 bg-slate-800/90 overflow-hidden">
              <p className="font-gaming text-xs text-slate-400 uppercase tracking-wider px-4 py-2.5 border-b-2 border-slate-600 text-pop">
                Последние операции
              </p>
              <ul className="divide-y divide-slate-700/80">
                {lastThree.length === 0 ? (
                  <li className="px-3 py-3 text-slate-500 font-mono text-sm">— нет записей</li>
                ) : (
                  lastThree.map((t) => {
                    const isEarn = t.amount > 0
                    return (
                      <li
                        key={t.id ?? t.at}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 font-mono text-sm"
                      >
                        <span className="text-slate-500 truncate flex-1 min-w-0">
                          {formatTime(t.at)}
                        </span>
                        <span className="truncate text-slate-300 min-w-0 max-w-[140px]">
                          {t.description}
                        </span>
                        <span
                          className={cn(
                            'tabular-nums font-bold shrink-0',
                            isEarn ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {isEarn ? `+${t.amount}` : t.amount}
                        </span>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
  )

  return createPortal(modal, document.body)
}
