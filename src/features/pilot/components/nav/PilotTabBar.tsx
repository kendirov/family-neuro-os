import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type PilotZoneTabId = 'base' | 'control' | 'arena'

const TABS: Array<{ id: PilotZoneTabId; label: string; short: string; icon: string }> = [
  { id: 'base', label: 'База', short: 'База', icon: '🏠' },
  { id: 'control', label: 'Пульт', short: 'Пульт', icon: '🎛️' },
  { id: 'arena', label: 'Арена', short: 'Арена', icon: '🏟️' },
]

function normalizePilotTab(raw: string | null): PilotZoneTabId {
  // Back-compat mapping (old Pilot tabs) → new zones
  if (raw === 'control') return 'control'
  if (raw === 'arena') return 'arena'
  if (raw === 'timer') return 'control'
  if (raw === 'raid') return 'arena'
  return 'base'
}

export function usePilotTab(): [PilotZoneTabId, (next: PilotZoneTabId) => void] {
  const [sp, setSp] = useSearchParams()
  const tab = normalizePilotTab(sp.get('tab'))
  if (import.meta.env.DEV) {
    const g = globalThis as unknown as { __TG_PILOT_TAB__?: string }
    if (g.__TG_PILOT_TAB__ !== tab) {
      g.__TG_PILOT_TAB__ = tab
      // eslint-disable-next-line no-console
      console.groupCollapsed('[TG_NAV] Pilot tab')
      // eslint-disable-next-line no-console
      console.log(tab)
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
  }
  const setTab = (next: PilotZoneTabId) => {
    const nextParams = new URLSearchParams(sp)
    nextParams.set('tab', next)
    setSp(nextParams, { replace: true })
  }
  return [tab, setTab]
}

export function PilotTabBar({ className }: { className?: string }) {
  const [tab, setTab] = usePilotTab()

  const a11y = useMemo(() => {
    const baseId = 'pilot-tabs'
    return {
      baseId,
      tablistId: `${baseId}-tablist`,
      tabId: (id: string) => `${baseId}-tab-${id}`,
      panelId: (id: string) => `${baseId}-panel-${id}`,
    }
  }, [])

  return (
    <nav
      className={cn(
        'fixed bottom-3 left-3 right-3 z-[80] md:static md:bottom-auto md:left-auto md:right-auto md:z-auto',
        className
      )}
      aria-label="Навигация пилота"
    >
      <div
        id={a11y.tablistId}
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          'panel-glass rounded-3xl border border-white/10 backdrop-blur-xl',
          'shadow-[0_10px_40px_rgba(0,0,0,0.45)]',
          'grid grid-cols-3 overflow-hidden'
        )}
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              id={a11y.tabId(t.id)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={a11y.panelId(t.id)}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={cn(
                'min-h-[58px] px-2 py-2 touch-manipulation transition relative',
                'font-gaming text-[11px] sm:text-xs font-black uppercase tracking-wider',
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              {active && (
                <span
                  className={cn(
                    'absolute inset-0',
                    'bg-gradient-to-br from-cyan-500/22 via-fuchsia-500/14 to-amber-500/14',
                    'border border-white/10'
                  )}
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-[16px] leading-none" aria-hidden>
                  {t.icon}
                </span>
                <span className="block truncate">{t.short}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

