import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { PilotHUD } from '@/views/PilotHUD'
import { OperatorTerminal } from '@/views/OperatorTerminal'
import { ArchitectAdmin } from '@/views/ArchitectAdmin'

const DAILY_BASE_KEY = 'family_dailyBase'

function App() {
  const fetchState = useAppStore((s) => s.fetchState)
  const checkDailyReset = useAppStore((s) => s.checkDailyReset)

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
      <Route path="/pilot" element={<PilotHUD />} />
      <Route path="/operator" element={<OperatorTerminal />} />
      <Route path="/admin" element={<ArchitectAdmin />} />
      <Route path="/app" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
