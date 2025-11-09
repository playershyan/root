'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, XCircle, Clock,
  Bell, BellOff, RefreshCw, Settings
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface Alert {
  alert_type: string
  triggered_at: string
  message: string
  data: any
  sent_successfully: boolean
}

interface AlertConfig {
  id: string
  alert_type: string
  is_enabled: boolean
  email_recipients: string[]
  threshold_value: number | null
}

interface AlertsWidgetProps {
  className?: string
}

export default function AlertsWidget({ className = "" }: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkingAlerts, setCheckingAlerts] = useState(false)

  useEffect(() => {
    fetchRecentAlerts()
    // Refresh alerts every 10 minutes
    const interval = setInterval(fetchRecentAlerts, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchRecentAlerts = async () => {
    try {
      setError('')
      const response = await fetch('/api/admin/alerts?action=recent&days=7')
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }
      
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (err) {
      logger.error('Failed to fetch alerts', err as Error, {
        component: 'AlertsWidget',
        action: 'fetchRecentAlerts'
      })
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  const triggerAlertCheck = async () => {
    setCheckingAlerts(true)
    try {
      const response = await fetch('/api/admin/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'check' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to trigger alert check')
      }
      
      const result = await response.json()
      
      // Refresh alerts after check
      await fetchRecentAlerts()
      
      // Show success message (you might want to use a proper notification system)
      logger.info('Alert check completed', { message: result.message })
    } catch (err) {
      console.error('Error triggering alert check:', err)
      alert('Failed to trigger alert check: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setCheckingAlerts(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'cleanup_failure':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'high_error_rate':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'storage_threshold':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case 'recovery_expiring':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'bin_overflow':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'bin_low_cleanup':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default:
        return <Bell className="w-4 h-4 text-blue-600" />
    }
  }

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'cleanup_failure':
      case 'high_error_rate':
      case 'bin_overflow':
        return 'bg-red-50 border-red-200'
      case 'storage_threshold':
      case 'bin_low_cleanup':
        return 'bg-orange-50 border-orange-200'
      case 'recovery_expiring':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getAlertTypeLabel = (alertType: string) => {
    const labels: { [key: string]: string } = {
      cleanup_failure: 'Cleanup Failure',
      high_error_rate: 'High Error Rate',
      storage_threshold: 'Low Storage Cleanup',
      recovery_expiring: 'Recovery Expiring',
      bin_overflow: 'Bin Overflow',
      bin_low_cleanup: 'Low Bin Cleanup'
    }
    return labels[alertType] || alertType
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">System Alerts</h3>
            <p className="text-sm text-gray-500">Loading alerts...</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
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
            <h3 className="font-semibold text-gray-900">System Alerts</h3>
            <p className="text-sm text-red-600">Error loading alerts</p>
          </div>
        </div>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={fetchRecentAlerts}
          className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors min-h-touch active:scale-95"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">System Alerts</h3>
              <p className="text-sm text-gray-500">
                Recent alerts (Last 7 days) • {alerts.length} total
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchRecentAlerts}
              disabled={loading}
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-touch min-w-touch flex items-center justify-center active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={triggerAlertCheck}
              disabled={checkingAlerts}
              className="flex items-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 min-h-touch active:scale-95"
            >
              {checkingAlerts ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Check Alerts
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recent alerts</p>
            <p className="text-sm text-gray-400">System is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? alerts.slice(0, 10).map((alert, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getAlertColor(alert.alert_type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(alert.triggered_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.message}</p>
                    {alert.data && Object.keys(alert.data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        {alert.alert_type === 'high_error_rate' && alert.data.error_rate && (
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                            Error Rate: {parseFloat(alert.data.error_rate).toFixed(1)}%
                          </span>
                        )}
                        {alert.alert_type === 'storage_threshold' && alert.data.storage_freed_mb && (
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                            Storage Freed: {alert.data.storage_freed_mb} MB
                          </span>
                        )}
                        {alert.alert_type === 'recovery_expiring' && alert.data.expiring_count && (
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                            {alert.data.expiring_count} profile(s) expiring
                          </span>
                        )}
                        {alert.alert_type === 'bin_overflow' && alert.data.total_bin_items && (
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                            {alert.data.total_bin_items} items in bin
                          </span>
                        )}
                        {alert.alert_type === 'bin_low_cleanup' && alert.data.bin_items_cleaned !== undefined && (
                          <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
                            {alert.data.bin_items_cleaned} items cleaned
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {alert.sent_successfully ? (
                      <CheckCircle className="w-4 h-4 text-green-600" aria-label="Alert sent successfully" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" aria-label="Alert not sent" />
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No alerts available</p>
                <p className="text-sm text-gray-400">Alert system may not be initialized yet</p>
              </div>
            )}
            {alerts && alerts.length > 10 && (
              <p className="text-sm text-gray-500 text-center">
                +{alerts.length - 10} more alerts (showing most recent 10)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}