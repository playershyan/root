'use client'

import { useState, useEffect } from 'react'
import { Users, Car, Flag, Clock, TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react'

interface Stats {
  totalUsers: number
  activeListings: number
  pendingListings: number
  pendingReports: number
  todayListings: number
  todayUsers: number
  pendingBusinessProfiles: number
  verifiedBusinessProfiles: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeListings: 0,
    pendingListings: 0,
    pendingReports: 0,
    todayListings: 0,
    todayUsers: 0,
    pendingBusinessProfiles: 0,
    verifiedBusinessProfiles: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: stats.todayUsers,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      change: stats.todayListings,
      icon: Car,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Pending Listings',
      value: stats.pendingListings,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      urgent: stats.pendingListings > 10,
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: Flag,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      urgent: stats.pendingReports > 5,
    },
    {
      title: 'Business Profiles',
      value: stats.verifiedBusinessProfiles,
      subtitle: `${stats.pendingBusinessProfiles} pending`,
      icon: Package,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
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
              {stat.urgent && (
                <AlertTriangle size={16} className="text-orange-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              {stat.change !== undefined && stat.change > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  +{stat.change} today
                </p>
              )}
              {stat.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}