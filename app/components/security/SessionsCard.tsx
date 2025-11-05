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
    <div className="bg-white border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Monitor className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <p className="text-sm text-gray-600">
              Manage devices that are currently signed in to your account
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
            className="min-h-[44px]"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          {otherSessions.length > 0 && (
            <Button
              onClick={handleRevokeAll}
              disabled={revokingAll || loading}
              variant="destructive"
              size="sm"
              className="min-h-[44px]"
            >
              {revokingAll ? 'Revoking All...' : `Revoke All Others (${otherSessions.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {loading && sessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">No Active Sessions</h4>
            <p className="text-gray-600">No active sessions found</p>
          </div>
        ) : (
          <>
            {/* Current Session */}
            {currentSession && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {(() => {
                      const DeviceIcon = iconMap[getDeviceIcon(currentSession.device_name, currentSession.os_name) as keyof typeof iconMap] || Monitor
                      return <DeviceIcon className="w-6 h-6 text-blue-600" />
                    })()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {currentSession.device_name}
                      </h4>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                        Current Device
                      </span>
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active Now
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Monitor className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {currentSession.browser_name} {currentSession.browser_version}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Wifi className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{currentSession.os_name} {currentSession.os_version}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {currentSession.location_city}, {currentSession.location_country}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>Started {formatSessionTime(currentSession.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
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
                <div key={session.id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <DeviceIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {session.device_name}
                        </h4>
                        <span className={`text-sm font-medium ${sessionStatus.color}`}>
                          {sessionStatus.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Monitor className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {session.browser_name} {session.browser_version}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Wifi className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{session.os_name} {session.os_version}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {session.location_city}, {session.location_country}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>Last active {formatSessionTime(session.last_activity)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          IP: {session.ip_address}
                        </div>

                        <Button
                          onClick={() => handleRevokeSession(session.id, session.device_name)}
                          disabled={isRevoking || revokingAll || loading}
                          variant="destructive"
                          size="sm"
                          className="min-h-[44px]"
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
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Security Recommendation</p>
              <p className="text-sm text-amber-700 mt-1">
                You have {sessions.length} active sessions. If you don't recognize any of these devices or locations, 
                revoke those sessions immediately and consider changing your password.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Session Information</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Sessions show devices currently signed in to your account</li>
          <li>• Revoking a session will immediately sign out that device</li>
          <li>• Check for unfamiliar locations or devices regularly</li>
          <li>• Your current device session cannot be revoked from here</li>
        </ul>
      </div>
    </div>
  )
}