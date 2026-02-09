import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'

/**
 * GlobalStatus: slim digital vault bar at top of dashboard.
 * Shows total XP for each pilot as clean numeric counters.
 */
export function GlobalStatus() {
  const users = useAppStore((s) => s.users)

  const { roma, kirill } = useMemo(() => {
    const romaUser = users?.find((u) => u.id === 'roma') || null
    const kirillUser = users?.find((u) => u.id === 'kirill') || null
    return { roma: romaUser, kirill: kirillUser }
  }, [users])

  if (!roma && !kirill) return null

  return (
    <section
      className="global-status px-4 pt-1 md:px-6"
      aria-label="Общий накопитель энергии"
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/85 px-3 py-2 shadow-[0_4px_18px_rgba(0,0,0,0.7)]">
        {/* Left: Kirill */}
        {kirill && (
          <div className="flex items-center gap-2 min-w-0">
            <PilotAvatar pilotId="kirill" size="engine" />
            <div className="flex flex-col leading-tight">
              <span className="font-mono text-[10px] uppercase tracking-widest text-purple-300">
                КИРИЛЛ
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs" aria-hidden>
                  🟣
                </span>
                <span className="font-lcd text-sm sm:text-base font-bold tabular-nums text-purple-200 drop-shadow-[0_0_10px_rgba(192,132,252,0.9)]">
                  TOTAL: {kirill.balance ?? 0} XP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Center label */}
        <div className="hidden sm:flex flex-col items-center justify-center flex-1 min-w-0 px-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500 text-center">
            ОБЩИЙ НАКОПИТЕЛЬ
          </span>
        </div>

        {/* Right: Roma */}
        {roma && (
          <div className="flex items-center gap-2 min-w-0 justify-end">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-300">
                РОМА
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-lcd text-sm sm:text-base font-bold tabular-nums text-cyan-200 drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]">
                  TOTAL: {roma.balance ?? 0} XP
                </span>
                <span className="text-xs" aria-hidden>
                  🔵
                </span>
              </div>
            </div>
            <PilotAvatar pilotId="roma" size="engine" />
          </div>
        )}
      </div>
    </section>
  )
}

