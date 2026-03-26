import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'
import { makeWellnessMock } from '../mocks/wellness.mock'
import { computeFamilyBonusPreview, computeTodayChecklist, computeWeeklyAdherence } from '../lib/wellness-selectors'
import type { AdultWellnessUiModel, SleepModel, WellnessActionHandlers } from '../lib/wellness-ui-model'
import { WellnessHero } from '../components/hero/WellnessHero'
import { QuickLogBar, type QuickLogActionId } from '../components/actions/QuickLogBar'
import { TodayWellnessChecklist } from '../components/cards/TodayWellnessChecklist'
import { HydrationCard } from '../components/cards/HydrationCard'
import { StepsCard } from '../components/cards/StepsCard'
import { VitaminsCard } from '../components/cards/VitaminsCard'
import { SleepCard } from '../components/cards/SleepCard'
import { StreakBonusCard } from '../components/cards/StreakBonusCard'
import { WeeklyTrendCard } from '../components/charts/WeeklyTrendCard'
import { WellnessHistorySheet } from '../components/history/WellnessHistorySheet'

function WellnessLayout({ children }: { children: React.ReactNode }) {
  // Visually isolated: no Turbo Garage grid overlay, no neon accents.
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 110% 70% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(2,6,23,0) 55%),' +
            'radial-gradient(ellipse 90% 60% at 20% 20%, rgba(16,185,129,0.06) 0%, rgba(2,6,23,0) 55%),' +
            'radial-gradient(ellipse 90% 60% at 80% 30%, rgba(148,163,184,0.05) 0%, rgba(2,6,23,0) 60%)',
        }}
      />
      <div className="relative">
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-[92px]">
          {children}
        </div>
      </div>
    </div>
  )
}

function formatDateLabel() {
  const d = new Date()
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function AdultWellnessPage() {
  const reduce = useReducedMotion()
  const [ui, setUi] = useState<AdultWellnessUiModel>(() => makeWellnessMock())
  const [hint, setHint] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const actions: WellnessActionHandlers = useMemo(
    () => ({
      logWater: async ({ amountMl }) => {
        setUi((prev) => {
          const nextHydration = { ...prev.hydration, todayMl: prev.hydration.todayMl + amountMl, lastLogAt: Date.now() }
          const checklist = computeTodayChecklist({
            goals: prev.goals,
            hydration: nextHydration,
            steps: prev.steps,
            vitamins: prev.vitamins,
            sleep: prev.sleep,
          })
          return { ...prev, hydration: nextHydration, checklist }
        })
      },
      logSteps: async ({ steps }) => {
        setUi((prev) => {
          const nextSteps = { ...prev.steps, todaySteps: prev.steps.todaySteps + steps, lastLogAt: Date.now() }
          const checklist = computeTodayChecklist({
            goals: prev.goals,
            hydration: prev.hydration,
            steps: nextSteps,
            vitamins: prev.vitamins,
            sleep: prev.sleep,
          })
          return { ...prev, steps: nextSteps, checklist }
        })
      },
      markVitaminTaken: async () => {
        setUi((prev) => {
          const nextV = { ...prev.vitamins, takenToday: true, lastLogAt: Date.now() }
          const checklist = computeTodayChecklist({
            goals: prev.goals,
            hydration: prev.hydration,
            steps: prev.steps,
            vitamins: nextV,
            sleep: prev.sleep,
          })
          return { ...prev, vitamins: nextV, checklist }
        })
      },
      logSleep: async ({ hours, quality }) => {
        setUi((prev) => {
          const nextS: SleepModel = { ...prev.sleep, lastNightHours: hours, quality, lastLogAt: Date.now() }
          const checklist = computeTodayChecklist({
            goals: prev.goals,
            hydration: prev.hydration,
            steps: prev.steps,
            vitamins: prev.vitamins,
            sleep: nextS,
          })
          return { ...prev, sleep: nextS, checklist }
        })
      },
      closeWellnessDay: async () => {
        // UI-only: recompute streak + weekly marker. Server will own the business truth later.
        setUi((prev) => {
          const ideal = prev.checklist.idealDay
          const nextStreakDays = ideal ? prev.streak.currentDays + 1 : 0
          const target = prev.goals.idealStreakTargetDays
          const familyBonus = computeFamilyBonusPreview({ streakDays: nextStreakDays, targetDays: target, hasActiveBonus: false })

          const nextWeeklyDays = prev.weekly.days.map((d, idx) => {
            if (idx !== prev.weekly.days.length - 1) return d
            return { ...d, idealDay: ideal, waterOk: prev.checklist.waterOk, stepsOk: prev.checklist.stepsOk, vitaminsOk: prev.checklist.vitaminsOk, sleepOk: prev.checklist.sleepOk }
          })
          const nextWeekly = {
            ...prev.weekly,
            days: nextWeeklyDays,
            adherencePct: computeWeeklyAdherence({ ...prev.weekly, days: nextWeeklyDays }),
          }

          return {
            ...prev,
            streak: {
              ...prev.streak,
              currentDays: nextStreakDays,
              remainingToTarget: Math.max(0, target - nextStreakDays),
              familyBonus,
            },
            weekly: nextWeekly,
          }
        })
      },
      fetchWellnessSummary: async () => {},
      fetchWeeklyWellness: async () => {},
    }),
    []
  )

  const onQuickAction = async (id: QuickLogActionId) => {
    if (id === 'water_250') {
      await actions.logWater({ amountMl: 250 })
      setHint('Hydration logged (+250 ml)')
    } else if (id === 'water_500') {
      await actions.logWater({ amountMl: 500 })
      setHint('Hydration logged (+500 ml)')
    } else if (id === 'steps_1000') {
      await actions.logSteps({ steps: 1000 })
      setHint('Steps logged (+1,000)')
    } else if (id === 'vitamins') {
      await actions.markVitaminTaken()
      setHint('Vitamins marked as taken')
    } else if (id === 'close_day') {
      await actions.closeWellnessDay()
      setHint(ui.checklist.idealDay ? 'Day closed (ideal day)' : 'Day closed'
      )
    } else if (id === 'history') {
      setHistoryOpen(true)
      setHint(null)
      return
    }

    window.setTimeout(() => setHint(null), 1400)
  }

  return (
    <WellnessLayout>
      <LayoutGroup>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.3, ease: 'easeOut' }}
          className="space-y-4"
        >
          <WellnessHero
            title="Wellness"
            subtitle="Calm, premium tracking. Designed for one-hand use."
            rightLabel={formatDateLabel()}
          />

          <div className="grid grid-cols-1 gap-4">
            <TodayWellnessChecklist model={ui.checklist} />
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HydrationCard model={ui.hydration} onQuickAdd={(ml) => actions.logWater({ amountMl: ml })} />
            <StepsCard model={ui.steps} onQuickLog={(steps) => actions.logSteps({ steps })} />
            <VitaminsCard model={ui.vitamins} onMarkTaken={() => actions.markVitaminTaken()} />
            <SleepCard model={ui.sleep} onQuickLog={(p) => actions.logSleep(p)} />
          </motion.div>

          <motion.div layout className="grid grid-cols-1 gap-4">
            <StreakBonusCard model={ui.streak} onOpenHistory={() => setHistoryOpen(true)} />
            <WeeklyTrendCard model={ui.weekly} />
          </motion.div>

          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-sans-data text-[14px] font-semibold text-slate-50">Integration points</h3>
                <p className="mt-1 font-sans-data text-[12px] text-slate-400 leading-snug">
                  UI uses mocks + stubs. Server will own bonus business truth.
                </p>
              </div>
              <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-300">
                stage 3b
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'logWater(...)',
                'logSteps(...)',
                'markVitaminTaken(...)',
                'logSleep(...)',
                'closeWellnessDay(...)',
                'fetchWellnessSummary(...)',
                'fetchWeeklyWellness(...)',
              ].map((x) => (
                <div key={x} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-slate-200">{x}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <QuickLogBar onAction={onQuickAction} hint={hint} />

        <WellnessHistorySheet open={historyOpen} items={ui.historyPreview} onClose={() => setHistoryOpen(false)} />

        <AnimatePresence initial={false}>
          {ui.streak.familyBonus.status !== 'locked' && (
            <motion.div
              key="bonus-toast"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: reduce ? 0.01 : 0.2 }}
              className="fixed left-1/2 -translate-x-1/2 top-4 z-40 w-[min(92vw,42rem)]"
              aria-live="polite"
            >
              <div className={cn('rounded-2xl border px-4 py-3 backdrop-blur-2xl shadow-lg', 'border-white/10 bg-slate-950/65')}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">
                    family bonus
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-200">
                    {ui.streak.familyBonus.status}
                  </span>
                </div>
                <div className="mt-1 font-sans-data text-[12px] text-slate-200/90 leading-snug">
                  {ui.streak.familyBonus.previewText}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </WellnessLayout>
  )
}

