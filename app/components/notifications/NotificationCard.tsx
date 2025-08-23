'use client'

import { useState } from 'react'
import { Mail, MessageSquare, TrendingUp, Bell, AlertTriangle } from 'lucide-react'
import { 
  NotificationGroup,
  NotificationPreferences,
  getNotificationIcon,
  getNotificationTypeColor
} from '@/lib/utils/notificationsUtils'

interface NotificationCardProps {
  group: NotificationGroup
  preferences: NotificationPreferences
  onToggle: (key: keyof NotificationPreferences, value: boolean) => void
  onUpdate?: () => Promise<void>
  disabled?: boolean
}

const iconMap = {
  Mail,
  MessageSquare,
  TrendingUp,
  Bell,
  AlertTriangle
}

export default function NotificationCard({
  group,
  preferences,
  onToggle,
  onUpdate,
  disabled = false
}: NotificationCardProps) {
  const [updating, setUpdating] = useState(false)
  
  const GroupIcon = iconMap[group.icon as keyof typeof iconMap] || Bell
  
  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (disabled) return
    
    onToggle(key, value)
    
    // Auto-save if onUpdate is provided
    if (onUpdate) {
      setUpdating(true)
      try {
        await onUpdate()
      } catch (error) {
        // Revert the toggle on error
        onToggle(key, !value)
      } finally {
        setUpdating(false)
      }
    }
  }
  
  const enabledCount = group.preferences.filter(pref => preferences[pref.key]).length
  const totalCount = group.preferences.length
  
  return (
    <div className="bg-white border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationTypeColor(group.preferences[0]?.type || 'email')}`}>
          <GroupIcon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{group.title}</h3>
            <span className="text-sm text-gray-500">
              {enabledCount}/{totalCount} enabled
            </span>
          </div>
          <p className="text-sm text-gray-600">{group.description}</p>
        </div>
      </div>
      
      {/* Loading overlay */}
      {updating && (
        <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Notification preferences */}
      <div className="space-y-4 relative">
        {group.preferences.map(preference => {
          const isEnabled = preferences[preference.key]
          
          return (
            <div key={preference.key} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggle(preference.key, e.target.checked)}
                    disabled={disabled || updating}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{preference.label}</h4>
                  {preference.important && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      Important
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{preference.description}</p>
                
                {/* Status indicator */}
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isEnabled 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Warning for disabled important notifications */}
      {group.preferences.some(p => p.important && !preferences[p.key]) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Important notifications disabled</p>
              <p className="text-sm text-amber-700 mt-1">
                Some important notifications are turned off. You may miss critical updates.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* All disabled warning */}
      {enabledCount === 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Bell className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">All notifications disabled</p>
              <p className="text-sm text-gray-600 mt-1">
                You won't receive any {group.title.toLowerCase()} for this category.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}