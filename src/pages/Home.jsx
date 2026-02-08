import { Link } from 'react-router-dom'
import { Settings, ShoppingCart, Gamepad2 } from 'lucide-react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { CountUpNumber } from '@/components/CountUpNumber'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const DAILY_GOAL = 100

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getTodayStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function Home() {
  const users = useAppStore((s) => s.users)
  const transactions = useAppStore((s) => s.transactions ?? [])

  const last20 = transactions.slice(0, 20)
  const todayStart = getTodayStart()
  const todayEarned = transactions
    .filter((t) => t.at >= todayStart && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)
  const progress = Math.min(1, todayEarned / DAILY_GOAL)

  const getUser = (userId) => users.find((u) => u.id === userId)

  return (
    <KioskLayout>
      <Header />
      <main className="flex-1 p-4 md:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-6">
        {/* Dashboard container: glass + cyan glow */}
        <div className="glass-cyan rounded-xl p-4 md:p-6 flex flex-col gap-5">
          <p className="font-mono text-slate-400 text-sm tracking-wide text-center shrink-0">
            СТАТУС СИСТЕМЫ: ОЖИДАНИЕ ПИЛОТОВ
          </p>

          {/* Hero arcade buttons — dominate center */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 w-full max-w-3xl mx-auto flex-1 min-h-0">
            <Link
              to="/gaming"
              className={cn(
                'flex flex-col items-center justify-center gap-2 md:gap-3 min-h-[100px] sm:min-h-[120px] md:min-h-[140px] rounded-xl font-mono font-bold text-lg md:text-xl uppercase tracking-wider',
                'bg-violet-500 text-white border-2 border-violet-400/80',
                'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
                'hover:scale-105 hover:brightness-110 hover:shadow-[0_0_32px_rgba(139,92,246,0.6)]',
                'active:scale-[1.02] transition-all duration-200 ease-out touch-manipulation'
              )}
            >
              <Gamepad2 className="w-10 h-10 md:w-12 md:h-12 shrink-0" strokeWidth={2.5} />
              <span>ИГРАТЬ</span>
            </Link>
            <Link
              to="/market"
              className={cn(
                'flex flex-col items-center justify-center gap-2 md:gap-3 min-h-[100px] sm:min-h-[120px] md:min-h-[140px] rounded-xl font-mono font-bold text-lg md:text-xl uppercase tracking-wider',
                'bg-cyan-500 text-slate-950 border-2 border-cyan-400/80',
                'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
                'hover:scale-105 hover:brightness-110 hover:shadow-[0_0_32px_rgba(34,211,238,0.6)]',
                'active:scale-[1.02] transition-all duration-200 ease-out touch-manipulation'
              )}
            >
              <ShoppingCart className="w-8 h-8 md:w-10 md:h-10 shrink-0" strokeWidth={2.5} />
              <span>МАГАЗИН</span>
            </Link>
            <Link
              to="/admin"
              className={cn(
                'flex flex-col items-center justify-center gap-2 md:gap-3 min-h-[100px] sm:min-h-[120px] md:min-h-[140px] rounded-xl font-mono font-bold text-lg md:text-xl uppercase tracking-wider',
                'bg-emerald-500 text-slate-950 border-2 border-emerald-400/80',
                'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
                'hover:scale-105 hover:brightness-110 hover:shadow-[0_0_32px_rgba(16,185,129,0.5)]',
                'active:scale-[1.02] transition-all duration-200 ease-out touch-manipulation'
              )}
            >
              <Settings className="w-8 h-8 md:w-10 md:h-10 shrink-0" strokeWidth={2.5} />
              <span>БАЗА</span>
            </Link>
          </div>

          {/* Daily Goal — Energy Core / Fuel Tank */}
          <section className="w-full max-w-md mx-auto rounded-xl border border-cyan-500/30 bg-slate-900/60 px-4 py-3 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
            <div className="flex justify-between items-baseline font-mono font-bold text-base md:text-lg text-slate-300 mb-2">
              <span className="uppercase tracking-wider">ЦЕЛЬ ДНЯ</span>
              <span className="tabular-nums text-cyan-400">
                <CountUpNumber value={todayEarned} duration={350} className="tabular-nums" /> / {DAILY_GOAL}{' '}
                <span className="text-slate-500 font-normal text-sm md:text-base">бал</span>
              </span>
            </div>
            <div className="h-5 md:h-6 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-600/50 shadow-inner">
              <div
                className="energy-core-fill h-full rounded-full transition-[width] duration-500 ease-out min-w-[8px]"
                style={{ width: `${Math.max(progress * 100, progress > 0 ? 4 : 0)}%` }}
              />
            </div>
          </section>
        </div>

        {/* Neural Log: glass + purple/cyan border glow */}
        <section className="w-full max-w-md mx-auto flex-1 min-h-0 flex flex-col">
          <h2 className="font-mono text-sm text-slate-400 mb-2">ЖУРНАЛ БОЕВЫХ ДЕЙСТВИЙ</h2>
          <div className="glass-purple flex-1 min-h-0 overflow-y-auto rounded-xl p-3">
            <ul className="divide-y divide-slate-700/50">
              {last20.length === 0 ? (
                <li className="font-mono text-slate-600 text-sm py-6 text-center">
                  Пока тихо. Ждем активности!
                </li>
              ) : (
                last20.map((t, i) => {
                  const user = getUser(t.userId)
                  const initial = user?.name?.charAt(0) ?? '?'
                  const isEarn = t.amount > 0
                  return (
                    <li
                      key={`${t.at}-${i}`}
                      className="flex items-center gap-3 px-3 py-2.5 font-mono text-sm"
                    >
                      <span className="tabular-nums text-slate-500 shrink-0 w-10">
                        {formatTime(t.at)}
                      </span>
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                          user?.color === 'cyan' && 'bg-roma/20 text-roma',
                          user?.color === 'purple' && 'bg-kirill/20 text-kirill'
                        )}
                      >
                        {initial}
                      </span>
                      <span className="flex-1 truncate text-slate-300">
                        {t.description}
                      </span>
                      <span
                        className={cn(
                          'tabular-nums shrink-0 font-medium',
                          isEarn ? 'text-success' : 'text-alert'
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
        </section>
      </main>
    </KioskLayout>
  )
}
