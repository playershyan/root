'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, User, Car, Flag, CheckCircle, XCircle, Search, Trash2 } from 'lucide-react'
import type { ActivityItem } from './types'
import { logger } from '@/lib/utils/logger'

interface RecentActivityClientProps {
  initialActivities: ActivityItem[]
  refreshIntervalMs?: number
}

export default function RecentActivityClient({
  initialActivities,
  refreshIntervalMs = 30000,
}: RecentActivityClientProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities)
  const [loading, setLoading] = useState(!initialActivities || initialActivities.length === 0)

  useEffect(() => {
    let isMounted = true
    let intervalId: number | undefined

    async function fetchRecentActivity() {
      try {
        const response = await fetch('/api/admin/activity/recent', {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (isMounted && Array.isArray(data.activities)) {
          setActivities(data.activities)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          logger.error('Failed to refresh recent admin activity', error as Error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!initialActivities || initialActivities.length === 0) {
      fetchRecentActivity()
    } else {
      setLoading(false)
    }

    if (refreshIntervalMs) {
      intervalId = window.setInterval(fetchRecentActivity, refreshIntervalMs)
    }

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [initialActivities, refreshIntervalMs])

  const formatTime = useMemo(() => {
    return (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      return `${days}d ago`
    }
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'listing_created':
        return { icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' }
      case 'user_registered':
        return { icon: User, color: 'text-green-600', bg: 'bg-green-100' }
      case 'report_submitted':
        return { icon: Flag, color: 'text-red-600', bg: 'bg-red-100' }
      case 'listing_approved':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
      case 'listing_rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' }
      case 'wanted_request_approved':
        return { icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-100' }
      case 'wanted_request_rejected':
        return { icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-100' }
      case 'wanted_request_deleted':
      case 'wanted_request_permanently_deleted':
        return { icon: Trash2, color: 'text-red-600', bg: 'bg-red-100' }
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const { icon: Icon, color, bg } = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={`p-2 ${bg} rounded-full flex-shrink-0`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-400 mt-1">by {activity.user}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(activity.timestamp)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
