'use client'

import { useEffect, useState } from 'react'
import { Activity, Database, Server, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { SystemHealthData, HealthStatusLevel } from './types'

interface SystemHealthClientProps {
  initialHealth: SystemHealthData
  refreshIntervalMs?: number
}

export default function SystemHealthClient({
  initialHealth,
  refreshIntervalMs = 30000,
}: SystemHealthClientProps) {
  const [health, setHealth] = useState<SystemHealthData>(initialHealth)
  const [loading, setLoading] = useState(!initialHealth)

  useEffect(() => {
    let isMounted = true
    let intervalId: number | undefined

    async function fetchHealth() {
      try {
        const response = await fetch('/api/admin/health', {
          cache: 'no-store',
        })

        if (!response.ok) {
          return
        }

        const data: SystemHealthData = await response.json()
        if (isMounted) {
          setHealth(data)
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to refresh system health', error)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    if (!initialHealth) {
      fetchHealth()
    } else {
      setLoading(false)
    }

    if (refreshIntervalMs) {
      intervalId = window.setInterval(fetchHealth, refreshIntervalMs)
    }

    return () => {
      isMounted = false
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [initialHealth, refreshIntervalMs])

  const getStatusIcon = (status: HealthStatusLevel) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-green-500" />
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />
      case 'error':
        return <XCircle size={16} className="text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: HealthStatusLevel) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const services = [
    { name: 'Database', status: health.database, icon: Database, metric: `${health.metrics.dbLatency}ms` },
    { name: 'API', status: health.api, icon: Server, metric: `${health.metrics.apiLatency}ms` },
    { name: 'Storage', status: health.storage, icon: Activity, metric: `${health.metrics.storageUsage}% used` },
    { name: 'Security', status: health.security, icon: Shield, metric: `${health.metrics.errorRate}% errors` },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Uptime:</span>
            <span className="text-sm font-medium text-green-600">{health.metrics.uptime}%</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.name}
                className={`p-4 rounded-lg border ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} className="text-gray-600" />
                  {getStatusIcon(service.status)}
                </div>
                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                <p className="text-xs text-gray-500 mt-1">{service.metric}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">DB Latency</p>
              <p className="text-lg font-semibold text-gray-900">{health.metrics.dbLatency}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">API Latency</p>
              <p className="text-lg font-semibold text-gray-900">{health.metrics.apiLatency}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Storage Usage</p>
              <p className="text-lg font-semibold text-gray-900">{health.metrics.storageUsage}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Error Rate</p>
              <p className="text-lg font-semibold text-gray-900">{health.metrics.errorRate}%</p>
            </div>
          </div>
        </div>

        {health.issues && health.issues.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-red-600 mb-2">Detected Issues</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {health.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {health.recommendations && health.recommendations.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Recommendations</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {health.recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
