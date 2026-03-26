import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { FamilyContractDisplayModel, FamilyContractsUiModel } from '../../lib/contracts-ui-model'
import { FAMILY_CONTRACTS_MOCK } from '../../mocks/contracts.mock'
import { FamilyContractCard } from './FamilyContractCard'
import { tgText } from '@/i18n/tgMessages'

type PilotId = 'kirill' | 'roma'

function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function hasPenaltyToday(transactions: Array<{ userId: string; at: number; amount: number; description?: string }>, pilotId: PilotId, reason: string) {
  const start = getTodayStartTs()
  const end = start + 24 * 60 * 60 * 1000
  return transactions.some((t) => t.userId === pilotId && t.at >= start && t.at < end && t.amount < 0 && (t.description ?? '').includes(reason))
}

function mealsDoneCount(isDailyBaseComplete: (userId: string, actionId: string) => boolean, pilotId: PilotId, meals: Array<'breakfast' | 'lunch' | 'dinner'>) {
  return meals.reduce((acc, m) => acc + (isDailyBaseComplete(pilotId, m) ? 1 : 0), 0)
}

function buildContracts({
  isDailyBaseComplete,
  transactions,
  claimed,
}: {
  isDailyBaseComplete: (userId: string, actionId: string) => boolean
  transactions: Array<{ userId: string; at: number; amount: number; description?: string }>
  claimed: Set<string>
}): FamilyContractsUiModel {
  const daily: FamilyContractDisplayModel[] = []
  const weekly: FamilyContractDisplayModel[] = []

  for (const def of FAMILY_CONTRACTS_MOCK) {
    const kirillDone = (ruleDone: boolean) => ruleDone
    const romaDone = (ruleDone: boolean) => ruleDone

    const byPilot: Record<PilotId, boolean> = { kirill: false, roma: false }

    let conditionLabel = def.rules.label
    let conditionId = `${def.id}_cond`

    if (def.rules.kind === 'BOTH_TASK_DONE') {
      byPilot.kirill = isDailyBaseComplete('kirill', def.rules.taskId)
      byPilot.roma = isDailyBaseComplete('roma', def.rules.taskId)
    }

    if (def.rules.kind === 'BOTH_MEALS_DONE') {
      byPilot.kirill = mealsDoneCount(isDailyBaseComplete, 'kirill', def.rules.meals) >= 2
      byPilot.roma = mealsDoneCount(isDailyBaseComplete, 'roma', def.rules.meals) >= 2
      conditionLabel = def.rules.label
    }

    if (def.rules.kind === 'BOTH_NO_PENALTY') {
      byPilot.kirill = !hasPenaltyToday(transactions, 'kirill', def.rules.penaltyReason)
      byPilot.roma = !hasPenaltyToday(transactions, 'roma', def.rules.penaltyReason)
      conditionLabel = def.rules.label
      conditionId = `${def.id}_${def.rules.penaltyReason}`
    }

    if (def.rules.kind === 'BOTH_REQUIRED_DONE') {
      byPilot.kirill = def.rules.requiredTaskIds.every((id) => isDailyBaseComplete('kirill', id))
      byPilot.roma = def.rules.requiredTaskIds.every((id) => isDailyBaseComplete('roma', id))
      conditionLabel = def.rules.label
      conditionId = `${def.id}_required`
    }

    const conditions = [
      {
        id: conditionId,
        kind: def.rules.kind,
        label: conditionLabel,
        byPilot,
      },
    ]

    const totalChecks = 2
    const doneChecks = (byPilot.kirill ? 1 : 0) + (byPilot.roma ? 1 : 0)
    const progressPct = Math.round((doneChecks / totalChecks) * 100)

    const allDone = byPilot.kirill && byPilot.roma
    const status: FamilyContractDisplayModel['status'] =
      claimed.has(def.id)
        ? 'COMPLETED'
        : def.statusHint
          ? def.statusHint
          : allDone
            ? 'READY_TO_CLAIM'
            : 'IN_PROGRESS'

    const model: FamilyContractDisplayModel = {
      id: def.id,
      cadence: def.cadence,
      title: def.title,
      shortTitle: def.shortTitle,
      description: def.description,
      damage: def.damage,
      status,
      conditions,
      progressPct,
      rewardLabel: def.rewardLabel,
    }

    if (def.cadence === 'DAILY') daily.push(model)
    else weekly.push(model)
  }

  return { daily, weekly }
}

export function FamilyContractsPanel({
  perspectivePilot,
  claimedIds,
  onClaim,
  onOpenRaid,
}: {
  perspectivePilot: PilotId
  claimedIds: Set<string>
  onClaim: (contractId: string, damage: number, title: string) => void
  onOpenRaid: () => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const transactionsRaw = useAppStore((s) => s.transactions ?? [])
  const transactions = Array.isArray(transactionsRaw) ? transactionsRaw : []

  const ui = useMemo(
    () => buildContracts({ isDailyBaseComplete, transactions, claimed: claimedIds }),
    [isDailyBaseComplete, transactions, claimedIds]
  )

  const dailyReady = ui.daily.filter((c) => c.status === 'READY_TO_CLAIM').length
  const weeklyReady = ui.weekly.filter((c) => c.status === 'READY_TO_CLAIM').length

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4" aria-label={tgText('kid', 'familyContracts.aria')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300/90">
            {tgText('kid', 'familyContracts.title')}
          </h3>
          <p className="mt-1 font-mono text-xs text-slate-400/90">
            Командные условия. Вклад {perspectivePilot === 'roma' ? 'Ромы' : 'Кирилла'} и брата виден сразу.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={onOpenRaid}
          className="shrink-0 rounded-2xl border border-purple-500/35 bg-purple-500/10 px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-purple-200 hover:bg-purple-500/20 active:scale-[0.98] touch-manipulation"
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          aria-label={tgText('kid', 'familyContracts.openRaidAria')}
        >
          {tgText('kid', 'familyContracts.openRaid')}
        </motion.button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.stats.daily')}</div>
          <div className="mt-1 font-mono text-sm text-slate-200 tabular-nums">
            {tgText('kid', 'familyContracts.stats.ready', { count: dailyReady })}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.stats.weekly')}</div>
          <div className="mt-1 font-mono text-sm text-slate-200 tabular-nums">
            {tgText('kid', 'familyContracts.stats.ready', { count: weeklyReady })}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.today')}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.tapClaim')}</span>
        </div>
        <AnimatePresence mode="popLayout">
          {ui.daily.slice(0, 3).map((c) => (
            <motion.div key={c.id} layout>
              <FamilyContractCard
                contract={c}
                perspectivePilot={perspectivePilot}
                onClaim={(contractId) => onClaim(contractId, c.damage, c.title)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.week')}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'familyContracts.bigDamage')}</span>
          </div>
          <div className="mt-3 space-y-3">
            <AnimatePresence mode="popLayout">
              {ui.weekly.slice(0, 2).map((c) => (
                <motion.div key={c.id} layout>
                  <FamilyContractCard
                    contract={c}
                    perspectivePilot={perspectivePilot}
                    onClaim={(contractId) => onClaim(contractId, c.damage, c.title)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

