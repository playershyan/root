'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users, Car, Flag, Clock, Package, AlertTriangle, Search } from 'lucide-react'
import type { DashboardStatsData } from './types'

interface DashboardStatsClientProps {
  initialStats: DashboardStatsData
  refreshIntervalMs?: number
}

export default function DashboardStatsClient({
  initialStats,
  refreshIntervalMs = 60000,
}: DashboardStatsClientProps) {
  const [stats, setStats] = useState<DashboardStatsData>(initialStats)
  const [loading, setLoading] = useState(!initialStats)

  useEffect(() => {
    let isMounted = true
    let intervalId: number | undefined

    async function fetchStats() {
      try {
        const response = await fetch('/api/admin/stats', {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data: DashboardStatsData = await response.json()
        if (isMounted) {
          setStats(data)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to refresh admin stats', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!initialStats) {
      fetchStats()
    } else {
      setLoading(false)
    }

    if (refreshIntervalMs) {
      intervalId = window.setInterval(fetchStats, refreshIntervalMs)
    }

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [initialStats, refreshIntervalMs])

  const statCards = useMemo(
    () => [
      {
        title: 'Total Users',
        value: stats.totalUsers,
        change: stats.todayUsers,
        icon: Users,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
      {
        title: 'Active Listings',
        value: stats.activeListings,
        change: stats.todayListings,
        icon: Car,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
      },
      {
        title: 'Pending Listings',
        value: stats.pendingListings,
        icon: Clock,
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        urgent: stats.pendingListings > 10,
      },
      {
        title: 'Pending Reports',
        value: stats.pendingReports,
        icon: Flag,
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        urgent: stats.pendingReports > 5,
      },
      {
        title: 'Active Wanted Requests',
        value: stats.activeWantedRequests,
        change: stats.todayWantedRequests,
        icon: Search,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
      },
      {
        title: 'Pending Wanted Requests',
        value: stats.pendingWantedRequests,
        icon: Clock,
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        urgent: stats.pendingWantedRequests > 5,
      },
      {
        title: 'Business Profiles',
        value: stats.verifiedBusinessProfiles,
        subtitle: `${stats.pendingBusinessProfiles} pending`,
        icon: Package,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
    ],
    [stats],
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                <Icon size={20} className={stat.iconColor} />
              </div>
              {stat.urgent && <AlertTriangle size={16} className="text-orange-500" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              {stat.change !== undefined && stat.change > 0 && (
                <p className="text-xs text-green-600 mt-1">+{stat.change} today</p>
              )}
              {stat.subtitle && <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
