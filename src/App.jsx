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

function App() {
  const fetchState = useAppStore((s) => s.fetchState)
  const setUsers = useAppStore((s) => s.setUsers)

  useEffect(() => {
    fetchState()
  }, [fetchState])

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
