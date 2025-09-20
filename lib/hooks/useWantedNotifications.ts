'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface MatchNotification {
  id: string
  listing_id: string
  wanted_request_ids: string[]
  match_count: number
  listing_make: string
  listing_model: string
  listing_year: number
  listing_price: number
  created_at: string
  dismissed_at?: string
}

export interface UseWantedNotificationsReturn {
  notifications: MatchNotification[]
  notificationCount: number
  isLoading: boolean
  error: string | null
  dismissNotification: (notificationId: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useWantedNotifications(): UseWantedNotificationsReturn {
  const [notifications, setNotifications] = useState<MatchNotification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/wanted-requests/match-notifications')

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setNotificationCount(data.notifications?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch notification count only (for header badge)
  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch('/api/wanted-requests/match-notifications?countOnly=true')

      if (!response.ok) {
        throw new Error('Failed to fetch notification count')
      }

      const data = await response.json()
      setNotificationCount(data.count || 0)
    } catch (err) {
      console.error('Error fetching notification count:', err)
    }
  }, [])

  // Dismiss a notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/wanted-requests/match-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss notification')
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setNotificationCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss notification')
      console.error('Error dismissing notification:', err)
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel('wanted-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_wanted_notifications',
        },
        (payload) => {
          console.log('New notification received:', payload)
          // Add new notification to state
          const newNotification = payload.new as MatchNotification
          setNotifications(prev => [newNotification, ...prev])
          setNotificationCount(prev => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listing_wanted_notifications',
        },
        (payload) => {
          console.log('Notification updated:', payload)
          const updatedNotification = payload.new as MatchNotification

          // If notification was dismissed, remove it from state
          if (updatedNotification.dismissed_at) {
            setNotifications(prev => prev.filter(n => n.id !== updatedNotification.id))
            setNotificationCount(prev => Math.max(0, prev - 1))
          } else {
            // Update existing notification
            setNotifications(prev =>
              prev.map(n => (n.id === updatedNotification.id ? updatedNotification : n))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Periodic refresh for notification count (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchNotificationCount])

  return {
    notifications,
    notificationCount,
    isLoading,
    error,
    dismissNotification,
    refreshNotifications,
  }
}

// Hook specifically for notification count (lighter weight for header)
export function useNotificationCount(): {
  count: number
  isLoading: boolean
  refreshCount: () => Promise<void>
} {
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchCount = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/wanted-requests/match-notifications?countOnly=true')

      if (!response.ok) {
        throw new Error('Failed to fetch count')
      }

      const data = await response.json()
      setCount(data.count || 0)
    } catch (err) {
      console.error('Error fetching notification count:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCount = useCallback(async () => {
    await fetchCount()
  }, [fetchCount])

  // Initial load
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  // Set up real-time subscription for count updates
  useEffect(() => {
    const channel = supabase
      .channel('wanted-notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_wanted_notifications',
        },
        () => {
          // Refresh count whenever notifications table changes
          fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchCount])

  return {
    count,
    isLoading,
    refreshCount,
  }
}