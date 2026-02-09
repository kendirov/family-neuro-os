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
  const syncTimerStateFromProfile = useAppStore((s) => s.syncTimerStateFromProfile)

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
    // Realtime subscription to profiles table for instant multi-device sync
    // Listens to UPDATE events and immediately syncs timer state across all devices
    const channel = supabase
      .channel('profiles-timer-sync')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', // Only listen to UPDATE events for timer state changes
          schema: 'public', 
          table: 'profiles'
        },
        (payload) => {
          // Only process updates for pilot profiles (roma, kirill)
          const pilotId = payload.new?.id
          if (!pilotId || (pilotId !== 'roma' && pilotId !== 'kirill')) {
            return
          }
          
          console.log('[Realtime] Timer state updated:', pilotId, {
            timer_status: payload.new?.timer_status,
            timer_start_at: payload.new?.timer_start_at,
            seconds_today: payload.new?.seconds_today,
            timer_mode: payload.new?.timer_mode
          })
          
          const current = useAppStore.getState().users
          if (payload.new) {
            // Update users list (balance, name, etc.)
            const updated = profileToUser(payload.new)
            const next = current.some((u) => u.id === updated.id)
              ? current.map((u) => (u.id === updated.id ? updated : u))
              : [...current, updated]
            setUsers(next)
            
            // CRITICAL: Immediately sync timer state from server-authoritative DB changes
            // This ensures instant updates when timer is started/paused/stopped on another device
            // The UI will react instantly via the ticker (setInterval) in PilotEngine.jsx
            syncTimerStateFromProfile(payload.new)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Successfully subscribed to profiles timer updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel subscription error')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [setUsers, syncTimerStateFromProfile])

  return (
    <Routes>
      <Route path="/" element={<Dashboard mode="pilot" />} />
      <Route path="/app" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<Dashboard mode="commander" />} />
    </Routes>
  )
}

export default App
