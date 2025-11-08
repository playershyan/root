'use client'

import { useEffect, useState } from 'react'
import { Mail, MessageSquare, TrendingUp, Bell, AlertTriangle, ChevronDown } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)
  
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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setCollapsed(true)
    }
  }, [])
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${getNotificationTypeColor(group.preferences[0]?.type || 'email')}`}>
            <GroupIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{group.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{group.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(prev => !prev)}
          className="flex h-9 items-center gap-2 rounded-full border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:hidden"
          aria-expanded={!collapsed}
          aria-controls={`${group.id}-notification-body`}
        >
          Details
          <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : 'rotate-0'}`} />
        </button>
      </div>
      
      {/* Loading overlay */}
      {updating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
      
      {/* Notification preferences */}
      <div
        id={`${group.id}-notification-body`}
        className={`mt-4 space-y-3 sm:space-y-4 ${collapsed ? 'hidden sm:block' : ''}`}
      >
        {group.preferences.map(preference => {
          const isEnabled = preferences[preference.key]
          
          return (
            <div
              key={preference.key}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:flex sm:items-start sm:justify-between sm:gap-4 sm:bg-white sm:p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 sm:text-base">{preference.label}</h4>
                  {preference.important && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <AlertTriangle className="h-3 w-3" />
                      Important
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-600 sm:text-sm">{preference.description}</p>
                
                {/* Status indicator */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      isEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex shrink-0 items-center justify-end sm:mt-0">
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggle(preference.key, e.target.checked)}
                    disabled={disabled || updating}
                    className="peer sr-only"
                  />
                  <div className="relative h-7 w-12 rounded-full bg-gray-200 transition peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 peer-checked:after:border-white after:absolute after:left-[2px] after:top-[2px] after:h-6 after:w-6 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all disabled:cursor-not-allowed disabled:opacity-40" />
                </label>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Warning for disabled important notifications */}
      {group.preferences.some(p => p.important && !preferences[p.key]) && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-start gap-2 text-xs text-amber-700 sm:text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            Some important notifications are turned off. You may miss critical updates.
          </p>
        </div>
      )}
      
      {/* All disabled warning */}
      {enabledCount === 0 && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm">
            <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
            You won't receive any {group.title.toLowerCase()} for this category.
          </p>
        </div>
      )}
    </div>
  )
}