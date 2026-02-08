import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Candy,
  Banknote,
  Package,
  UtensilsCrossed,
  X,
  Check,
} from 'lucide-react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { Toast } from '@/components/Toast'
import { FuelTank } from '@/components/FuelTank'
import { BlueRacerHelmet, PurplePilotHelmet } from '@/components/HelmetAvatar'
import { useAppStore } from '@/stores/useAppStore'
import { MARKET_ITEMS } from '@/data/marketItems'
import { playCoin, playAlarm, playStart, playError } from '@/lib/sounds'
import { cn } from '@/lib/utils'
import { GamingTimerWidget } from '@/components/GamingTimerWidget'
import { Trash2 } from 'lucide-react'

/** Module A: УТРО — Morning routine. Daily (disable after click until reset). */
const MODULE_UTRO = [
  { id: 'teeth', emoji: '🦷', label: 'Зубы', credits: 20, reason: 'Утро: Зубы' },
  { id: 'bed', emoji: '🛌', label: 'Постель', credits: 10, reason: 'Утро: Постель' },
]

/** Module B: ПИТАНИЕ — Nutrition. Each row: main (big, daily) + modifier (small, circular). */
const MODULE_PITANIE = [
  {
    main: { id: 'breakfast', emoji: '🍳', label: 'Завтрак', credits: 15, reason: 'Питание: Завтрак' },
    modifiers: [
      { id: 'breakfast_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Завтрак: Вовремя' },
      { id: 'breakfast_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Завтрак: Много' },
    ],
  },
  {
    main: { id: 'lunch', emoji: '🍔', label: 'Обед', credits: 20, reason: 'Питание: Обед' },
    modifiers: [
      { id: 'lunch_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Обед: Вовремя' },
      { id: 'lunch_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Обед: Много' },
    ],
  },
  {
    main: { id: 'dinner', emoji: '🍲', label: 'Ужин', credits: 15, reason: 'Питание: Ужин' },
    modifiers: [
      { id: 'dinner_ontime', emoji: '⏱', label: 'Вовремя', credits: 5, reason: 'Ужин: Вовремя' },
      { id: 'dinner_many', emoji: '💪', label: 'Много', credits: 10, reason: 'Ужин: Много' },
    ],
  },
]

/** Module C: ДЕЛО — Mission. */
const MODULE_DELO = [
  { id: 'school', emoji: '🏫', label: 'Школа', credits: 30, reason: 'Дело: Школа', style: 'green' },
  { id: 'sport', emoji: '🏆', label: 'Секция', credits: 100, reason: 'Дело: Секция', style: 'gold', big: true },
  { id: 'grade_5', emoji: '📚', label: 'Уроки (5)', credits: 50, reason: 'Дело: Уроки 5', style: 'green' },
  { id: 'grade_4', emoji: '📘', label: 'Уроки (4)', credits: 20, reason: 'Дело: Уроки 4', style: 'blue' },
  { id: 'help_mom', emoji: '🧹', label: 'Помощь маме', credits: 30, reason: 'Дело: Помощь маме', style: 'green' },
]

/** Module D: ШТРАФНОЙ БОКС — Danger zone. Small, distinct, hazard style. */
const MODULE_PENALTY = [
  { id: 'shout', emoji: '🗣', label: 'Крик/Спор', credits: -20, reason: 'Штраф: Крик/Спор' },
  { id: 'slow', emoji: '🐢', label: 'Медленно', credits: -10, reason: 'Штраф: Медленно' },
  { id: 'rude', emoji: '🤬', label: 'Грубость', credits: -50, reason: 'Штраф: Грубость' },
  { id: 'fight', emoji: '🥊', label: 'Драка', credits: -100, reason: 'Штраф: Драка' },
]

const FUEL_MAX = 200 // Balance cap for fuel bar fill %

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

function SupplyDepotColumn({ user, onShowToast, locked, readOnly }) {
  const effectiveLocked = locked || readOnly
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const markDailyBaseComplete = useAppStore((s) => s.markDailyBaseComplete)
  const theme = USER_THEMES[user.color] || USER_THEMES.cyan
  const [floatEarn, setFloatEarn] = useState(null)
  const [avatarShake, setAvatarShake] = useState(false)
  const Helmet = theme.Helmet

  const showToast = (message, variant = 'success') => {
    onShowToast?.({ message, variant })
  }

  const applyDelta = (action, isDaily = false) => {
    const amount = Math.abs(action.credits)
    if (action.credits >= 0) {
      addPoints(user.id, amount, action.reason)
      playCoin()
      setFloatEarn(amount)
      showToast(`+${amount} — ${action.label}`, theme.accent)
    } else {
      spendPoints(user.id, amount, action.reason)
      playError()
      setAvatarShake(true)
      setTimeout(() => setAvatarShake(false), 400)
      showToast(`−${amount} — ${action.label}`, 'alert')
    }
    if (isDaily) markDailyBaseComplete(user.id, action.id)
  }

  const handleDailyClick = (action, isDaily = true) => {
    if (isDaily && isDailyBaseComplete(user.id, action.id)) return
    applyDelta(action, isDaily)
  }

  const handleMissionClick = (action) => applyDelta(action, false)
  const handlePenaltyClick = (action) => applyDelta(action, false)

  useEffect(() => {
    if (floatEarn === null) return
    const t = setTimeout(() => setFloatEarn(null), 700)
    return () => clearTimeout(t)
  }, [floatEarn])

  const btnBase =
    'rounded-xl border-2 font-mono text-left px-3 py-2.5 border-b-4 border-slate-600/80 shadow-[0_4px_0_0_rgba(0,0,0,0.25)] transition-all duration-150 touch-manipulation select-none hover:translate-y-0.5 hover:shadow-[0_3px_0_0_rgba(0,0,0,0.25)] active:translate-y-1 active:scale-[0.98] active:border-b-2 active:shadow-[0_1px_0_0_rgba(0,0,0,0.3)] disabled:pointer-events-none'

  const styleClass = (style) => {
    switch (style) {
      case 'gold': return 'btn-upgrade-gold'
      case 'green': return 'btn-upgrade-green'
      case 'blue': return 'btn-upgrade-blue'
      case 'orange': return 'btn-penalty-orange'
      case 'red': return 'btn-penalty-red'
      default: return ''
    }
  }

  return (
    <div
      className={cn(
        'flex flex-1 flex-col min-w-0 min-h-[320px] rounded-xl panel-metal p-3 sm:p-4',
        theme.border,
        readOnly && 'opacity-80 cursor-default pointer-events-none'
      )}
    >
      <span className="panel-bolt bolt-tl" aria-hidden />
      <span className="panel-bolt bolt-tr" aria-hidden />
      <span className="panel-bolt bolt-bl" aria-hidden />
      <span className="panel-bolt bolt-br" aria-hidden />

      {/* Header: Helmet avatar (with float +N and shake), Name, Liquid fuel tank */}
      <div className="flex items-start gap-3 mb-3 shrink-0">
        <div className="relative shrink-0">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full border-2',
              theme.avatarBorder,
              avatarShake && 'animate-shake'
            )}
          >
            <Helmet className="h-7 w-7" />
          </div>
          {floatEarn !== null && (
            <span
              key={floatEarn}
              className={cn(
                'absolute left-1/2 bottom-0 font-mono text-xl font-bold tabular-nums animate-float-from-avatar',
                user.color === 'cyan' ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]'
              )}
            >
              +{floatEarn}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <h2
            className={cn(
              'font-mono text-lg sm:text-xl font-bold uppercase tracking-wider',
              user.color === 'cyan' ? 'text-cyan-300' : 'text-purple-300'
            )}
          >
            {theme.name}
          </h2>
          <FuelTank
            value={user.balance}
            floatEarn={floatEarn}
            variant={user.color === 'cyan' ? 'roma' : 'kirill'}
            max={FUEL_MAX}
            className="min-h-[52px] w-full"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
      {/* Module A: 🌅 УТРО — Morning routine. Daily. */}
      <div className="mb-2">
        <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          🌅 УТРО
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {MODULE_UTRO.map((action) => {
            const done = isDailyBaseComplete(user.id, action.id)
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleDailyClick(action, true)}
                disabled={done || effectiveLocked}
                className={cn(
                  btnBase,
                  'min-h-[40px] flex items-center justify-center gap-1 relative overflow-hidden',
                  done ? 'btn-daily-complete' : 'btn-routine',
                  effectiveLocked && 'opacity-60'
                )}
              >
                {done ? (
                  <>
                    <span className="absolute inset-0 rounded-xl bg-slate-900/60 backdrop-blur-sm" aria-hidden />
                    <Check className="h-5 w-5 shrink-0 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)] relative" aria-hidden />
                  </>
                ) : (
                  <span className="text-base" aria-hidden>{action.emoji}</span>
                )}
                <span className={cn('text-xs font-medium leading-tight', done && 'relative text-slate-400')}>
                  {action.label} +{action.credits}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Module B: 🍔 ПИТАНИЕ — Nutrition. Main (big, daily) + modifiers (small circular). */}
      <div className="mb-2">
        <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          🍔 ПИТАНИЕ
        </h3>
        <div className="space-y-2">
          {MODULE_PITANIE.map((row) => {
            const mainDone = isDailyBaseComplete(user.id, row.main.id)
            return (
              <div key={row.main.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDailyClick(row.main, true)}
                  disabled={mainDone || effectiveLocked}
                  className={cn(
                    btnBase,
                    'min-h-[44px] flex-1 flex items-center justify-center gap-1.5 relative overflow-hidden',
                    mainDone ? 'btn-daily-complete' : 'btn-food',
                    effectiveLocked && 'opacity-60'
                  )}
                >
                  {mainDone ? (
                    <>
                      <span className="absolute inset-0 rounded-xl bg-slate-900/60 backdrop-blur-sm" aria-hidden />
                      <Check className="h-5 w-5 shrink-0 text-emerald-400 relative" aria-hidden />
                    </>
                  ) : (
                    <span className="text-lg" aria-hidden>{row.main.emoji}</span>
                  )}
                  <span className={cn('text-xs font-medium', mainDone && 'relative text-slate-400')}>
                    {row.main.label} +{row.main.credits}
                  </span>
                </button>
                {row.modifiers.map((mod) => {
                  const modDone = isDailyBaseComplete(user.id, mod.id)
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleDailyClick(mod, true)}
                      disabled={modDone || effectiveLocked}
                      title={mod.label + ' +' + mod.credits}
                      className={cn(
                        'shrink-0 w-9 h-9 rounded-full border-2 font-mono text-xs font-bold shadow-[0_2px_0_0_rgba(0,0,0,0.2)] transition-all touch-manipulation',
                        modDone ? 'btn-daily-complete' : 'btn-food-modifier',
                        effectiveLocked && 'opacity-60'
                      )}
                    >
                      {modDone ? <Check className="h-4 w-4 mx-auto text-emerald-400" /> : mod.emoji}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Module C: 🏫 ДЕЛО — Mission. */}
      <div className="mb-2">
        <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          🏫 ДЕЛО
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {MODULE_DELO.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handleMissionClick(action)}
              disabled={effectiveLocked}
              className={cn(
                btnBase,
                action.big ? 'min-h-[48px] col-span-2' : 'min-h-[40px]',
                styleClass(action.style ?? 'green'),
                effectiveLocked && 'opacity-60'
              )}
            >
              <span className="text-base mr-1" aria-hidden>{action.emoji}</span>
              <span className="text-xs font-medium leading-tight">
                {action.label} {action.credits >= 0 ? `+${action.credits}` : action.credits}
              </span>
            </button>
          ))}
        </div>
      </div>

      </div>

      {/* Module D: ⚠️ ШТРАФНОЙ БОКС — Danger zone. Bottom, hazard style, small. */}
      <div className="mt-auto pt-2 shrink-0">
        <h3 className="font-mono text-[10px] text-red-400/90 uppercase tracking-wider mb-1.5">
          ⚠️ ШТРАФНОЙ БОКС
        </h3>
        <div className="danger-zone rounded-lg p-2 space-y-1.5">
          <div className="grid grid-cols-2 gap-1">
            {MODULE_PENALTY.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handlePenaltyClick(action)}
                disabled={effectiveLocked}
                className={cn(
                  'rounded-md py-2 px-2 font-mono font-medium border btn-danger-small flex items-center justify-center gap-1 min-h-[36px]',
                  effectiveLocked && 'opacity-60'
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
        −{item.cost} кр
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
              Недостаточно кредитов
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

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export function Dashboard() {
  const users = useAppStore((s) => s.users)
  const transactions = useAppStore((s) => s.transactions ?? [])
  const removeTransaction = useAppStore((s) => s.removeTransaction)
  const panelLocked = useAppStore((s) => s.panelLocked)
  const [roma, kirill] = users
  const [toast, setToast] = useState(null)

  const last10 = transactions.slice(0, 10)
  const getUser = (userId) => users.find((u) => u.id === userId)

  const handleRemoveTransaction = (transactionId) => {
    removeTransaction(transactionId)
    setToast({ message: 'ОПЕРАЦИЯ ОТМЕНЕНА', variant: 'success' })
  }

  return (
    <KioskLayout>
      <Header />
      <main className="dashboard-grid flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden gap-4 p-4">
        {/* LEFT PANEL — Supply Depot (60%) — metal frame */}
        <section className="dashboard-left flex flex-col min-h-0 lg:min-h-0 panel-metal rounded-xl p-4 relative">
          <span className="panel-bolt bolt-tl" aria-hidden />
          <span className="panel-bolt bolt-tr" aria-hidden />
          <span className="panel-bolt bolt-bl" aria-hidden />
          <span className="panel-bolt bolt-br" aria-hidden />
          <h2 className="font-mono text-sm text-slate-400 mb-3 shrink-0">ГАРАЖ И БАЗА</h2>
          <div className="flex flex-1 gap-3 min-h-0 min-w-0">
            {roma && <SupplyDepotColumn user={roma} onShowToast={setToast} locked={panelLocked} />}
            {kirill && <SupplyDepotColumn user={kirill} onShowToast={setToast} locked={panelLocked} />}
          </div>
        </section>

        {/* Glowing divider — visible on laptop */}
        <div className="dashboard-divider shrink-0" aria-hidden />

        {/* RIGHT PANEL — Control Core (40%) — metal frame */}
        <section className="dashboard-right flex flex-col min-h-0 panel-metal rounded-xl p-4 relative">
          <span className="panel-bolt bolt-tl" aria-hidden />
          <span className="panel-bolt bolt-tr" aria-hidden />
          <span className="panel-bolt bolt-bl" aria-hidden />
          <span className="panel-bolt bolt-br" aria-hidden />
          <h2 className="font-mono text-sm text-slate-400 mb-3 shrink-0">ЦЕНТР УПРАВЛЕНИЯ</h2>
          <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-auto">
            <GamingTimerWidget />
            <div className="flex-1 min-h-0 flex flex-col">
              <MarketplaceSection />
            </div>
          </div>
        </section>
      </main>

      {/* СИСТЕМНЫЙ ЖУРНАЛ — full-width bottom, last 10, terminal style, undo per row */}
      <section className="w-full shrink-0 border-t border-slate-700/80 bg-slate-950/90 px-4 py-3">
        <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2">
          СИСТЕМНЫЙ ЖУРНАЛ
        </h3>
        <ul className="font-mono text-[11px] text-slate-400 space-y-0.5 max-h-[140px] overflow-y-auto">
          {last10.length === 0 ? (
            <li className="text-slate-600 py-2">— записей нет</li>
          ) : (
            last10.map((t, i) => {
              const user = getUser(t.userId)
              const initial = user?.name?.charAt(0) ?? '?'
              const isEarn = t.amount > 0
              const hasId = !!t.id
              return (
                <li
                  key={t.id ?? `log-${t.at}-${i}`}
                  className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-800/50 group"
                >
                  <span className="tabular-nums text-slate-600 shrink-0 w-14">
                    {formatTime(t.at)}
                  </span>
                  <span className="shrink-0 w-5 text-slate-500">[{initial}]</span>
                  <span className="flex-1 truncate text-slate-300">{t.description}</span>
                  <span
                    className={cn(
                      'tabular-nums shrink-0 w-10 text-right font-medium',
                      isEarn ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {isEarn ? `+${t.amount}` : t.amount}
                  </span>
                  {hasId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTransaction(t.id)}
                      className="shrink-0 p-1 rounded text-red-400/80 hover:text-red-400 hover:bg-red-500/20 transition opacity-70 group-hover:opacity-100"
                      aria-label="Отменить операцию"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              )
            })
          )}
        </ul>
      </section>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}
    </KioskLayout>
  )
}
