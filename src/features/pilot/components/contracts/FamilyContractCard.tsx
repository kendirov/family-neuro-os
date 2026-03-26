import { motion, useReducedMotion } from 'motion/react'
import type { FamilyContractDisplayModel } from '../../lib/contracts-ui-model'

function statusMeta(status: FamilyContractDisplayModel['status']) {
  if (status === 'READY_TO_CLAIM') return { label: 'READY', cls: 'border-emerald-500/45 bg-emerald-500/10 text-emerald-200' }
  if (status === 'COMPLETED') return { label: 'DONE', cls: 'border-white/10 bg-white/5 text-slate-500' }
  if (status === 'FAILED') return { label: 'FAILED', cls: 'border-red-500/45 bg-red-500/10 text-red-200' }
  if (status === 'LOCKED') return { label: 'LOCKED', cls: 'border-purple-500/45 bg-purple-500/10 text-purple-200' }
  return { label: 'IN PROGRESS', cls: 'border-amber-500/35 bg-amber-500/10 text-amber-200' }
}

export function FamilyContractCard({
  contract,
  perspectivePilot,
  onClaim,
}: {
  contract: FamilyContractDisplayModel
  perspectivePilot: 'kirill' | 'roma'
  onClaim?: (contractId: string) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const meta = statusMeta(contract.status)
  const canClaim = contract.status === 'READY_TO_CLAIM'

  const otherPilot = perspectivePilot === 'roma' ? 'kirill' : 'roma'

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 overflow-hidden relative"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
      transition={{ duration: 0.15 }}
      aria-label={`Family contract ${contract.title}`}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-15 bg-cyan-400/50 blur-2xl" aria-hidden />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-gaming text-sm uppercase tracking-wider truncate">{contract.shortTitle}</h4>
            <span className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', meta.cls].join(' ')}>
              {meta.label}
            </span>
            <span className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-200">
              DMG {contract.damage}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">{contract.description}</p>
        </div>

        <button
          type="button"
          onClick={() => canClaim && onClaim?.(contract.id)}
          disabled={!canClaim}
          className={[
            'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[11px] uppercase tracking-widest touch-manipulation transition',
            canClaim
              ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 active:scale-[0.98]'
              : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed',
          ].join(' ')}
          aria-label={canClaim ? 'Claim contract' : 'Not ready to claim'}
        >
          CLAIM
        </button>
      </div>

      <div className="relative mt-3">
        <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500/70 via-purple-500/50 to-amber-500/60"
            initial={false}
            animate={{ width: `${contract.progressPct}%` }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: 'easeOut' }}
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">YOU</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                {perspectivePilot.toUpperCase()}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {contract.conditions.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-300">
                  <span className="truncate">{c.label}</span>
                  <span className={c.byPilot[perspectivePilot] ? 'text-emerald-300' : 'text-slate-500'}>
                    {c.byPilot[perspectivePilot] ? '✓' : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">BRO</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                {otherPilot.toUpperCase()}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {contract.conditions.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 font-mono text-[10px] text-slate-300">
                  <span className="truncate">{c.label}</span>
                  <span className={c.byPilot[otherPilot] ? 'text-emerald-300' : 'text-slate-500'}>
                    {c.byPilot[otherPilot] ? '✓' : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Reward: <span className="text-slate-300">{contract.rewardLabel}</span>
        </p>
      </div>
    </motion.div>
  )
}

