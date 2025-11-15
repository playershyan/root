'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react'
import type { AlertItem } from './types'
import { logger } from '@/lib/utils/logger'

interface AlertsOverviewClientProps {
  initialAlerts: AlertItem[]
  refreshIntervalMs?: number
}

export default function AlertsOverviewClient({
  initialAlerts,
  refreshIntervalMs = 60000,
}: AlertsOverviewClientProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts)
  const [loading, setLoading] = useState(!initialAlerts)

  useEffect(() => {
    let isMounted = true
    let intervalId: number | undefined

    async function fetchAlerts() {
      try {
        const response = await fetch('/api/admin/alerts/recent?limit=10', {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (isMounted && Array.isArray(data.alerts)) {
          setAlerts(data.alerts)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          logger.error('Failed to refresh admin alerts', error as Error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!initialAlerts || initialAlerts.length === 0) {
      fetchAlerts()
    } else {
      setLoading(false)
    }

    if (refreshIntervalMs) {
      intervalId = window.setInterval(fetchAlerts, refreshIntervalMs)
    }

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [initialAlerts, refreshIntervalMs])

  const markAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/admin/alerts/${alertId}/read`, { method: 'POST' })
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert,
        ),
      )
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        logger.error('Failed to mark alert as read', error as Error)
      }
    }
  }

  const unreadCount = useMemo(() => alerts.filter((alert) => !alert.isRead).length, [alerts])

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return <XCircle size={16} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />
      default:
        return <Bell size={16} className="text-blue-500" />
    }
  }

  const getAlertStyle = (type: AlertItem['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">System Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full flex-shrink-0">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-16 sm:h-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <Bell size={40} className="mx-auto mb-3 sm:mb-4 text-gray-300 sm:w-12 sm:h-12" />
            <p className="text-sm sm:text-base">No alerts</p>
            <p className="text-xs sm:text-sm mt-1">System is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 sm:p-4 rounded-lg border ${getAlertStyle(alert.type)} ${
                  !alert.isRead ? 'ring-2 ring-blue-400' : ''
                } cursor-pointer transition-all hover:shadow-sm active:scale-[0.98] touch-manipulation`}
                onClick={() => !alert.isRead && markAsRead(alert.id)}
              >
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">{alert.title}</p>
                        <p className="text-xs text-gray-600 mt-1 break-words">{alert.message}</p>
                      </div>
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2">
                      <Clock size={12} className="text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
