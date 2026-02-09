import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { useAppStore } from '@/stores/useAppStore'

const LAST_ACTIVE_KEY = 'family_lastActiveDate'
const DAILY_BASE_KEY = 'family_dailyBase'

function App() {
  const fetchState = useAppStore((s) => s.fetchState)
  const checkDailyReset = useAppStore((s) => s.checkDailyReset)

  // Load data from Supabase, then subscribe to Realtime so timer state syncs across tabs/devices
  useEffect(() => {
    let unsubscribeRealtime = null
    fetchState().then(() => {
      unsubscribeRealtime = useAppStore.getState().subscribeToRealtime?.() ?? null
    })
    return () => {
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

  // Realtime subscription is now owned by the store and initialized from Dashboard.

  return (
    <Routes>
      <Route path="/" element={<Dashboard mode="pilot" />} />
      <Route path="/app" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<Dashboard mode="commander" />} />
    </Routes>
  )
}

export default App
