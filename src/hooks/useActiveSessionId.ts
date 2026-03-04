/**
 * useActiveSessionId(userId) — возвращает id активной сессии для пилота.
 * Используется для получения sessionId для usePenaltyTimer, когда есть только user_id.
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useActiveSessionId(userId: string | null): string | null {
  const [sessionId, setSessionId] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!userId) {
      setSessionId(null)
      return
    }
    const { data, error } = await supabase
      .from('active_sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['active', 'paused'])
      .maybeSingle()
    if (!error && data?.id) {
      setSessionId(data.id)
    } else {
      setSessionId(null)
    }
  }, [userId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`active_session_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${userId}`,
        },
        fetchSession
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchSession])

  return sessionId
}
