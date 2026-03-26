import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { PilotHUD } from '@/views/PilotHUD'
import { PilotHomePage } from '@/features/pilot/pages/PilotHomePage'
import { OperatorTerminal } from '@/views/OperatorTerminal'
import { AdultWellnessPage } from '@/features/wellness/pages/AdultWellnessPage'
import { AdminLayout } from '@/features/admin/layouts/AdminLayout'
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage'
import { AdminTimerPage } from '@/features/admin/pages/AdminTimerPage'
import { AdminRewardsPage } from '@/features/admin/pages/AdminRewardsPage'
import { AdminLogsPage } from '@/features/admin/pages/AdminLogsPage'
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage'

const DAILY_BASE_KEY = 'family_dailyBase'

function App() {
  const fetchState = useAppStore((s) => s.fetchState)
  const checkDailyReset = useAppStore((s) => s.checkDailyReset)
  const location = useLocation()

  // Load data from Supabase, then subscribe to Realtime so timer state syncs across tabs/devices.
  // cancelled-flag prevents subscription if component unmounts before fetchState resolves.
  useEffect(() => {
    let cancelled = false
    let unsubscribeRealtime = null
    fetchState().then(() => {
      if (cancelled) return
      unsubscribeRealtime = useAppStore.getState().subscribeToRealtime?.() ?? null
    })
    return () => {
      cancelled = true
      if (typeof unsubscribeRealtime === 'function') unsubscribeRealtime()
    }
  }, [fetchState])

  useEffect(() => {
    checkDailyReset()
  }, [checkDailyReset])

  useEffect(() => {
    if (!import.meta.env.DEV) return
    // eslint-disable-next-line no-console
    console.groupCollapsed('[TG_NAV] Route change')
    // eslint-disable-next-line no-console
    console.log({ pathname: location.pathname, search: location.search, hash: location.hash })
    // eslint-disable-next-line no-console
    console.groupEnd()
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    return useAppStore.subscribe((state) => {
      if (typeof localStorage === 'undefined') return
      const today = new Date().toISOString().slice(0, 10)
      if (state.lastActiveDate === today && state.dailyBase)
        localStorage.setItem(DAILY_BASE_KEY, JSON.stringify(state.dailyBase))
    })
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pilot" replace />} />
      <Route path="/pilot" element={<PilotHomePage />} />
      <Route path="/pilot/hud" element={<PilotHUD />} />
      <Route path="/operator" element={<OperatorTerminal />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="timer" element={<AdminTimerPage />} />
        <Route path="rewards" element={<AdminRewardsPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="/wellness" element={<AdultWellnessPage />} />
      <Route path="/app" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
