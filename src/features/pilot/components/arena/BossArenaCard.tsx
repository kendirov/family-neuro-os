import { motion, useReducedMotion } from 'motion/react'
import { useAppStore } from '@/stores/useAppStore'
import { BossProgressBar } from './BossProgressBar'

const RAID_TARGET = 1500

export function BossArenaCard({ onOpenArena }: { onOpenArena: () => void }) {
  const reduce = useReducedMotion()
  const raidProgressRaw = useAppStore((s) => s.raidProgress ?? 0)
  const raidProgress = typeof raidProgressRaw === 'number' ? raidProgressRaw : 0
  const isWin = raidProgress >= RAID_TARGET
  const overflow = raidProgress > RAID_TARGET ? raidProgress - RAID_TARGET : 0

  return (
    <motion.section
      className="panel-glass rounded-3xl border border-white/10 p-5 overflow-hidden"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label="Босс"
    >
      <div className="relative">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" aria-hidden />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">
                Босс
              </h2>
              <span className="rounded-2xl border border-purple-500/35 bg-purple-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-purple-200">
                Арена
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-400/90">
              Урон идёт от заработанных очков. Чем больше прогресс — тем ближе награда.
            </p>
          </div>

          <span
            className={[
              'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
              isWin ? 'border-amber-500/45 bg-amber-500/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-200',
            ].join(' ')}
          >
            {isWin ? 'Победа близко' : `${raidProgress}/${RAID_TARGET}`}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[0.7fr_1.3fr] gap-4 items-stretch">
          <div className="rounded-3xl border border-white/10 bg-slate-950/25 p-4 flex items-center justify-center">
            <motion.div
              className={[
                'h-20 w-20 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-slate-800 to-slate-950/60 flex items-center justify-center',
                isWin ? 'shadow-[0_0_30px_rgba(251,191,36,0.25)] border-amber-500/40' : '',
                !reduce ? 'animate-boss-float' : '',
              ].join(' ')}
              whileHover={reduce ? undefined : { scale: 1.03 }}
              animate={isWin && !reduce ? { rotate: [0, -6, 0] } : undefined}
              transition={{ duration: 0.6 }}
              aria-hidden
            >
              <span className="text-[42px] leading-none drop-shadow">🍣</span>
            </motion.div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/20 p-4">
            <BossProgressBar current={raidProgress} target={RAID_TARGET} tone={isWin ? 'win' : 'danger'} />
            <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
              <span>{isWin ? `Оверкилл: +${overflow}` : 'Бей прогрессом'}</span>
              <span className={isWin ? 'text-amber-300' : 'text-slate-400'}>
                {isWin ? 'Награда доступна' : `${Math.round((raidProgress / RAID_TARGET) * 100)}%`}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-amber-200/90">
                Награда
              </div>
              <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-amber-100">
                Лутбокс рейда
              </div>
              <div className="mt-1 font-mono text-xs text-slate-200/90">
                Дойди до 100% и загляни внутрь.
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenArena}
              className={[
                'mt-4 w-full min-h-[56px] rounded-2xl border-2',
                'font-gaming text-sm sm:text-base font-black uppercase tracking-wider',
                'touch-manipulation transition',
                isWin
                  ? 'border-amber-400/60 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 hover:border-amber-300/70 active:scale-[0.98]'
                  : 'border-purple-500/50 bg-purple-500/12 text-purple-100 hover:bg-purple-500/18 hover:border-purple-400/60 active:scale-[0.98]',
                !reduce ? 'btn-arcade-juicy-rounded' : '',
              ].join(' ')}
              aria-label="Открыть арену босса"
            >
              {isWin ? 'Забрать награду' : 'Войти в арену'}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

