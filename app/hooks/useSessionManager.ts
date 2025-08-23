'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SessionInfo {
  id: string
  device_name: string
  device_type: string
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  ip_address: string
  location_city: string
  location_country: string
  is_current_session: boolean
  last_activity: string
  created_at: string
  expires_at: string
}

interface UseSessionManagerReturn {
  sessions: SessionInfo[]
  loading: boolean
  error: string | null
  refreshSessions: () => Promise<void>
  revokeSession: (sessionId: string) => Promise<boolean>
  revokeAllOtherSessions: () => Promise<boolean>
  createSession: () => Promise<boolean>
  updateSessionActivity: () => Promise<boolean>
}

export function useSessionManager(): UseSessionManagerReturn {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get auth token for API calls
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  // Refresh sessions list
  const refreshSessions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        setSessions([])
        return
      }

      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSessions(data.sessions || [])
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Session refresh error:', err)
    } finally {
      setLoading(false)
    }
  }, [getAuthToken])

  // Create a new session record
  const createSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        return false
      }

      const response = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'create' })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh sessions list
        await refreshSessions()
        return true
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      console.error('Session creation error:', err)
      return false
    }
  }, [getAuthToken, refreshSessions])

  // Update session activity
  const updateSessionActivity = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAuthToken()
      if (!token) return false

      const response = await fetch('/api/auth/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'update' })
      })

      if (!response.ok) {
        console.warn('Failed to update session activity')
        return false
      }

      const data = await response.json()
      return data.success || false

    } catch (err) {
      console.warn('Session activity update error:', err)
      return false
    }
  }, [getAuthToken])

  // Revoke a specific session
  const revokeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setError(null)
      
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        return false
      }

      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'revoke_one',
          session_id: sessionId 
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to revoke session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh sessions list
        await refreshSessions()
        return true
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke session'
      setError(errorMessage)
      console.error('Session revoke error:', err)
      return false
    }
  }, [getAuthToken, refreshSessions])

  // Revoke all other sessions except current
  const revokeAllOtherSessions = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        return false
      }

      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'revoke_others' })
      })

      if (!response.ok) {
        throw new Error(`Failed to revoke other sessions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh sessions list
        await refreshSessions()
        return true
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke other sessions'
      setError(errorMessage)
      console.error('Other sessions revoke error:', err)
      return false
    }
  }, [getAuthToken, refreshSessions])

  // Load sessions on mount and set up periodic refresh
  useEffect(() => {
    refreshSessions()

    // Set up periodic session activity updates (every 5 minutes)
    const activityInterval = setInterval(() => {
      updateSessionActivity()
    }, 5 * 60 * 1000) // 5 minutes

    // Set up periodic session list refresh (every 30 seconds)
    const refreshInterval = setInterval(() => {
      refreshSessions()
    }, 30 * 1000) // 30 seconds

    return () => {
      clearInterval(activityInterval)
      clearInterval(refreshInterval)
    }
  }, [refreshSessions, updateSessionActivity])

  return {
    sessions,
    loading,
    error,
    refreshSessions,
    revokeSession,
    revokeAllOtherSessions,
    createSession,
    updateSessionActivity
  }
}