import { motion } from 'framer-motion'
import { Gamepad2, Tv } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const PILOTS = [
  { id: 'roma', name: 'Рома', short: 'Р', color: 'cyan', border: 'border-cyan-500/50', bg: 'bg-cyan-500/15', text: 'text-cyan-300', glow: 'shadow-[0_0_12px_rgba(34,211,238,0.35)]' },
  { id: 'kirill', name: 'Кирилл', short: 'К', color: 'purple', border: 'border-purple-500/50', bg: 'bg-purple-500/15', text: 'text-purple-300', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.35)]' },
]

function formatMinutes(n) {
  if (n === 0) return '0'
  if (n < 60) return `${n} мин`
  const h = Math.floor(n / 60)
  const m = n % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

/**
 * Один ряд: иконка режима + два пилота с минутами. Живое обновление, «сейчас» если сессия в этом режиме.
 */
function StatRow({ title, icon: Icon, modeKey, breakdown, isLive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border-[3px] p-3 sm:p-4 flex flex-col gap-3',
        isLive
          ? 'border-amber-500/60 bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
          : 'border-slate-600/60 bg-slate-800/80'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl border-2',
            modeKey === 'game'
              ? 'border-blue-500/50 bg-blue-500/20 text-blue-300'
              : 'border-pink-500/50 bg-pink-500/20 text-pink-300'
          )}
        >
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </span>
        <span className="font-gaming text-sm sm:text-base font-bold uppercase tracking-wider text-slate-200">
          {title}
        </span>
        {isLive && (
          <motion.span
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-[10px] text-amber-400 uppercase tracking-wider"
          >
            ● сейчас
          </motion.span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PILOTS.map((p) => {
          const minutes = breakdown[modeKey]?.[p.id] ?? 0
          return (
            <motion.div
              key={p.id}
              className={cn(
                'rounded-xl border-2 p-2.5 flex items-center justify-between gap-2',
                p.border,
                p.bg
              )}
              whileHover={{ scale: 1.02 }}
            >
              <span className={cn('font-gaming text-xs font-bold uppercase', p.text)}>
                {p.name}
              </span>
              <span
                className={cn(
                  'font-gaming text-lg sm:text-xl font-black tabular-nums',
                  p.text,
                  'drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                )}
              >
                {formatMinutes(minutes)}
              </span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/**
 * Блок «Сегодня: сколько играли и сколько смотрели» — по каждому ребёнку. Живое обновление, «вау» для детей.
 */
export function TodayStats() {
  const getDisplayBreakdownToday = useAppStore((s) => s.getDisplayBreakdownToday)
  const pilots = useAppStore((s) => s.pilots)
  useAppStore((s) => s.dailyGamingBreakdown)
  const breakdown = getDisplayBreakdownToday()
  const isLiveGame =
    (pilots?.roma?.status === 'RUNNING' && pilots?.roma?.mode === 'game') ||
    (pilots?.kirill?.status === 'RUNNING' && pilots?.kirill?.mode === 'game')
  const isLiveYoutube =
    (pilots?.roma?.status === 'RUNNING' && pilots?.roma?.mode === 'youtube') ||
    (pilots?.kirill?.status === 'RUNNING' && pilots?.kirill?.mode === 'youtube')

  return (
    <div className="shrink-0 space-y-3">
      <div>
        <h3 className="font-gaming text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="text-amber-400">📊</span>
          Сегодня: игра и мультики
        </h3>
        <p className="font-mono text-[10px] text-slate-500 mt-0.5">
          Кто сколько — всё честно и видно
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatRow
          title="Играли"
          icon={Gamepad2}
          modeKey="game"
          breakdown={breakdown}
          isLive={isLiveGame}
        />
        <StatRow
          title="Смотрели мультики"
          icon={Tv}
          modeKey="youtube"
          breakdown={breakdown}
          isLive={isLiveYoutube}
        />
      </div>
    </div>
  )
}
