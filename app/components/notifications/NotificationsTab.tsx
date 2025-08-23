'use client'

import { useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, Save } from 'lucide-react'
import { 
  NotificationPreferences,
  notificationGroups,
  validateNotificationPreferences,
  getEnabledNotificationsCount
} from '@/lib/utils/notificationsUtils'
import NotificationCard from './NotificationCard'

interface NotificationsTabProps {
  preferences: NotificationPreferences
  onUpdate: (preferences: NotificationPreferences) => Promise<void>
  loading?: boolean
}

export default function NotificationsTab({
  preferences,
  onUpdate,
  loading = false
}: NotificationsTabProps) {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences)
  const [updating, setUpdating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...localPreferences, [key]: value }
    setLocalPreferences(newPreferences)
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(preferences))
  }

  const handleSave = async () => {
    setUpdating(true)
    setUpdateSuccess(null)
    setUpdateError(null)

    try {
      await onUpdate(localPreferences)
      setHasChanges(false)
      setUpdateSuccess('Notification preferences updated successfully!')
      
      // Clear success message after 5 seconds
      setTimeout(() => setUpdateSuccess(null), 5000)
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update notification preferences')
      
      // Clear error message after 10 seconds
      setTimeout(() => setUpdateError(null), 10000)
    } finally {
      setUpdating(false)
    }
  }

  const handleReset = () => {
    setLocalPreferences(preferences)
    setHasChanges(false)
  }

  const validation = validateNotificationPreferences(localPreferences)
  const enabledCounts = getEnabledNotificationsCount(localPreferences)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notification Preferences
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {enabledCounts.total} notifications enabled
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{enabledCounts.byType.email}</div>
              <div className="text-sm text-gray-600">Email Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{enabledCounts.byType.sms}</div>
              <div className="text-sm text-gray-600">SMS Notifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{enabledCounts.byType.marketing}</div>
              <div className="text-sm text-gray-600">Marketing Communications</div>
            </div>
          </div>
        </div>

        {/* Changes indicator */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">You have unsaved changes</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={updating}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Success/Error Messages */}
          {updateSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700">{updateSuccess}</p>
            </div>
          )}
          
          {updateError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{updateError}</p>
            </div>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 mb-2">Notification Warnings</p>
                  <ul className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-amber-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Notification Groups */}
          <div className="space-y-6">
            {notificationGroups.map(group => (
              <NotificationCard
                key={group.id}
                group={group}
                preferences={localPreferences}
                onToggle={handleToggle}
                disabled={updating || loading}
              />
            ))}
          </div>

          {/* Save Button (Footer) */}
          {hasChanges && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Changes pending</p>
                  <p className="text-sm text-gray-600">Don't forget to save your notification preferences</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    disabled={updating}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Reset Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updating}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Information Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">About Notifications</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Email notifications are sent to your verified email address</li>
                  <li>• SMS notifications require phone verification and may incur charges</li>
                  <li>• You can unsubscribe from marketing communications at any time</li>
                  <li>• Important security notifications cannot be disabled</li>
                  <li>• Changes take effect immediately after saving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}