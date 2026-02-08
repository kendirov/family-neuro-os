import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Candy,
  Banknote,
  Package,
  UtensilsCrossed,
  ArrowLeft,
  X,
} from 'lucide-react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { useAppStore } from '@/stores/useAppStore'
import { MARKET_ITEMS } from '@/data/marketItems'
import { cn } from '@/lib/utils'

const ICONS = {
  Candy,
  Banknote,
  Package,
  UtensilsCrossed,
}

function MarketCard({ item, onClick }) {
  const Icon = ICONS[item.icon] ?? Package
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-6',
        'min-h-[140px] w-full text-left transition hover:border-slate-500 hover:bg-slate-800/60',
        'active:scale-[0.98] touch-manipulation'
      )}
    >
      <div className="rounded-full border border-slate-600 bg-slate-800/80 p-3">
        <Icon className="h-8 w-8 text-slate-300" />
      </div>
      <span className="font-mono text-sm font-medium text-white text-center leading-tight">
        {item.name}
      </span>
      <span className="font-mono text-lg tabular-nums text-roma">
        {item.cost} кр
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

export function Marketplace() {
  const users = useAppStore((s) => s.users)
  const purchaseItem = useAppStore((s) => s.purchaseItem)
  const [selectedItem, setSelectedItem] = useState(null)
  const [result, setResult] = useState(null) // 'success' | 'insufficient'
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

  return (
    <KioskLayout>
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>
          <span className="font-mono text-xs text-slate-600">МАГАЗИН ТРОФЕЕВ</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MARKET_ITEMS.map((item) => (
            <MarketCard key={item.id} item={item} onClick={() => handleCardClick(item)} />
          ))}
        </div>

        {/* Выбор: для Ромы / для Кирилла */}
        {selectedItem && !result && (
          <Modal title="Кто покупает?" onClose={closeSelectModal}>
            <p className="font-mono text-slate-400 text-sm mb-4">
              {selectedItem.name} — {selectedItem.cost} кредитов
            </p>
            <div className="flex flex-col gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user.id)}
                  className={cn(
                    'min-h-[52px] rounded-lg border font-mono font-medium transition touch-manipulation',
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

        {/* Покупка выполнена */}
        {result === 'success' && (
          <Modal title=" " onClose={() => setResult(null)}>
            <p className="font-mono text-center text-success text-lg font-semibold py-2">
              ПОКУПКА ВЫПОЛНЕНА
            </p>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="mt-3 w-full min-h-[44px] rounded-lg border border-success/50 bg-success/20 font-mono text-success hover:bg-success/30 transition"
            >
              ОК
            </button>
          </Modal>
        )}

        {/* Недостаточно средств */}
        {result === 'insufficient' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div
              className={cn(
                'bg-slate-900 border border-alert/50 rounded-xl shadow-xl max-w-sm w-full p-6',
                shake && 'animate-shake'
              )}
            >
              <p className="font-mono text-center text-alert text-lg font-semibold">
                НЕДОСТАТОЧНО КРЕДИТОВ
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-4 w-full min-h-[44px] rounded-lg border border-slate-600 font-mono text-slate-300 hover:bg-slate-800 transition"
              >
                ОК
              </button>
            </div>
          </div>
        )}
      </main>
    </KioskLayout>
  )
}
