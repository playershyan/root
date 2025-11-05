'use client'

import { useState, useEffect } from 'react'
import { 
  Heart, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Database, Settings
} from 'lucide-react'

interface HealthCheck {
  healthy: boolean
  checks: {
    admin_users: boolean
    admin_cleanup_stats: boolean
    admin_alert_log: boolean
    admin_alert_config: boolean
    deleted_listings: boolean
    deleted_wanted_requests: boolean
    deleted_business_profiles: boolean
    functions: {
      [key: string]: boolean
    }
  }
  issues: string[]
  recommendations: string[]
  timestamp: string
}

interface SystemHealthWidgetProps {
  className?: string
}

export default function SystemHealthWidget({ className = "" }: SystemHealthWidgetProps) {
  const [health, setHealth] = useState<HealthCheck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkSystemHealth()
  }, [])

  const checkSystemHealth = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/admin/health')
      
      if (!response.ok) {
        throw new Error('Failed to check system health')
      }
      
      const data = await response.json()
      setHealth(data)
    } catch (err) {
      console.error('Error checking system health:', err)
      setError(err instanceof Error ? err.message : 'Failed to check system health')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">System Health</h3>
            <p className="text-xs text-gray-500">Checking status...</p>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">System Health</h3>
            <p className="text-xs text-red-600">Check failed</p>
          </div>
        </div>
        <p className="text-red-700 text-xs mb-2">{error}</p>
        <button
          onClick={checkSystemHealth}
          className="text-xs px-4 py-3 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors min-h-touch active:scale-95"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!health) return null

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="w-3 h-3 text-green-600" />
    ) : (
      <XCircle className="w-3 h-3 text-red-600" />
    )
  }

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className={`bg-white rounded-lg border ${health.healthy ? 'border-green-200' : 'border-red-200'} p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${health.healthy ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
            {health.healthy ? (
              <Heart className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">System Health</h3>
            <p className={`text-xs ${getStatusColor(health.healthy)}`}>
              {health.healthy ? 'All systems operational' : `${health.issues.length} issue(s) detected`}
            </p>
          </div>
        </div>
        <button
          onClick={checkSystemHealth}
          className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors min-h-touch min-w-touch flex items-center justify-center active:scale-95"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Status Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600">Database Tables</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(Object.entries(health.checks).filter(([key, _]) => key !== 'functions').every(([_, value]) => value))}
            <span className={getStatusColor(Object.entries(health.checks).filter(([key, _]) => key !== 'functions').every(([_, value]) => value))}>
              {Object.entries(health.checks).filter(([key, _]) => key !== 'functions').filter(([_, value]) => value).length}/
              {Object.entries(health.checks).filter(([key, _]) => key !== 'functions').length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3 text-gray-600" />
            <span className="text-gray-600">Functions</span>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(Object.values(health.checks.functions).every(value => value))}
            <span className={getStatusColor(Object.values(health.checks.functions).every(value => value))}>
              {Object.values(health.checks.functions).filter(value => value).length}/
              {Object.values(health.checks.functions).length}
            </span>
          </div>
        </div>
      </div>

      {/* Issues */}
      {health.issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-red-600 mb-2">Issues Detected:</p>
          <div className="space-y-1">
            {health.issues.slice(0, 3).map((issue, index) => (
              <p key={index} className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                {issue}
              </p>
            ))}
            {health.issues.length > 3 && (
              <p className="text-xs text-red-600">
                +{health.issues.length - 3} more issues
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-orange-600">
            💡 Run database migrations to initialize all components
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Last checked: {new Date(health.timestamp).toLocaleTimeString()}
      </p>
    </div>
  )
}