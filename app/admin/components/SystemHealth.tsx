'use client'

import { useState, useEffect } from 'react'
import { Activity, Database, Server, Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface HealthStatus {
  database: 'healthy' | 'warning' | 'error'
  api: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  security: 'healthy' | 'warning' | 'error'
  metrics: {
    dbLatency: number
    apiLatency: number
    storageUsage: number
    errorRate: number
    uptime: number
  }
}

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthStatus>({
    database: 'healthy',
    api: 'healthy',
    storage: 'healthy',
    security: 'healthy',
    metrics: {
      dbLatency: 0,
      apiLatency: 0,
      storageUsage: 0,
      errorRate: 0,
      uptime: 99.9
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/admin/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
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

        {/* Performance Metrics */}
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
      </div>
    </div>
  )
}