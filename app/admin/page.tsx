'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from './components/AdminProvider'
import DashboardStats from './components/DashboardStats'
import RecentActivity from './components/RecentActivity'
import SystemHealth from './components/SystemHealth'
import AlertsOverview from './components/AlertsOverview'

export default function AdminDashboard() {
  const { user, isLoading, isAdmin } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/')
    }
  }, [isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <AlertsOverview />
      </div>

      <SystemHealth />
    </div>
  )
}