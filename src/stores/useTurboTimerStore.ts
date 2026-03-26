import { create } from 'zustand'
import { useAppStore } from '@/stores/useAppStore'
import { startActiveTimer, pauseActiveTimer, stopActiveTimer } from '@/lib/activeTimersService'
import { playBurnTick } from '@/lib/sounds'

type TimerStatus = 'idle' | 'playing' | 'paused' | 'stopped' | 'expired' | 'error'
type TimerMode = 'game' | 'cartoons' | 'other'
type SelectedChildId = 'roma' | 'kirill' | 'both' | null
type ActivityType = 'game' | 'youtube' | 'good'

type BurnMap = Record<'roma' | 'kirill', number>

function nowIso() {
  return new Date().toISOString()
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function modeToTimerMode(raw: string | null | undefined): TimerMode {
  if (raw === 'game') return 'game'
  if (raw === 'youtube' || raw === 'good' || raw === 'cartoon' || raw === 'media') return 'cartoons'
  return 'other'
}

function getTargetIds(selectedChildId: SelectedChildId): Array<'roma' | 'kirill'> {
  if (selectedChildId === 'roma') return ['roma']
  if (selectedChildId === 'kirill') return ['kirill']
  return ['kirill', 'roma']
}

let intervalHandle: ReturnType<typeof setInterval> | null = null

export type TurboTimerState = {
  status: TimerStatus
  selectedChildId: SelectedChildId
  mode: TimerMode
  /** More specific mode used for burn + active_timers bridge. */
  activityType: ActivityType

  remainingSeconds: number
  totalSeconds: number
  startedAt: string | null
  lastTickAt: string | null

  isHydrated: boolean
  errorMessage: string | null

  /** Internal bookkeeping: last whole minute we applied burn for (per pilot) */
  lastBurnedMinuteByPilot: BurnMap

  /** Actions */
  hydrateFromAppStore: () => void
  selectChild: (id: SelectedChildId) => void
  setMode: (mode: TimerMode) => void
  setCartoonsFlavor: (flavor: Exclude<ActivityType, 'game'>) => void

  startTimer: () => Promise<void>
  pauseTimer: () => Promise<void>
  resumeTimer: () => Promise<void>
  stopTimer: () => Promise<void>
  resetTimer: () => void

  tick: () => void
  applyBurn: () => void
}

export const useTurboTimerStore = create<TurboTimerState>((set, get) => ({
  status: 'idle',
  selectedChildId: 'both',
  mode: 'game',
  activityType: 'game',

  remainingSeconds: 0,
  totalSeconds: 0,
  startedAt: null,
  lastTickAt: null,

  isHydrated: false,
  errorMessage: null,

  lastBurnedMinuteByPilot: { roma: 0, kirill: 0 },

  hydrateFromAppStore: () => {
    const app = useAppStore.getState()
    const pilots = app.pilots ?? {}
    const users = app.users ?? []

    const anyRunning =
      pilots?.roma?.timerStatus === 'running' || pilots?.kirill?.timerStatus === 'running'
    const anyPaused =
      pilots?.roma?.timerStatus === 'paused' || pilots?.kirill?.timerStatus === 'paused'

    const status: TimerStatus = anyRunning ? 'playing' : anyPaused ? 'paused' : 'idle'

    // Choose mode from the first active pilot, otherwise keep current store mode
    const activePilotMode =
      (pilots?.kirill?.timerStatus !== 'idle' ? pilots?.kirill?.mode : null) ??
      (pilots?.roma?.timerStatus !== 'idle' ? pilots?.roma?.mode : null) ??
      null

    const derivedMode = activePilotMode ? modeToTimerMode(activePilotMode) : get().mode
    const derivedActivityType: ActivityType =
      activePilotMode === 'good' ? 'good' : activePilotMode === 'youtube' ? 'youtube' : 'game'

    // Derive a conservative total/remaining from balances (minutes == XP)
    const ids = getTargetIds(get().selectedChildId)
    const totals = ids.map((id) => {
      const bal =
        pilots?.[id]?.sessionBalanceAtStart ??
        users.find((u: any) => u.id === id)?.balance ??
        0
      return Math.max(0, Math.floor(Number(bal) || 0) * 60)
    })
    const totalSeconds = totals.length ? Math.min(...totals) : 0

    set({
      status,
      mode: derivedMode,
      activityType: derivedMode === 'game' ? 'game' : derivedMode === 'cartoons' ? derivedActivityType : get().activityType,
      totalSeconds,
      // Remaining will be recalculated on first tick
      isHydrated: true,
      errorMessage: null,
    })

    if (status === 'playing') {
      get().tick()
      ensureInterval()
    } else {
      // paused/idle/stopped/expired: no interval (prevents noisy logs + duplicate timers)
      get().tick()
      clearIntervalIfAny()
    }

    console.log('[TG_TIMER] hydrate', {
      status,
      selectedChildId: get().selectedChildId,
      mode: derivedMode,
      activityType: get().activityType,
      totalSeconds,
    })
  },

  selectChild: (id) => {
    set({ selectedChildId: id })
    console.log('[TG_TIMER] selectChild', { selectedChildId: id })
    // Recompute totals on next tick
    get().tick()
  },

  setMode: (mode) => {
    // Keep activityType compatible with mode.
    set((s) => ({
      mode,
      activityType: mode === 'game' ? 'game' : s.activityType === 'game' ? 'youtube' : s.activityType,
    }))
    console.log('[TG_TIMER] setMode', { mode, activityType: get().activityType })
  },

  setCartoonsFlavor: (flavor) => {
    if (flavor !== 'youtube' && flavor !== 'good') return
    set((s) => ({
      mode: s.mode === 'game' ? 'cartoons' : s.mode,
      activityType: flavor,
    }))
    console.log('[TG_TIMER] setCartoonsFlavor', { flavor })
  },

  startTimer: async () => {
    const { selectedChildId, mode, activityType } = get()
    const ids = getTargetIds(selectedChildId)
    const app = useAppStore.getState()
    const users = app.users ?? []

    // Basic safety: require at least 1 XP for all targets
    const canStart = ids.every((id) => (users.find((u: any) => u.id === id)?.balance ?? 0) >= 1)
    if (!canStart) {
      const msg = 'Недостаточно энергии для старта'
      set({ status: 'error', errorMessage: msg })
      console.warn('[TG_TIMER] startTimer blocked', { selectedChildId, mode, msg })
      return
    }

    set({
      status: 'playing',
      errorMessage: null,
      startedAt: nowIso(),
      lastTickAt: nowIso(),
      lastBurnedMinuteByPilot: { roma: 0, kirill: 0 },
    })

    console.log('[TG_TIMER] startTimer', { selectedChildId, mode, activityType, ids })

    try {
      // Best-effort active_timers for richer multi-device UI; not authoritative
      for (const id of ids) {
        await startActiveTimer(id, activityType)
      }
    } catch (e: any) {
      console.warn('[TG_TIMER] startActiveTimer failed (non-fatal)', {
        selectedChildId,
        mode,
        activityType,
        error: e?.message ?? String(e),
      })
    }

    // Authoritative engine start (profiles + store state)
    for (const id of ids) {
      // await to avoid races with realtime sync and mode reconstruction
      await useAppStore.getState().startEngine(id, activityType)
    }

    get().tick()
    ensureInterval()
  },

  pauseTimer: async () => {
    const { selectedChildId, mode, activityType } = get()
    const ids = getTargetIds(selectedChildId)
    console.log('[TG_TIMER] pauseTimer', { selectedChildId, mode, activityType, ids })

    set({ status: 'paused', lastTickAt: nowIso(), errorMessage: null })
    clearIntervalIfAny()

    try {
      for (const id of ids) {
        // Pause active_timers if present; non-fatal
        await pauseActiveTimer(id, activityType, null as any)
      }
    } catch (e: any) {
      console.warn('[TG_TIMER] pauseActiveTimer failed (non-fatal)', {
        selectedChildId,
        mode,
        activityType,
        error: e?.message ?? String(e),
      })
    }

    for (const id of ids) {
      await useAppStore.getState().pauseEngine(id)
    }
  },

  resumeTimer: async () => {
    const { selectedChildId, mode, activityType } = get()
    const ids = getTargetIds(selectedChildId)
    console.log('[TG_TIMER] resumeTimer', { selectedChildId, mode, activityType, ids })

    set({ status: 'playing', lastTickAt: nowIso(), errorMessage: null })

    try {
      for (const id of ids) {
        // We can reuse "startActiveTimer" as resume for now (it upserts)
        await startActiveTimer(id, activityType)
      }
    } catch (e: any) {
      console.warn('[TG_TIMER] resume active_timers failed (non-fatal)', {
        selectedChildId,
        mode,
        activityType,
        error: e?.message ?? String(e),
      })
    }

    for (const id of ids) {
      await useAppStore.getState().resumeEngine(id)
    }

    get().tick()
    ensureInterval()
  },

  stopTimer: async () => {
    const { selectedChildId, mode, activityType } = get()
    const ids = getTargetIds(selectedChildId)
    console.log('[TG_TIMER] stopTimer', { selectedChildId, mode, activityType, ids })

    set({ status: 'stopped', lastTickAt: nowIso(), errorMessage: null })
    clearIntervalIfAny()

    try {
      for (const id of ids) {
        await stopActiveTimer(id, activityType, null as any, () => {})
      }
    } catch (e: any) {
      console.warn('[TG_TIMER] stopActiveTimer failed (non-fatal)', {
        selectedChildId,
        mode,
        activityType,
        error: e?.message ?? String(e),
      })
    }

    for (const id of ids) {
      await useAppStore.getState().stopEngine(id)
    }
  },

  resetTimer: () => {
    console.log('[TG_TIMER] resetTimer')
    clearIntervalIfAny()
    set({
      status: 'idle',
      remainingSeconds: 0,
      totalSeconds: 0,
      startedAt: null,
      lastTickAt: null,
      errorMessage: null,
      lastBurnedMinuteByPilot: { roma: 0, kirill: 0 },
    })
  },

  tick: () => {
    const s = get()
    const app = useAppStore.getState()
    const pilots = app.pilots ?? {}
    const users = app.users ?? []

    const ids = getTargetIds(s.selectedChildId)
    const elapsedByPilot = ids.map((id) => {
      const p: any = pilots?.[id]
      if (!p) return 0
      if (p.timerStatus === 'paused') return Number(p.sessionElapsed ?? 0) || 0
      if (p.timerStatus === 'running' && p.timerStartAt) {
        const startMs = new Date(p.timerStartAt).getTime()
        return Math.max(0, Math.floor((Date.now() - startMs) / 1000))
      }
      return 0
    })

    const elapsedSeconds = elapsedByPilot.length ? Math.max(...elapsedByPilot) : 0

    const totals = ids.map((id) => {
      const p: any = pilots?.[id]
      const bal =
        p?.sessionBalanceAtStart ??
        users.find((u: any) => u.id === id)?.balance ??
        0
      return Math.max(0, Math.floor(Number(bal) || 0) * 60)
    })
    const totalSeconds = totals.length ? Math.min(...totals) : 0
    const remainingSeconds = totalSeconds > 0 ? clamp(totalSeconds - elapsedSeconds, 0, totalSeconds) : 0

    set({ totalSeconds, remainingSeconds, lastTickAt: nowIso() })

    console.log('[TG_TIMER] tick', {
      selectedChildId: s.selectedChildId,
      mode: s.mode,
      remainingSeconds,
      totalSeconds,
    })

    if (s.status === 'playing') {
      get().applyBurn()
      if (totalSeconds > 0 && remainingSeconds <= 0) {
        console.warn('[TG_TIMER] expired', { selectedChildId: s.selectedChildId, mode: s.mode })
        set({ status: 'expired' })
        clearIntervalIfAny()
      }
    }
  },

  applyBurn: () => {
    const s = get()
    if (s.status !== 'playing') return

    const app = useAppStore.getState()
    const pilots = app.pilots ?? {}
    const users = app.users ?? []
    const ids = getTargetIds(s.selectedChildId)

    ids.forEach((id) => {
      const p: any = pilots?.[id]
      if (!p || p.timerStatus !== 'running') return

      const elapsedSeconds = p.timerStartAt
        ? Math.max(0, Math.floor((Date.now() - new Date(p.timerStartAt).getTime()) / 1000))
        : 0
      const currentMinute = Math.floor(elapsedSeconds / 60)

      const lastMinute = (get().lastBurnedMinuteByPilot as any)[id] ?? 0
      if (currentMinute <= lastMinute) return

      // Apply burn exactly once per minute boundary. Process minute-by-minute to avoid skipping.
      let localGameTime = useAppStore.getState().getTodayGameTime(id)
      let localMediaTime = useAppStore.getState().getTodayMediaTime(id)
      let burnedTotal = 0

      for (let m = lastMinute + 1; m <= currentMinute; m++) {
        const user = users.find((u: any) => u.id === id)
        if (!user || (user.balance ?? 0) <= 0) {
          console.warn('[TG_TIMER] burn blocked (no balance)', { id, mode: s.mode, m })
          return
        }

        // Prefer authoritative per-pilot mode from store (keeps youtube vs good stable).
        const rawMode: ActivityType = p?.mode === 'good' ? 'good' : p?.mode === 'youtube' ? 'youtube' : s.activityType

        // Tiered burn rates (matches previous ControlCenter logic):
        // Media (youtube/good): 0..20 => 0, 20..60 => 0.5, 60+ => 2
        // Game: 0..60 => 1, 60+ => 2
        let rate = 1
        if (rawMode === 'youtube' || rawMode === 'good') {
          if (localMediaTime < 20) rate = 0
          else if (localMediaTime < 60) rate = 0.5
          else rate = 2
          localMediaTime += 1
        } else {
          if (localGameTime < 60) rate = 1
          else rate = 2
          localGameTime += 1
        }

        if (rate === 0) {
          // 0 XP, but still counts as screen time minute.
          useAppStore.getState().addGamingMinutesToday(1, rawMode, [id])
          console.log('[TG_TIMER] burn', { childId: id, mode: rawMode, minute: m, deltaXP: 0 })
          continue
        }

        const amount = Math.min(rate, user.balance ?? 0)
        if (amount <= 0) {
          console.warn('[TG_TIMER] burn blocked (amount<=0)', { childId: id, rawMode, minute: m })
          return
        }

        // DB-safe burn updates: transactions + profiles + local users balance + time tracking.
        useAppStore.getState().updateSessionBurn(id, amount, m, rawMode)
        burnedTotal += amount

        console.log('[TG_TIMER] burn', { childId: id, mode: rawMode, minute: m, deltaXP: -amount })
      }

      set((prev) => ({
        lastBurnedMinuteByPilot: {
          ...prev.lastBurnedMinuteByPilot,
          [id]: currentMinute,
        },
      }))

      if (burnedTotal > 0) {
        try {
          playBurnTick()
        } catch (_) {}
      }
    })
  },
}))

function ensureInterval() {
  if (intervalHandle) return
  intervalHandle = setInterval(() => {
    try {
      useTurboTimerStore.getState().tick()
    } catch (e: any) {
      console.error('[TG_TIMER] interval tick error', e)
      useTurboTimerStore.setState({
        status: 'error',
        errorMessage: e?.message ?? String(e),
      } as any)
      clearIntervalIfAny()
    }
  }, 1000)
  console.log('[TG_TIMER] interval started')
}

function clearIntervalIfAny() {
  if (!intervalHandle) return
  clearInterval(intervalHandle)
  intervalHandle = null
  console.log('[TG_TIMER] interval cleared')
}

