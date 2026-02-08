import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/stores/useAppStore'

function profileToUser(row) {
  return {
    id: row.id,
    name: row.name ?? row.id,
    balance: Number(row.balance) ?? 0,
    color: row.color ?? (row.id === 'roma' ? 'cyan' : 'purple'),
  }
}

const LAST_ACTIVE_KEY = 'family_lastActiveDate'
const DAILY_BASE_KEY = 'family_dailyBase'

function App() {
  const fetchState = useAppStore((s) => s.fetchState)
  const setUsers = useAppStore((s) => s.setUsers)
  const checkDailyReset = useAppStore((s) => s.checkDailyReset)

  useEffect(() => {
    fetchState()
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

  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          const current = useAppStore.getState().users
          if (payload.new) {
            const updated = profileToUser(payload.new)
            const next = current.some((u) => u.id === updated.id)
              ? current.map((u) => (u.id === updated.id ? updated : u))
              : [...current, updated]
            setUsers(next)
          }
          if (payload.old && !payload.new) {
            setUsers(current.filter((u) => u.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [setUsers])

  return (
    <Routes>
      <Route path="/" element={<Dashboard mode="pilot" />} />
      <Route path="/app" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<Dashboard mode="commander" />} />
    </Routes>
  )
}

export default App
