'use client'

import { useState } from 'react'
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Clock,
  Wifi,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SecuritySession,
  formatSessionTime,
  getSessionStatus,
  getDeviceIcon
} from '@/lib/utils/securityUtils'

interface SessionsCardProps {
  sessions: SecuritySession[]
  onUpdate: (data: {
    action: 'refresh' | 'revoke' | 'revokeAll'
    sessionId?: string
  }) => Promise<void>
  loading?: boolean
}

const iconMap = {
  Monitor,
  Smartphone,
  Tablet,
  Laptop
}

export default function SessionsCard({
  sessions,
  onUpdate,
  loading = false
}: SessionsCardProps) {
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const handleRefresh = async () => {
    await onUpdate({ action: 'refresh' })
  }

  const handleRevokeSession = async (sessionId: string, deviceName: string) => {
    if (!confirm(`Are you sure you want to revoke the session from "${deviceName}"? This will sign out that device immediately.`)) {
      return
    }

    setRevoking(sessionId)
    try {
      await onUpdate({ action: 'revoke', sessionId })
    } catch (error) {
      console.error('Failed to revoke session:', error)
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    const otherSessionsCount = sessions.filter(s => !s.is_current_session).length
    
    if (!confirm(`Are you sure you want to revoke all ${otherSessionsCount} other session(s)? This will sign out all your other devices immediately.`)) {
      return
    }

    setRevokingAll(true)
    try {
      await onUpdate({ action: 'revokeAll' })
    } catch (error) {
      console.error('Failed to revoke all sessions:', error)
    } finally {
      setRevokingAll(false)
    }
  }

  const currentSession = sessions.find(s => s.is_current_session)
  const otherSessions = sessions.filter(s => !s.is_current_session)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 sm:h-12 sm:w-12">
            <Monitor className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Active Sessions</h3>
            <p className="text-sm text-gray-600">
              Manage and revoke devices that are signed in to your account.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          {otherSessions.length > 0 && (
            <Button
              onClick={handleRevokeAll}
              disabled={revokingAll || loading}
              variant="destructive"
              size="sm"
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {revokingAll ? 'Revoking All...' : `Revoke ${otherSessions.length} Others`}
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {loading && sessions.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-8 text-center">
            <Monitor className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h4 className="mb-2 text-base font-medium text-gray-900">No Active Sessions</h4>
            <p className="text-sm text-gray-600">We’ll display devices here the next time you sign in elsewhere.</p>
          </div>
        ) : (
          <>
            {/* Current Session */}
            {currentSession && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    {(() => {
                      const DeviceIcon = iconMap[getDeviceIcon(currentSession.device_name, currentSession.os_name) as keyof typeof iconMap] || Monitor
                      return <DeviceIcon className="h-6 w-6 text-blue-600" />
                    })()}
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-base font-semibold text-gray-900">
                        {currentSession.device_name}
                      </h4>
                      <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Current Device
                      </span>
                      <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Active Now
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-1">
                        <Monitor className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {currentSession.browser_name} {currentSession.browser_version}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Wifi className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{currentSession.os_name} {currentSession.os_version}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {currentSession.location_city}, {currentSession.location_country}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Started {formatSessionTime(currentSession.created_at)}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      IP: {currentSession.ip_address}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other Sessions */}
            {otherSessions.map(session => {
              const DeviceIcon = iconMap[getDeviceIcon(session.device_name, session.os_name) as keyof typeof iconMap] || Monitor
              const sessionStatus = getSessionStatus(session.last_activity)
              const isRevoking = revoking === session.id

              return (
                <div key={session.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <DeviceIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="truncate text-base font-medium text-gray-900">{session.device_name}</h4>
                        <span className={`text-sm font-medium ${sessionStatus.color}`}>{sessionStatus.label}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                        <div className="flex items-center gap-1">
                          <Monitor className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {session.browser_name} {session.browser_version}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Wifi className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{session.os_name} {session.os_version}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {session.location_city}, {session.location_country}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span>Last active {formatSessionTime(session.last_activity)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-gray-500">IP: {session.ip_address}</div>
                        <Button
                          onClick={() => handleRevokeSession(session.id, session.device_name)}
                          disabled={isRevoking || revokingAll || loading}
                          variant="destructive"
                          size="sm"
                          className="h-11 w-full sm:h-10 sm:w-32"
                        >
                          {isRevoking ? 'Revoking...' : 'Revoke'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Security Notice */}
      {sessions.length > 1 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-2 text-sm text-amber-700">
            <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <p>
              You have {sessions.length} active sessions. Revoke unfamiliar devices immediately and consider changing your password.
            </p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-4 rounded-xl bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Session Information</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Sessions show devices currently signed in to your account</li>
          <li>• Revoking a session will immediately sign out that device</li>
          <li>• Check for unfamiliar locations or devices regularly</li>
          <li>• Your current device session cannot be revoked from here</li>
        </ul>
      </div>
    </div>
  )
}