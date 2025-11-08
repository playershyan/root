import { ensureAdmin } from '@/lib/server/admin-auth'
import {
  getDashboardStats,
  getRecentActivity,
  getRecentAlerts,
  getSystemHealthStatus,
} from '@/lib/server/admin-dashboard'
import DashboardStats from './components/DashboardStats'
import RecentActivity from './components/RecentActivity'
import SystemHealth from './components/SystemHealth'
import AlertsOverview from './components/AlertsOverview'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { supabase, user } = await ensureAdmin('view_dashboard')

  const [stats, activities, health, alerts] = await Promise.all([
    getDashboardStats(supabase, user.id),
    getRecentActivity(supabase, user.id),
    getSystemHealthStatus(supabase, user.id),
    getRecentAlerts(supabase, user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user.email ?? 'Admin'}</p>
      </div>

      <DashboardStats data={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity initialActivities={activities} />
        <AlertsOverview initialAlerts={alerts} />
      </div>

      <SystemHealth initialHealth={health} />
    </div>
  )
}