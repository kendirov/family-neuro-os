import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Candy,
  Banknote,
  Package,
  UtensilsCrossed,
  X,
  Trash2,
} from 'lucide-react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { Toast } from '@/components/Toast'
import { BlueRacerHelmet, PurplePilotHelmet, PilotAvatar } from '@/components/HelmetAvatar'
import { useAppStore } from '@/stores/useAppStore'
import { MARKET_ITEMS } from '@/data/marketItems'
import { getMissionTasksByCategory, PENALTY_BOX } from '@/data/taskConfig'
import { playCoin, playAlarm, playStart, playError, playChime } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { ControlCenter } from '@/components/ControlCenter'
import { CountUpNumber } from '@/components/CountUpNumber'
import { SupplyDepotSchedule } from '@/components/SupplyDepotSchedule'
import { TransactionModal } from '@/components/TransactionModal'
import { SchoolSchedule } from '@/components/SchoolSchedule'
import { WallSchedule } from '@/components/WallSchedule'
import { TodayStats } from '@/components/TodayStats'
import { motion } from 'framer-motion'
import { Wallet, Coins } from 'lucide-react'
import { WheelOfFortune } from '@/components/WheelOfFortune'
import { RaidBoss } from '@/components/RaidBoss'

/** Mission tasks from centralized task config (4 phases: Утро, Школа, Питание, Дом и сон). */
const MISSION_TASKS_BY_CATEGORY = getMissionTasksByCategory()

const USER_THEMES = {
  cyan: {
    name: 'РОМА',
    Helmet: BlueRacerHelmet,
    border: 'border-cyan-500/40',
    bg: 'cockpit-btn-roma',
    fuelBar: 'bg-cyan-500',
    fuelTrack: 'bg-slate-800',
    accent: 'roma',
    avatarBorder: 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400',
  },
  purple: {
    name: 'КИРИЛЛ',
    Helmet: PurplePilotHelmet,
    border: 'border-purple-500/40',
    bg: 'cockpit-btn-kirill',
    fuelBar: 'bg-purple-500',
    fuelTrack: 'bg-slate-800',
    accent: 'kirill',
    avatarBorder: 'border-purple-500/50 bg-purple-500/20 text-purple-400',
  },
}

const REASON_BONUS = 'Бонус (ручное)'
const REASON_FINE = 'Штраф (ручное)'

/** God Mode: compact Command Bar at top of Left Panel. Input + [Рома][Кирилл][Оба] + [⚡ НАЧИСЛИТЬ]. Terminal style. */
function GodModeCommandBar({ roma, kirill, onShowToast, disabled }) {
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const [input, setInput] = useState('')
  const [target, setTarget] = useState('both') // 'roma' | 'kirill' | 'both'

  const num = Number(input.trim())
  const isValid = !Number.isNaN(num) && num !== 0 && Math.abs(num) <= 999999
  const userIds = target === 'both' ? [roma?.id, kirill?.id].filter(Boolean) : target === 'roma' ? [roma?.id] : [kirill?.id]

  const handleApply = () => {
    if (!isValid || userIds.length === 0) return
    const amount = Math.abs(num)
    const reason = num >= 0 ? REASON_BONUS : REASON_FINE
    if (num >= 0) {
      userIds.forEach((id) => addPoints(id, amount, reason))
      playCoin()
      onShowToast?.({ message: `+${amount} — ${userIds.length > 1 ? 'Оба' : userIds[0] === 'roma' ? 'Рома' : 'Кирилл'}`, variant: 'success' })
    } else {
      userIds.forEach((id) => spendPoints(id, amount, reason))
      playError()
      onShowToast?.({ message: `−${amount} — ${userIds.length > 1 ? 'Оба' : userIds[0] === 'roma' ? 'Рома' : 'Кирилл'}`, variant: 'alert' })
    }
    setInput('')
  }

  if (disabled) return null

  return (
    <div
      className="shrink-0 mb-3 rounded-xl border-2 border-slate-600/80 bg-slate-900/95 font-mono overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]"
      role="group"
      aria-label="Ручное начисление"
    >
      <div className="flex items-stretch gap-0 min-h-[52px]">
        <span className="flex items-center px-3 text-emerald-500/90 text-base select-none border-r border-slate-600">
          $
        </span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="±XP"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/[^\d\-]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className="flex-1 min-w-0 min-h-[52px] bg-transparent px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 touch-manipulation"
          style={{ minHeight: 52 }}
          aria-label="Сумма (введите число)"
        />
        <div className="flex border-l border-slate-600">
            {[
            { id: 'roma', label: 'Рома' },
            { id: 'kirill', label: 'Кирилл' },
            { id: 'both', label: 'Оба' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTarget(id)}
              className={cn(
                'min-h-[52px] px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold uppercase border-r border-slate-600 last:border-r-0 transition touch-manipulation',
                target === id
                  ? 'bg-amber-500/30 text-amber-200 border-amber-500/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={!isValid}
          className="min-h-[52px] px-4 sm:px-5 py-3 bg-amber-500/40 text-amber-100 font-bold text-sm uppercase border-l-2 border-amber-500/60 hover:bg-amber-500/50 disabled:opacity-40 disabled:pointer-events-none transition touch-manipulation"
          aria-label="Начислить"
        >
          ⚡ НАЧИСЛИТЬ
        </button>
      </div>
    </div>
  )
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function SupplyDepotColumn({ user, onShowToast, locked, readOnly, juicy, isCommander, transactions = [], onRemoveTransaction }) {
  const effectiveLocked = locked || readOnly
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const markDailyBaseComplete = useAppStore((s) => s.markDailyBaseComplete)
  const undoDailyTask = useAppStore((s) => s.undoDailyTask)
  const theme = USER_THEMES[user.color] || USER_THEMES.cyan
  const [floatEarn, setFloatEarn] = useState(null)
  const [avatarShake, setAvatarShake] = useState(false)
  const [floatPop, setFloatPop] = useState(null) // { x, y, amount } for juice float from button
  const [floatFromCard, setFloatFromCard] = useState(null) // { x, y, amount } flying toward score
  const [flashId, setFlashId] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const personalLog = (transactions ?? []).filter((t) => t.userId === user.id).slice(0, 50)

  const todayKey = new Date().toISOString().slice(0, 10)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const groupedByDate = personalLog.reduce((acc, t) => {
    const key = t.at ? new Date(t.at).toISOString().slice(0, 10) : todayKey
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})
  const orderedDateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))
  const dateLabel = (key) => {
    if (key === todayKey) return 'Сегодня'
    if (key === yesterdayKey) return 'Вчера'
    return new Date(key + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const showToast = (message, variant = 'success') => {
    onShowToast?.({ message, variant })
  }

  const applyDelta = (action, isDaily = false, event = null, options = {}) => {
    const rawCredits = action.credits ?? action.reward ?? 0
    const amount = Math.abs(Number(rawCredits))
    if (amount <= 0 || Number.isNaN(amount)) return
    if (rawCredits >= 0) {
      addPoints(user.id, amount, action.reason)
      if (options.soundOverride === 'chime') playChime()
      else playCoin()
      setFloatEarn(amount)
      showToast(`+${amount} — ${action.label}`, theme.accent)
      if (options.floatFromCard && event) {
        setFloatFromCard({ x: event.clientX, y: event.clientY, amount: action.credits })
      }
      if (juicy && event) {
        setFloatPop({ x: event.clientX, y: event.clientY, amount: action.credits })
        setFlashId(action.id)
        setTimeout(() => setFlashId(null), 100)
      }
    } else {
      spendPoints(user.id, amount, action.reason)
      playError()
      setAvatarShake(true)
      setTimeout(() => setAvatarShake(false), 400)
      showToast(`−${amount} — ${action.label}`, 'alert')
      if (juicy && event) {
        setFloatPop({ x: event.clientX, y: event.clientY, amount: action.credits })
        setFlashId(action.id)
        setTimeout(() => setFlashId(null), 100)
      }
    }
    if (isDaily) markDailyBaseComplete(user.id, action.id)
  }

  const handleDailyClick = (action, isDaily = true, e) => {
    if (isDaily && isDailyBaseComplete(user.id, action.id)) return
    applyDelta(action, isDaily, e)
  }

  const handleMissionClick = (action, e) => applyDelta(action, false, e)
  const handlePenaltyClick = (action, e) => applyDelta(action, false, e)

  /** Mission Log: complete task with chime and floating +N toward score. Supports penalty tasks (negative credits). */
  const handleMissionTaskComplete = (task, e) => {
    if (task.isDaily && isDailyBaseComplete(user.id, task.id)) return
    const credits = task.credits ?? task.reward ?? 0
    const action = { id: task.id, credits, reason: task.reason ?? task.label, label: task.label ?? task.id }
    if (typeof credits !== 'number') return
    applyDelta(action, task.isDaily !== false, e, { soundOverride: 'chime', floatFromCard: true })
  }

  /** Inline undo for daily tasks: remove last matching transaction and clear daily state; show toast. */
  const handleUndoDailyTask = (userId, task) => {
    undoDailyTask(userId, task.id, task.reason ?? task.label)
    onShowToast?.({ message: 'Действие отменено', variant: 'success' })
  }

  useEffect(() => {
    if (floatEarn === null) return
    const t = setTimeout(() => setFloatEarn(null), 700)
    return () => clearTimeout(t)
  }, [floatEarn])

  useEffect(() => {
    if (!floatPop) return
    const t = setTimeout(() => setFloatPop(null), 700)
    return () => clearTimeout(t)
  }, [floatPop])

  useEffect(() => {
    if (!floatFromCard) return
    const t = setTimeout(() => setFloatFromCard(null), 800)
    return () => clearTimeout(t)
  }, [floatFromCard])

  const panelGlow = user.color === 'cyan' ? 'panel-glow-roma' : 'panel-glow-kirill'

  return (
    <div
      className={cn(
        'flex flex-1 flex-col min-w-0 min-h-[320px] rounded-2xl panel-glass p-4 sm:p-5 border-[3px]',
        panelGlow,
        readOnly && 'opacity-80 cursor-default pointer-events-none'
      )}
    >
      {/* Header: Pixel art avatar + name + Wallet (Quick Calculator) trigger */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 shrink-0">
        <div className="relative shrink-0">
          <PilotAvatar
            pilotId={user.id}
            size="column"
            className={cn(avatarShake && 'animate-shake')}
          />
          {floatEarn !== null && (
            <span
              key={floatEarn}
              className={cn(
                'absolute left-1/2 bottom-0 font-hud-nums text-lg font-bold tabular-nums animate-float-from-avatar',
                user.color === 'cyan' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
              )}
            >
              +{floatEarn}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className={cn('hud-player-name', user.color === 'cyan' ? 'text-cyan-300' : 'text-purple-300')}>
            {theme.name}
          </h2>
        </div>
        {isCommander && (
          <button
            type="button"
            onClick={() => setShowTransactionModal(true)}
            className="shrink-0 p-3 rounded-2xl border-[3px] border-amber-500/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 hover:border-amber-500/70 transition touch-manipulation icon-pop shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
            aria-label="Корректировка баллов"
            title="Корректировка баллов"
          >
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 icon-pop" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Score: Баланс + За сегодня */}
      {(() => {
        const todayStart = getTodayStartTs()
        const todayEnd = todayStart + 24 * 60 * 60 * 1000
        const todayEarned = (transactions ?? [])
          .filter((t) => t.userId === user.id && t.amount > 0 && t.at >= todayStart && t.at < todayEnd)
          .reduce((sum, t) => sum + t.amount, 0)
        return (
          <div className="mb-3 shrink-0 rounded-2xl border-[3px] border-slate-600/60 bg-slate-800/90 px-4 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col items-center">
                <span className="font-sans-data text-[10px] text-slate-500 uppercase tracking-wider">Баланс</span>
                <span className="hud-score-total flex items-baseline justify-center gap-0.5">
                  <CountUpNumber value={user.balance} duration={400} />
                  <span className="font-sans-data text-sm text-amber-400/90">⚡ XP</span>
                </span>
              </div>
              <div className="h-px w-full bg-slate-600/60 rounded-full" aria-hidden />
              <div className="flex flex-col items-center">
                <span className="font-sans-data text-[10px] text-slate-500 uppercase tracking-wider">За сегодня</span>
                <span className="hud-score-earned">+{todayEarned}</span>
                <span className="font-sans-data text-[10px] text-slate-500">⚡ XP</span>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Chronological Supply Depot: 4 blocks (Morning, School, Food, Home) — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <SupplyDepotSchedule
          accentColor={user.color === 'cyan' ? 'cyan' : 'purple'}
          userId={user.id}
          onUndoDailyTask={handleUndoDailyTask}
          getStatus={(taskId) => {
            const isDaily =
              (MISSION_TASKS_BY_CATEGORY.Morning ?? []).some((t) => t.id === taskId) ||
              (MISSION_TASKS_BY_CATEGORY.Base ?? []).some((t) => t.id === taskId) ||
              (MISSION_TASKS_BY_CATEGORY.foodComposite ?? []).some(
                (g) => g.main.id === taskId || (g.modifiers ?? []).some((m) => m.id === taskId)
              )
            if (!isDaily) return 'pending'
            return isDailyBaseComplete(user.id, taskId) ? 'completed' : 'pending'
          }}
          onTaskComplete={handleMissionTaskComplete}
          disabled={effectiveLocked}
        />
      </div>

      {/* Module D: ⚠️ ШТРАФНОЙ БОКС — Danger zone. Very bottom, distinct from positive tasks. */}
      <div className="mt-3 pt-3 border-t-2 border-red-900/40 shrink-0">
        <h3 className="font-mono text-[10px] text-red-400/90 uppercase tracking-wider mb-1.5">
          ⚠️ ШТРАФНОЙ БОКС
        </h3>
        <div className="danger-zone rounded-2xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-1">
            {PENALTY_BOX.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={(e) => handlePenaltyClick(action, e)}
                disabled={effectiveLocked}
                className={cn(
                  'rounded-md py-2 px-2 font-mono font-medium border flex items-center justify-center gap-1 min-h-[36px] touch-manipulation',
                  juicy ? 'btn-juicy-danger btn-arcade-juicy border-b-4' : 'btn-danger-small',
                  effectiveLocked && 'opacity-60',
                  juicy && flashId === action.id && 'btn-flash-white-once'
                )}
              >
                <span aria-hidden>{action.emoji}</span>
                <span className="truncate">{action.label}</span>
                <span className="tabular-nums text-red-300">{action.credits}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History — last 50, terminal style, delete with refund */}
      <div className="mt-3 flex-1 flex flex-col rounded-2xl border-2 border-slate-600/60 bg-slate-900/95 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)] min-h-[400px]">
        <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider px-2 py-1.5 border-b border-slate-700/50 shrink-0">
          Журнал операций
        </h3>
        <ul className="font-mono text-[11px] text-slate-400 space-y-0 overflow-y-auto flex-1 min-h-0 px-2 py-1.5 list-none [scrollbar-color:theme(colors.slate.600)_transparent)]">
          {personalLog.length === 0 ? (
            <li className="text-slate-600 py-3">— записей нет</li>
          ) : (
            orderedDateKeys.map((dateKey) => (
              <li key={dateKey} className="list-none">
                <div className="sticky top-0 z-10 bg-slate-900/98 py-1 font-mono text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                  {dateLabel(dateKey)}
                </div>
                <ul className="list-none space-y-0">
                  {groupedByDate[dateKey].map((t, i) => {
                    const isEarn = t.amount > 0
                    const hasId = !!t.id && !String(t.id).startsWith('temp-')
                    const handleDelete = () => {
                      const msg = isEarn
                        ? `Удалить запись (+${t.amount} XP) и списать ${t.amount} XP?`
                        : `Удалить запись (${t.amount} XP) и вернуть ${Math.abs(t.amount)} XP?`
                      if (window.confirm(msg)) onRemoveTransaction?.(t.id)
                    }
                    return (
                      <li
                        key={t.id ?? `log-${t.at}-${i}`}
                        className="flex items-center gap-2 py-1.5 px-1.5 rounded hover:bg-slate-800/60 group border-b border-slate-800/50 last:border-b-0"
                      >
                        <span className="tabular-nums text-slate-500 shrink-0 w-14 text-[10px]">
                          {formatTime(t.at)}
                        </span>
                        <span className="flex-1 truncate text-slate-300 min-w-0 text-[11px]">{t.description}</span>
                        <span
                          className={cn(
                            'tabular-nums shrink-0 w-10 text-right text-xs font-semibold',
                            isEarn ? 'text-emerald-400' : 'text-red-400'
                          )}
                        >
                          {isEarn ? `+${t.amount}` : t.amount}
                        </span>
                        {hasId && isCommander && (
                          <button
                            type="button"
                            onClick={handleDelete}
                            className="shrink-0 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition opacity-60 group-hover:opacity-100"
                            aria-label="Удалить и вернуть XP"
                            title={isEarn ? 'Удалить и списать XP' : 'Удалить и вернуть XP'}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Float +N / -N from button (Admin juice) */}
      {floatPop &&
        createPortal(
          <div
            className="fixed z-[100] font-mono text-xl font-bold tabular-nums animate-float-from-button -translate-x-1/2 pointer-events-none"
            style={{ left: floatPop.x, top: floatPop.y }}
          >
            {floatPop.amount >= 0 ? (
              <span className="text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                +{floatPop.amount}
              </span>
            ) : (
              <span className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]">
                {floatPop.amount}
              </span>
            )}
          </div>,
          document.body
        )}

      {/* Float +N from mission card flying up toward score */}
      {floatFromCard &&
        createPortal(
          <motion.span
            className="fixed z-[100] font-mono text-xl font-bold tabular-nums pointer-events-none -translate-x-1/2"
            style={{ left: floatFromCard.x, top: floatFromCard.y }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -200, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">
              +{floatFromCard.amount}
            </span>
          </motion.span>,
          document.body
        )}

      {/* Quick Calculator modal (manual add/fine) */}
      {showTransactionModal && (
        <TransactionModal
          user={user}
          transactions={transactions}
          onClose={() => setShowTransactionModal(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  )
}

const ICONS = { Candy, Banknote, Package, UtensilsCrossed }

/** Russian labels for shop items (Candy, Toys, Cash, etc.) */
const ITEM_NAME_RU = {
  sweet_treat: 'Конфета',
  cash_out: 'Наличные (100 ₽)',
  small_toy: 'Игрушка / Лего',
  mcdonalds: 'Макдональдс',
}

function MarketCard({ item, onClick }) {
  const Icon = ICONS[item.icon] ?? Package
  const nameRu = ITEM_NAME_RU[item.id] ?? item.name
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/60 p-3 relative',
        'min-h-[80px] w-full text-left transition hover:border-slate-500 hover:bg-slate-800/60',
        'active:scale-[0.98] touch-manipulation'
      )}
    >
      <div className="rounded-full border border-slate-600 bg-slate-800/80 p-1.5">
        <Icon className="h-5 w-5 text-slate-300" />
      </div>
      <span className="font-mono text-[11px] font-medium text-white text-center leading-tight">
        {nameRu}
      </span>
      <span className="font-mono text-xs tabular-nums text-alert/90 border border-slate-600 rounded px-1.5 py-0.5 bg-slate-800/80">
        −{item.cost} ⚡ XP
      </span>
    </button>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 id="modal-title" className="font-mono text-sm font-semibold text-slate-300">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-white transition"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

/** Wheel of Fortune: pilot selector (single) + Casino Chip button. Chip only clickable when one pilot selected. */
function WheelTrigger({ wheelPilot, setWheelPilot, onOpenWheel }) {
  const canSpin = wheelPilot === 'roma' || wheelPilot === 'kirill'

  return (
    <div className="shrink-0 flex flex-col gap-2">
      <h3 className="font-mono text-xs text-slate-400 uppercase tracking-wider">
        Колесо фортуны
      </h3>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border border-slate-600/60 overflow-hidden">
          {[
            { id: 'roma', label: 'Рома', theme: 'border-roma/50 bg-roma/15 text-roma' },
            { id: 'kirill', label: 'Кирилл', theme: 'border-kirill/50 bg-kirill/15 text-kirill' },
          ].map(({ id, label, theme }) => (
            <button
              key={id}
              type="button"
              onClick={() => setWheelPilot((p) => (p === id ? null : id))}
              className={cn(
                'min-h-[40px] px-3 py-2 font-mono text-xs font-bold uppercase border-r border-slate-600 last:border-r-0 transition touch-manipulation',
                wheelPilot === id ? theme : 'bg-slate-800/50 text-slate-500 hover:text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenWheel}
          disabled={!canSpin}
          className={cn(
            'flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase border-2 transition touch-manipulation',
            canSpin
              ? 'border-amber-500/70 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'border-slate-600 bg-slate-800/50 text-slate-500 cursor-not-allowed'
          )}
          aria-label={canSpin ? 'Крутить колесо фортуны' : 'Выберите одного пилота (Рома или Кирилл)'}
          title={canSpin ? 'Испытать удачу' : 'Выберите одного пилота'}
        >
          <Coins className="w-4 h-4" strokeWidth={2.5} aria-hidden />
          Крутить
        </button>
      </div>
    </div>
  )
}

function MarketplaceSection() {
  const users = useAppStore((s) => s.users)
  const purchaseItem = useAppStore((s) => s.purchaseItem)
  const [selectedItem, setSelectedItem] = useState(null)
  const [result, setResult] = useState(null)
  const [shake, setShake] = useState(false)

  const handleCardClick = (item) => {
    setSelectedItem(item)
    setResult(null)
  }

  const handleSelectUser = (userId) => {
    if (!selectedItem) return
    const ok = purchaseItem(userId, selectedItem)
    if (ok) {
      setResult('success')
      setSelectedItem(null)
      setTimeout(() => setResult(null), 2000)
    } else {
      setSelectedItem(null)
      setResult('insufficient')
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
  }

  const closeSelectModal = () => {
    setSelectedItem(null)
    setResult(null)
  }

  const selectedItemNameRu = selectedItem ? (ITEM_NAME_RU[selectedItem.id] ?? selectedItem.name) : ''

  return (
    <div className="flex flex-col min-h-0">
      <h3 className="font-mono text-xs text-slate-400 mb-2 uppercase tracking-wider">
        МАГАЗИН ТРОФЕЕВ
      </h3>
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 auto-rows-min">
        {MARKET_ITEMS.map((item) => (
          <MarketCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
        ))}
      </div>

      {selectedItem && !result && (
        <Modal title="Кто покупает?" onClose={closeSelectModal}>
          <p className="font-mono text-slate-400 text-sm mb-4">
            {selectedItemNameRu} — −{selectedItem.cost} КРЕДИТЫ
          </p>
          <div className="flex flex-col gap-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelectUser(user.id)}
                className={cn(
                  'min-h-[48px] rounded-lg border font-mono font-medium transition touch-manipulation uppercase text-sm',
                  user.color === 'cyan'
                    ? 'border-roma/50 bg-roma/15 text-roma hover:bg-roma/25'
                    : 'border-kirill/50 bg-kirill/15 text-kirill hover:bg-kirill/25'
                )}
              >
                {user.id === 'roma' ? 'Рома' : 'Кирилл'}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {result === 'success' && (
        <Modal title="СТАТУС" onClose={() => setResult(null)}>
          <p className="font-mono text-center text-success text-lg font-semibold py-2">
            АКТИВАЦИЯ: ПОКУПКА ВЫПОЛНЕНА
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-3 w-full min-h-[44px] rounded-lg border border-success/50 bg-success/20 font-mono text-success hover:bg-success/30 transition uppercase"
          >
            ОК
          </button>
        </Modal>
      )}

      {result === 'insufficient' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={cn(
              'bg-slate-900 border border-alert/50 rounded-xl shadow-xl max-w-sm w-full p-6',
              shake && 'animate-shake'
            )}
          >
            <p className="font-mono text-center text-alert text-lg font-semibold uppercase">
              Недостаточно XP
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-4 w-full min-h-[44px] rounded-lg border border-slate-600 font-mono text-slate-300 hover:bg-slate-800 transition uppercase"
            >
              ОК
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const DAILY_EARNINGS_GOAL = 500
const DAILY_BURN_SCALE_MAX = 120 // minutes for bar scale
const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

/** Start of today (00:00:00) as timestamp. */
function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Current week Mon–Sun as date keys. */
function getCurrentWeekDateKeys() {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const keys = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    keys.push(getDateKey(d))
  }
  return keys
}

/** БОРТОВОЙ ЖУРНАЛ (НЕДЕЛЯ) — Admin only: daily bars, weekly chart, lifetime stats. */
function WeeklyAnalytics() {
  const transactions = useAppStore((s) => s.transactions ?? [])
  const gamingToday = useAppStore((s) => s.gamingToday)
  const dailyGamingMinutes = useAppStore((s) => s.dailyGamingMinutes ?? {})
  const totalFlightTimeMinutes = useAppStore((s) => s.totalFlightTimeMinutes ?? 0)

  const todayKey = getDateKey()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStartTs = todayStart.getTime()

  const todayEarned = transactions
    .filter((t) => t.at >= todayStartTs && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const todayBurn = gamingToday?.dateKey === todayKey ? gamingToday?.minutes ?? 0 : 0

  const totalGeneratedEnergy = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const weekKeys = getCurrentWeekDateKeys()
  const weekData = weekKeys.map((dateKey) => {
    const dayStart = new Date(dateKey + 'T00:00:00').getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    const earned = transactions
      .filter((t) => t.at >= dayStart && t.at < dayEnd && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    const burn = dailyGamingMinutes[dateKey] ?? 0
    return { dateKey, earned, burn }
  })

  const maxEarned = Math.max(1, ...weekData.map((d) => d.earned))
  const maxBurn = Math.max(1, ...weekData.map((d) => d.burn), DAILY_BURN_SCALE_MAX)

  return (
    <div className="hud-journal mt-4 pt-3 border-t border-cyan-500/30 flex flex-col gap-3 shrink-0">
      <h3 className="font-mono text-[10px] text-cyan-400/90 uppercase tracking-widest hud-label">
        БОРТОВОЙ ЖУРНАЛ (НЕДЕЛЯ)
      </h3>

      {/* Daily progress bars */}
      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between items-baseline mb-0.5">
            <span className="font-mono text-[10px] text-slate-500 uppercase">Заработано сегодня</span>
            <span className="font-mono text-xs tabular-nums text-cyan-300 hud-glow">
              {todayEarned}/{DAILY_EARNINGS_GOAL}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800/80 border border-slate-600/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500 min-w-[2px] transition-[width] duration-300"
              style={{
                width: `${Math.min(100, (todayEarned / DAILY_EARNINGS_GOAL) * 100)}%`,
                boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-0.5">
            <span className="font-mono text-[10px] text-slate-500 uppercase">Сожжено сегодня</span>
            <span className="font-mono text-xs tabular-nums text-red-400/90 hud-glow">
              {todayBurn} мин
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800/80 border border-slate-600/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 min-w-[2px] transition-[width] duration-300"
              style={{
                width: `${Math.min(100, (todayBurn / DAILY_BURN_SCALE_MAX) * 100)}%`,
                boxShadow: '0 0 8px rgba(248, 113, 113, 0.5)',
              }}
            />
          </div>
        </div>
      </div>

      {/* 7-day bar chart */}
      <div>
        <p className="font-mono text-[10px] text-slate-500 uppercase mb-2">Неделя</p>
        <div className="flex items-end justify-between gap-0.5 h-14">
          {weekData.map((d, i) => (
            <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <div className="w-full flex justify-center gap-px items-end flex-1 min-h-[32px]">
                <div
                  className="flex-1 min-w-[2px] max-w-[8px] rounded-t hud-bar-green transition-all duration-300"
                  style={{
                    height: `${(d.earned / maxEarned) * 100}%`,
                    minHeight: d.earned > 0 ? 4 : 0,
                  }}
                  title={`${d.dateKey}: +${d.earned}`}
                />
                <div
                  className="flex-1 min-w-[2px] max-w-[8px] rounded-t hud-bar-red transition-all duration-300"
                  style={{
                    height: `${(d.burn / maxBurn) * 100}%`,
                    minHeight: d.burn > 0 ? 4 : 0,
                  }}
                  title={`${d.dateKey}: ${d.burn} мин`}
                />
              </div>
              <span className="font-mono text-[9px] text-slate-500 truncate w-full text-center">
                {WEEKDAY_LABELS[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Lifetime stats */}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-slate-500 uppercase">ВСЕГО ЭНЕРГИИ</span>
          <span className="font-mono text-sm font-bold tabular-nums text-cyan-300 hud-glow">
            {totalGeneratedEnergy}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-slate-500 uppercase">ВСЕГО В ИГРЕ</span>
          <span className="font-mono text-sm font-bold tabular-nums text-cyan-300 hud-glow">
            {totalFlightTimeMinutes} мин
          </span>
        </div>
      </div>
    </div>
  )
}

export function Dashboard({ mode = 'pilot' }) {
  const users = useAppStore((s) => s.users)
  const transactions = useAppStore((s) => s.transactions ?? [])
  const removeTransaction = useAppStore((s) => s.removeTransaction)
  const panelLocked = useAppStore((s) => s.panelLocked)
  const [roma, kirill] = users
  const [toast, setToast] = useState(null)
  const [wheelPilot, setWheelPilot] = useState(null) // 'roma' | 'kirill' | null — single pilot for wheel
  const [wheelOpen, setWheelOpen] = useState(false)
  const lastOfflineSyncToast = useAppStore((s) => s.lastOfflineSyncToast)
  const clearLastOfflineSyncToast = useAppStore((s) => s.clearLastOfflineSyncToast)

  useEffect(() => {
    if (lastOfflineSyncToast) {
      setToast({ message: lastOfflineSyncToast.message, variant: 'default' })
      clearLastOfflineSyncToast()
    }
  }, [lastOfflineSyncToast, clearLastOfflineSyncToast])

  const isPilot = mode === 'pilot'
  const isCommander = mode === 'commander'

  /** Right Panel glow: engine running = blue pulse; Overdrive (будни > 60 мин) = red alarm. */
  const engineRunning = useAppStore((s) => s.pilots?.roma?.status === 'RUNNING' || s.pilots?.kirill?.status === 'RUNNING')
  const pilots = useAppStore((s) => s.pilots)
  const gamingToday = useAppStore((s) => s.gamingToday)
  const displayMinutesToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const fromToday = gamingToday?.dateKey === today ? (gamingToday?.minutes ?? 0) : 0
    const roma = pilots?.roma?.sessionMinutes ?? 0
    const kirill = pilots?.kirill?.sessionMinutes ?? 0
    return fromToday + roma + kirill
  }, [gamingToday, pilots])
  const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5
  const overdrive = isWeekday && displayMinutesToday > 60

  const handleRemoveTransaction = (transactionId) => {
    removeTransaction(transactionId)
    setToast({ message: 'ОПЕРАЦИЯ ОТМЕНЕНА', variant: 'success' })
  }

  const simulateDayReset = useAppStore((s) => s.simulateDayReset)
  const handleSimulateDayReset = () => {
    simulateDayReset()
    setToast({ message: 'Сброс дня выполнен. Все ежедневные задачи снова активны.', variant: 'success' })
  }

  return (
    <KioskLayout>
      <Header />
      <SchoolSchedule />
      <main className="dashboard-grid flex-1 min-h-0 flex flex-col overflow-y-auto p-4">
        {/* 2-column grid: Left = Pilots, Right = Control Center */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden gap-4">
        {/* LEFT COLUMN — Pilots (Roma / Kirill cards) */}
        <section className="dashboard-left flex flex-col min-h-0 lg:min-h-0 panel-glass rounded-2xl p-5 relative">
          <span className="panel-bolt bolt-tl" aria-hidden />
          <span className="panel-bolt bolt-tr" aria-hidden />
          <span className="panel-bolt bolt-bl" aria-hidden />
          <span className="panel-bolt bolt-br" aria-hidden />
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <h2 className="font-gaming text-base text-slate-400 uppercase tracking-wider">Пилоты</h2>
            {isCommander && (
              <button
                type="button"
                onClick={handleSimulateDayReset}
                className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border-2 border-amber-500/70 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition touch-manipulation"
                aria-label="Сброс дня (тест)"
                title="Сбросить ежедневные задачи для теста"
              >
                СБРОС ДНЯ
              </button>
            )}
          </div>
          {isCommander && (
            <GodModeCommandBar
              roma={roma}
              kirill={kirill}
              onShowToast={setToast}
              disabled={false}
            />
          )}
          <div className="flex flex-col lg:flex-row flex-1 gap-3 min-h-0 min-w-0 overflow-y-auto mt-2">
            {roma && (
              <SupplyDepotColumn
                user={roma}
                onShowToast={setToast}
                locked={isCommander ? false : panelLocked}
                readOnly={isPilot}
                juicy={isCommander}
                isCommander={isCommander}
                transactions={transactions}
                onRemoveTransaction={handleRemoveTransaction}
              />
            )}
            {kirill && (
              <SupplyDepotColumn
                user={kirill}
                onShowToast={setToast}
                locked={isCommander ? false : panelLocked}
                readOnly={isPilot}
                juicy={isCommander}
                isCommander={isCommander}
                transactions={transactions}
                onRemoveTransaction={handleRemoveTransaction}
              />
            )}
          </div>
        </section>

        {/* Glowing divider — visible on laptop */}
        <div className="dashboard-divider shrink-0" aria-hidden />

        {/* RIGHT PANEL — Control Core (40%) — glassmorphism; glow when engine running / overdrive */}
        <section
          className={cn(
            'dashboard-right flex flex-col min-h-0 panel-glass rounded-2xl p-5 relative',
            engineRunning && overdrive && 'panel-right-glow-overdrive',
            engineRunning && !overdrive && 'panel-right-glow-engine'
          )}
        >
          <span className="panel-bolt bolt-tl" aria-hidden />
          <span className="panel-bolt bolt-tr" aria-hidden />
          <span className="panel-bolt bolt-bl" aria-hidden />
          <span className="panel-bolt bolt-br" aria-hidden />
          <h2 className="font-gaming text-base text-slate-400 mb-3 shrink-0 uppercase tracking-wider">ЦЕНТР УПРАВЛЕНИЯ</h2>
          <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-auto">
            <RaidBoss isCommander={isCommander} />
            <ControlCenter
              wheelPilot={wheelPilot}
              setWheelPilot={setWheelPilot}
              setWheelOpen={setWheelOpen}
            />
            <TodayStats />
            <WheelTrigger
              wheelPilot={wheelPilot}
              setWheelPilot={setWheelPilot}
              onOpenWheel={() => setWheelOpen(true)}
            />
            <div className="flex-1 min-h-0 flex flex-col">
              <MarketplaceSection />
            </div>
            {isCommander && <WeeklyAnalytics />}
          </div>
        </section>
        </div>
        {/* Footer: full-width Schedule below the 2-column grid */}
        <div className="col-span-12 mt-4 w-full">
          <WallSchedule />
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}

      <WheelOfFortune open={wheelOpen} onClose={() => setWheelOpen(false)} />
    </KioskLayout>
  )
}
