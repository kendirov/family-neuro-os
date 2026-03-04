/**
 * AdminControlPanel — Expensive Minimalism.
 * Bento/Kanban layout: Morning | Day/School | Evening.
 * Glassmorphism: border-white/10, bg-slate-900/40 backdrop-blur-xl.
 * Split-button: base / base+bonus.
 */
import { useState, useMemo } from 'react'
import { Wallet, Trash2 } from 'lucide-react'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { CountUpNumber } from '@/components/CountUpNumber'
import { TransactionModal } from '@/components/TransactionModal'
import { SplitTaskButton } from './SplitTaskButton'
import { SimpleTaskButton } from './SimpleTaskButton'
import { cn } from '@/lib/utils'
import { playChime, playCoin, playError } from '@/lib/sounds'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { PENALTY_BOX } from '@/data/taskConfig'

const TIME_BLOCKS = [
  { id: 'morning', label: 'УТРЕННИЙ ПРОТОКОЛ', icon: '🌅' },
  { id: 'afternoon', label: 'ДЕНЬ / ШКОЛА', icon: '☀️' },
  { id: 'evening', label: 'ВЕЧЕРНИЙ ПРОТОКОЛ', icon: '🌙' },
]

const CATEGORY_LABELS = {
  routine: 'Режим',
  food: 'Питание',
  school: 'Школа',
  bonus: 'Бонус',
}

function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function formatTime(ts, includeSeconds = true) {
  const d = new Date(ts)
  return d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  })
}

/** Группировка задач по time_block и category */
function groupTasksByBlockAndCategory(tasks) {
  const byBlock = {}
  TIME_BLOCKS.forEach((b) => {
    byBlock[b.id] = {}
  })
  tasks.forEach((t) => {
    let block = t.time_block
    if (block === 'anytime') block = 'afternoon' // anytime → Day
    if (!byBlock[block]) byBlock[block] = {}
    const cat = t.category
    if (!byBlock[block][cat]) byBlock[block][cat] = []
    byBlock[block][cat].push(t)
  })
  Object.keys(byBlock).forEach((block) => {
    Object.keys(byBlock[block]).forEach((cat) => {
      byBlock[block][cat].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    })
  })
  return byBlock
}

export function AdminControlPanel({
  roma,
  kirill,
  transactions = [],
  onShowToast,
  onRemoveTransaction,
  addPoints,
  spendPoints,
  markDailyBaseComplete,
  isDailyBaseComplete,
  undoDailyTask,
}) {
  const [selectedPilotId, setSelectedPilotId] = useState('roma')
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const user = selectedPilotId === 'roma' ? roma : kirill
  const theme = user?.color === 'cyan' ? 'cyan' : 'purple'

  const grouped = useMemo(() => groupTasksByBlockAndCategory(taskDefinitions), [])

  const todayKey = new Date().toISOString().slice(0, 10)
  const todayStart = getTodayStartTs()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000
  const personalLog = (transactions ?? []).filter((t) => t.userId === user?.id).slice(0, 50)
  const todayTransactions = personalLog.filter((t) => {
    const txDate = t.at ? new Date(t.at).toISOString().slice(0, 10) : todayKey
    return txDate === todayKey
  })
  const todayEarned = (transactions ?? [])
    .filter(
      (t) =>
        t.userId === user?.id &&
        t.at >= todayStart &&
        t.at < todayEnd &&
        t.type !== 'burn'
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const getStatus = (taskId) => {
    if (!user) return 'pending'
    return isDailyBaseComplete(user.id, taskId) ? 'completed' : 'pending'
  }

  const handleBaseComplete = async (task, amount, isBonus, e) => {
    if (!user) return
    const reason = isBonus ? `${task.reason_template} — бонус` : task.reason_template
    await addPoints(user.id, amount, reason ?? task.label)
    playChime()
    onShowToast?.({ message: `+${amount} — ${task.label}`, variant: 'success' })
    markDailyBaseComplete(user.id, task.id)
  }

  const handleBonusComplete = (task, amount, isBonus, e) => {
    handleBaseComplete(task, amount, true, e)
  }

  const handleSimpleComplete = async (task, amount, e) => {
    if (!user) return
    const amt = task.base_reward > 0 ? task.base_reward : task.bonus_reward
    await addPoints(user.id, amt, task.reason_template ?? task.label)
    playChime()
    onShowToast?.({ message: `+${amt} — ${task.label}`, variant: 'success' })
    markDailyBaseComplete(user.id, task.id)
  }

  const handleUndo = (task) => {
    if (!user) return
    const baseReason = task.reason_template ?? task.label
    const bonusReason = baseReason + ' — бонус'
    undoDailyTask(user.id, task.id, [baseReason, bonusReason])
    onShowToast?.({ message: 'Действие отменено', variant: 'success' })
  }

  const handlePenaltyClick = async (action) => {
    if (!user) return
    const amount = Math.abs(action.credits)
    await spendPoints(user.id, amount, action.reason)
    playError()
    onShowToast?.({ message: `−${amount} — ${action.label}`, variant: 'alert' })
  }

  if (!roma && !kirill) return null

  return (
    <div className="flex flex-col min-h-0 flex-1 min-w-0">
      {/* Sticky Pilot Selector */}
      <div className="sticky top-0 z-20 shrink-0 mb-4 -mx-1 px-1 py-2 rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
            Начислять:
          </span>
          <div className="flex rounded-lg border border-white/10 overflow-hidden bg-slate-900/60">
            {[
              { id: 'roma', label: 'Рома', u: roma },
              { id: 'kirill', label: 'Кирилл', u: kirill },
            ].filter(({ u }) => u).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedPilotId(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition touch-manipulation',
                  selectedPilotId === id
                    ? id === 'roma'
                      ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                      : 'bg-purple-500/30 text-purple-200 border-purple-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                )}
              >
                <PilotAvatar pilotId={id} size="engine" className="w-6 h-6" />
                {label}
              </button>
            ))}
          </div>
          {user && (
            <button
              type="button"
              onClick={() => setShowTransactionModal(true)}
              className="shrink-0 p-2.5 rounded-xl border border-white/10 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 transition"
              aria-label="Корректировка баллов"
            >
              <Wallet className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Score card */}
      {user && (
        <div className="shrink-0 mb-4 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] text-slate-500 uppercase">Сегодня</span>
              <p className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                {todayEarned >= 0 ? '+' : ''}{todayEarned} XP
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-slate-500 uppercase">Баланс</span>
              <p className="font-mono text-lg font-bold text-amber-400 tabular-nums">
                <CountUpNumber value={user.balance} duration={400} /> XP
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bento: 3 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
        {TIME_BLOCKS.map((block) => (
          <div
            key={block.id}
            className={cn(
              'rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]',
              'flex flex-col min-h-0 overflow-hidden'
            )}
          >
            <div className="shrink-0 px-4 py-3 border-b border-white/10">
              <h3 className="font-gaming text-xs font-bold text-slate-300 uppercase tracking-wider">
                {block.icon} {block.label}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {Object.entries(grouped[block.id] ?? {}).map(([category, tasks]) => (
                <div key={category}>
                  <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                    {CATEGORY_LABELS[category] ?? category}
                  </h4>
                  <div className="space-y-2">
                    {tasks.map((task) => {
                      const hasBonus = (task.bonus_reward ?? 0) > 0 && (task.base_reward ?? 0) > 0
                      if (hasBonus) {
                        return (
                          <SplitTaskButton
                            key={task.id}
                            task={task}
                            status={getStatus(task.id)}
                            onBaseComplete={handleBaseComplete}
                            onBonusComplete={handleBonusComplete}
                            onUndo={handleUndo}
                            isGodMode={true}
                            accentColor={theme}
                          />
                        )
                      }
                      return (
                        <SimpleTaskButton
                          key={task.id}
                          task={task}
                          status={getStatus(task.id)}
                          onComplete={handleSimpleComplete}
                          onUndo={handleUndo}
                          isGodMode={true}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Penalty Box */}
      <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
        <h3 className="font-gaming text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
          ⚠️ Штрафы
        </h3>
        <div className="flex flex-wrap gap-2">
          {PENALTY_BOX.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => handlePenaltyClick(action)}
              className={cn(
                'rounded-lg py-2 px-3 font-mono text-sm font-medium border flex items-center gap-2',
                'border-red-500/50 bg-red-900/20 text-red-200 hover:bg-red-800/30',
                'touch-manipulation transition'
              )}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
              <span className="tabular-nums">{action.credits}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden shrink-0 max-h-48">
        <h3 className="font-mono text-xs text-white uppercase tracking-wider px-4 py-3 border-b border-white/10 font-bold">
          Журнал — Сегодня
        </h3>
        <div className="overflow-y-auto max-h-36 [scrollbar-color:theme(colors.slate.600)_transparent]">
          {todayTransactions.length === 0 ? (
            <p className="text-slate-500 py-6 text-center text-sm">— записей нет</p>
          ) : (
            <ul className="list-none">
              {todayTransactions.map((t, i) => {
                const isEarn = t.amount > 0
                const hasId = !!t.id && !String(t.id).startsWith('temp-')
                return (
                  <li
                    key={t.id ?? `tx-${i}`}
                    className="flex items-center gap-3 py-2.5 px-4 border-b border-white/5 last:border-0"
                  >
                    <span className="tabular-nums text-slate-500 text-xs w-14 shrink-0">
                      {formatTime(t.at, false)}
                    </span>
                    <span className="flex-1 truncate text-sm text-slate-200">{t.description}</span>
                    <span
                      className={cn(
                        'tabular-nums text-sm font-semibold w-14 text-right shrink-0',
                        isEarn ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {isEarn ? `+${t.amount}` : t.amount}
                    </span>
                    {hasId && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Удалить запись?')) onRemoveTransaction?.(t.id)
                        }}
                        className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {user && showTransactionModal && (
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
