import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ACTIVITIES } from '@/data/activities'
import { Toast } from '@/components/Toast'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { playCoin } from '@/lib/sounds'

const USER_COLORS = {
  cyan: {
    bg: 'bg-roma/15 border-roma/40 hover:bg-roma/25 active:scale-[0.98]',
    balance: 'text-roma',
    accent: 'roma',
  },
  purple: {
    bg: 'bg-kirill/15 border-kirill/40 hover:bg-kirill/25 active:scale-[0.98]',
    balance: 'text-kirill',
    accent: 'kirill',
  },
}

function UserColumn({ user, onShowToast }) {
  const addPoints = useAppStore((s) => s.addPoints)
  const spendPoints = useAppStore((s) => s.spendPoints)
  const style = USER_COLORS[user.color] || USER_COLORS.cyan
  const [manualAmount, setManualAmount] = useState('')

  const showToast = (message, variant = 'success') => {
    onShowToast?.({ message, variant })
  }

  const handleActivityClick = (activity) => {
    addPoints(user.id, activity.credits, activity.label)
    playCoin()
    showToast(`+${activity.credits} — ${activity.label}`, style.accent)
  }

  const handleManualApply = (delta) => {
    const value = Number(manualAmount)
    if (Number.isNaN(value) || value === 0) return
    const amount = Math.abs(value)
    if (delta === 'add') {
      addPoints(user.id, amount, 'Ручное изменение')
      playCoin()
      showToast(`+${amount}`, style.accent)
    } else {
      spendPoints(user.id, amount, 'Ручное изменение')
      showToast(`−${amount}`, style.accent)
    }
    setManualAmount('')
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 min-h-[320px] rounded-xl border border-slate-800 bg-slate-900/50 p-3 sm:p-4 md:p-5">
      <h2 className="font-mono text-base sm:text-lg font-semibold text-slate-300 mb-1 shrink-0">
        {user.id === 'roma' ? 'РОМА' : 'КИРИЛЛ'}
      </h2>
      <div className={`font-mono text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 ${style.balance}`}>
        <AnimatedNumber value={user.balance} />
      </div>

      {/* Quick Add Grid — large touch targets for mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6 flex-1 min-h-0">
        {ACTIVITIES.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => handleActivityClick(activity)}
            className={`
              min-h-[52px] sm:min-h-[56px] md:min-h-[64px] rounded-lg border font-mono text-left px-2.5 sm:px-3 py-2.5 sm:py-3
              transition-all duration-150 touch-manipulation select-none
              ${style.bg}
            `}
          >
            <span className="text-lg sm:text-xl md:text-2xl mr-1.5 sm:mr-2">{activity.emoji}</span>
            <span className="text-xs sm:text-sm md:text-base font-medium text-white leading-tight">
              {activity.shortLabel} +{activity.credits}
            </span>
          </button>
        ))}
      </div>

      {/* Manual Adjustment — full-width on small screens */}
      <div className="mt-auto space-y-1.5 sm:space-y-2 shrink-0">
        <label className="font-mono text-xs text-slate-500 block">
          Ручное изменение
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Сумма"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value.replace(/[^0-9-]/g, ''))}
            className="flex-1 min-h-[48px] rounded-lg border border-slate-700 bg-slate-800 px-3 font-mono text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-roma/50"
          />
          <button
            type="button"
            onClick={() => handleManualApply('add')}
            className="min-h-[48px] min-w-[48px] rounded-lg border border-roma/50 bg-roma/20 text-roma font-mono font-bold text-xl hover:bg-roma/30 active:scale-95 transition touch-manipulation"
            aria-label="Добавить баллы"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleManualApply('sub')}
            className="min-h-[48px] min-w-[48px] rounded-lg border border-alert/50 bg-alert/20 text-alert font-mono font-bold text-xl hover:bg-alert/30 active:scale-95 transition touch-manipulation"
            aria-label="Снять баллы"
          >
            −
          </button>
        </div>
      </div>
    </div>
  )
}

export function ControlPanel() {
  const users = useAppStore((s) => s.users)
  const [roma, kirill] = users
  const [toast, setToast] = useState(null)

  return (
    <KioskLayout>
      <Header />
      <main className="flex-1 flex flex-col min-h-0 p-4 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 mb-3 sm:mb-4 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-sm text-slate-400 hover:text-white transition min-h-[44px] items-center -ml-1"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            Назад
          </Link>
          <span className="font-mono text-xs text-slate-600">ЦЕНТР УПРАВЛЕНИЯ</span>
        </div>

        <div className="flex flex-1 gap-3 sm:gap-4 min-h-0 flex-col md:flex-row overflow-auto">
          {roma && <UserColumn user={roma} onShowToast={setToast} />}
          {kirill && <UserColumn user={kirill} onShowToast={setToast} />}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onDone={() => setToast(null)}
          />
        )}
      </main>
    </KioskLayout>
  )
}
