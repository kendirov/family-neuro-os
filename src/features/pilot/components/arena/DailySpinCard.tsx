import { motion, useReducedMotion } from 'motion/react'
import { useAppStore } from '@/stores/useAppStore'
import { DailySpinModule } from '@/components/KidsDashboard/DailySpinModule'
import { PilotAvatar } from '@/components/HelmetAvatar'

export function DailySpinCard({
  childId,
  accent,
  name,
}: {
  childId: 'roma' | 'kirill'
  accent: 'cyan' | 'purple'
  name: string
}) {
  const reduce = useReducedMotion()
  const available = useAppStore((s) => s.getAvailableSpins(childId))
  const toNext = useAppStore((s) => s.getPointsToNextSpin(childId))

  const canSpin = available > 0

  return (
    <motion.section
      className={[
        'panel-glass rounded-3xl border border-white/10 p-5 overflow-hidden',
        accent === 'cyan' ? 'border-cyan-500/20' : 'border-purple-500/20',
      ].join(' ')}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label={`Колесо удачи: ${name}`}
    >
      <div className="relative">
        <div
          className={[
            'absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-25',
            accent === 'cyan' ? 'bg-cyan-500/35' : 'bg-purple-500/35',
          ].join(' ')}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <PilotAvatar pilotId={childId} size="engine" className="w-12 h-12 rounded-2xl" />
            <div className="min-w-0">
              <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">
                Колесо удачи
              </h2>
              <p className="mt-1 font-mono text-[11px] text-slate-400/90">
                Пилот: <span className="text-slate-200 font-bold">{name}</span>
              </p>
            </div>
          </div>

          <span
            className={[
              'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest',
              canSpin
                ? accent === 'cyan'
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                  : 'border-purple-500/40 bg-purple-500/10 text-purple-200'
                : 'border-white/10 bg-white/5 text-slate-200',
            ].join(' ')}
          >
            {canSpin ? `Можно: ${available}` : 'Сегодня не готово'}
          </span>
        </div>

        <div className="mt-3">
          <p className="font-mono text-xs text-slate-300/90">
            {canSpin
              ? 'Награда за заработанные очки. Крути — и забирай.'
              : `Собери ещё ${toNext} ⚡, чтобы открыть спин.`}
          </p>
        </div>

        <div className="mt-4">
          <DailySpinModule childId={childId} accentColor={accent} />
        </div>
      </div>
    </motion.section>
  )
}

