'use client'

import { useState, useEffect } from 'react'
import { Clock, User, Car, Flag, CheckCircle, XCircle } from 'lucide-react'

interface Activity {
  id: string
  type: 'listing_created' | 'user_registered' | 'report_submitted' | 'listing_approved' | 'listing_rejected'
  title: string
  description: string
  timestamp: string
  user?: string
  icon: any
  color: string
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
    const interval = setInterval(fetchRecentActivity, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity/recent')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
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
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  const formatTime = (timestamp: string) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.description}
                    </p>
                    {activity.user && (
                      <p className="text-xs text-gray-400 mt-1">
                        by {activity.user}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}