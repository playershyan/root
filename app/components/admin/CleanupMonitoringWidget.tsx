'use client'

import { useState, useEffect } from 'react'
import { 
  Trash2, Database, Clock, AlertTriangle, CheckCircle, 
  TrendingUp, RefreshCw, Play, HardDrive, Activity, 
  Archive, Users, Recycle
} from 'lucide-react'

interface CleanupStats {
  summary: {
    totalCleanups: number
    totalRecordsDeleted: number
    totalStorageFreedMB: number
    totalErrors: number
    totalBinItemsCleaned: number
    totalBinStorageFreedMB: number
    averageExecutionTimeMs: number
    successRate: number
  }
  cleanupStats: Array<{
    cleanup_date: string
    cleanup_runs: number
    total_records_deleted: number
    total_storage_freed_mb: number
    error_count: number
    success_count: number
  }>
  recoveryStats: Array<{
    request_type: string
    status: string
    request_count: number
    recent_requests: number
    expired_pending: number
  }>
  eligibleRecoveries: Array<{
    user_id: string
    business_name: string
    deleted_at: string
    days_remaining: number
  }>
  binStats: {
    total_bin_items: number
    bin_listings_count: number
    bin_wanted_requests_count: number
    recent_bin_additions: number
    items_expiring_soon: number
    avg_days_in_bin: number
    total_bin_storage_mb: number
    cleanup_stats: {
      total_items_cleaned?: number
      total_storage_cleaned_mb?: number
      avg_daily_cleanup?: number
      cleanup_days_tracked?: number
    }
    user_activity: {
      active_users_this_week?: number
      total_users_with_bin_items?: number
    }
  }
  lastUpdated: string
}

interface CleanupMonitoringWidgetProps {
  className?: string
}

export default function CleanupMonitoringWidget({ className = "" }: CleanupMonitoringWidgetProps) {
  const [stats, setStats] = useState<CleanupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [manualCleanupLoading, setManualCleanupLoading] = useState(false)
  const [binCleanupLoading, setBinCleanupLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setError('')
      const response = await fetch('/api/admin/cleanup-stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch cleanup statistics')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching cleanup stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const triggerManualCleanup = async (type: 'all' | 'bin' = 'all') => {
    const setLoading = type === 'bin' ? setBinCleanupLoading : setManualCleanupLoading
    setLoading(true)
    try {
      const response = await fetch('/api/admin/cleanup-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to trigger ${type} cleanup`)
      }
      
      const result = await response.json()
      
      // Show success message and refresh stats
      const cleanupType = type === 'bin' ? 'Bin' : 'Full'
      const resultData = result.result?.[0] || result.result
      
      if (type === 'bin') {
        alert(`${cleanupType} cleanup completed successfully!\n\nItems cleaned: ${resultData?.items_cleaned || 0}\nStorage freed: ${resultData?.storage_freed_mb || 0} MB`)
      } else {
        alert(`${cleanupType} cleanup completed successfully!\n\nRecords deleted: ${resultData?.total_deleted || 0}\nBin items cleaned: ${resultData?.bin_items_cleaned || 0}\nStorage freed: ${resultData?.storage_freed_mb || 0} MB`)
      }
      
      await fetchStats()
    } catch (err) {
      console.error(`Error triggering ${type} cleanup:`, err)
      alert(`Failed to trigger ${type} cleanup: ` + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    }
    return `${mb.toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Cleanup Monitoring</h3>
            <p className="text-sm text-gray-500">Loading statistics...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Cleanup Monitoring</h3>
            <p className="text-sm text-red-600">Error loading data</p>
          </div>
        </div>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors min-h-touch active:scale-95"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Cleanup Monitoring</h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-touch min-w-touch flex items-center justify-center active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => triggerManualCleanup('bin')}
              disabled={binCleanupLoading}
              className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 min-h-touch active:scale-95"
            >
              {binCleanupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Cleaning Bin...
                </>
              ) : (
                <>
                  <Recycle className="w-4 h-4" />
                  Clean Bin
                </>
              )}
            </button>
            <button
              onClick={() => triggerManualCleanup('all')}
              disabled={manualCleanupLoading}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-touch active:scale-95"
            >
              {manualCleanupLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Full Cleanup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Success Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.summary.successRate}%</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Records Deleted</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{stats.summary.totalRecordsDeleted.toLocaleString()}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Storage Freed</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{formatBytes(stats.summary.totalStorageFreedMB)}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Avg. Time</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">{stats.summary.averageExecutionTimeMs}ms</p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Archive className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-600">Bin Items</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{stats.binStats.total_bin_items.toLocaleString()}</p>
          </div>

          <div className="bg-pink-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-pink-600" />
              <span className="text-sm font-medium text-pink-600">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-pink-700">{stats.binStats.user_activity?.active_users_this_week || 0}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Cleanup Activity (Last 7 days)
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Daily cleanups</span>
              <div className="flex gap-1">
                {stats.cleanupStats.slice(0, 7).map((stat, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 rounded ${
                      stat.error_count > 0 ? 'bg-red-200' : 'bg-green-200'
                    } flex items-center justify-center text-xs font-medium ${
                      stat.error_count > 0 ? 'text-red-700' : 'text-green-700'
                    }`}
                    title={`${formatDate(stat.cleanup_date)}: ${stat.total_records_deleted} records deleted${
                      stat.error_count > 0 ? `, ${stat.error_count} errors` : ''
                    }`}
                  >
                    {stat.cleanup_runs}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Bin Statistics */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Archive className="w-4 h-4" />
            User Bin Statistics
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.binStats.bin_listings_count}</div>
                <div className="text-sm text-gray-600">Listings in Bin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.binStats.bin_wanted_requests_count}</div>
                <div className="text-sm text-gray-600">Wanted Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.binStats.recent_bin_additions}</div>
                <div className="text-sm text-gray-600">Added This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.binStats.items_expiring_soon}</div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average days in bin:</span>
                <span className="font-medium">{Math.round(stats.binStats.avg_days_in_bin)} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total bin storage:</span>
                <span className="font-medium">{formatBytes(stats.binStats.total_bin_storage_mb)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Users with bin items:</span>
                <span className="font-medium">{stats.binStats.user_activity?.total_users_with_bin_items || 0}</span>
              </div>
            </div>

            {stats.binStats.cleanup_stats?.total_items_cleaned && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Cleanup History (Last 30 days):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items cleaned:</span>
                    <span className="font-medium">{stats.binStats.cleanup_stats.total_items_cleaned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage recovered:</span>
                    <span className="font-medium">{formatBytes(stats.binStats.cleanup_stats.total_storage_cleaned_mb || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg daily cleanup:</span>
                    <span className="font-medium">{Math.round(stats.binStats.cleanup_stats.avg_daily_cleanup || 0)} items</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Profile Recovery Queue */}
        {stats.eligibleRecoveries.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Business Profiles Pending Recovery ({stats.eligibleRecoveries.length})
            </h4>
            <div className="space-y-2">
              {stats.eligibleRecoveries.slice(0, 5).map((recovery, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{recovery.business_name}</p>
                      <p className="text-sm text-gray-600">
                        Deleted: {formatDate(recovery.deleted_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        recovery.days_remaining <= 3 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {recovery.days_remaining} days left
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {stats.eligibleRecoveries.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{stats.eligibleRecoveries.length - 5} more profiles eligible for recovery
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}