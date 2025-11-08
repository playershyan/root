'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCircle, AlertTriangle, Save } from 'lucide-react'
import {
  NotificationPreferences,
  notificationGroups,
  validateNotificationPreferences,
  getEnabledNotificationsCount
} from '@/lib/utils/notificationsUtils'
import NotificationCard from './NotificationCard'
import { Button } from '@/components/ui/button'

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
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => setUpdateSuccess(null), 5000)
    } catch (error: any) {
      setUpdateError(error.message || 'Failed to update notification preferences')

      // Clear error message after 10 seconds
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = setTimeout(() => setUpdateError(null), 10000)
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

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:rounded-t-2xl sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            Notification Preferences
          </h1>
          <div className="flex items-center justify-between gap-3 text-sm text-gray-600 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-700 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {enabledCounts.total} enabled
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4">
          <div className="min-w-[145px] rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:min-w-0">
            <div className="text-sm font-medium text-blue-900">Email</div>
            <div className="text-lg font-semibold text-blue-700 sm:text-2xl">{enabledCounts.byType.email}</div>
            <div className="text-xs text-blue-700/70 sm:text-sm">Notifications</div>
          </div>
          <div className="min-w-[145px] rounded-xl border border-green-100 bg-green-50 px-4 py-3 sm:min-w-0">
            <div className="text-sm font-medium text-green-900">SMS</div>
            <div className="text-lg font-semibold text-green-700 sm:text-2xl">{enabledCounts.byType.sms}</div>
            <div className="text-xs text-green-700/70 sm:text-sm">Notifications</div>
          </div>
          <div className="min-w-[145px] rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 sm:min-w-0">
            <div className="text-sm font-medium text-purple-900">Marketing</div>
            <div className="text-lg font-semibold text-purple-700 sm:text-2xl">{enabledCounts.byType.marketing}</div>
            <div className="text-xs text-purple-700/70 sm:text-sm">Touchpoints</div>
          </div>
        </div>

        {/* Changes indicator */}
        {hasChanges && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 sm:mt-4 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="font-medium">You have unsaved changes</p>
                  <p className="text-xs text-blue-700/80 sm:text-sm">Review your updates and save when ready.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleReset}
                  disabled={updating}
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 text-sm"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updating}
                  variant="primary"
                  size="sm"
                  className="h-10 px-4 text-sm"
                >
                  {updating ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-4 pb-28 pt-5 sm:space-y-8 sm:px-6 sm:pb-6 sm:pt-6">
          {/* Success/Error Messages */}
          {updateSuccess && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-green-700">{updateSuccess}</p>
            </div>
          )}
          
          {updateError && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-red-700">{updateError}</p>
            </div>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="mb-2 font-medium text-amber-800">Notification Warnings</p>
                  <ul className="space-y-1 text-sm text-amber-700">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Notification Groups */}
          <div className="space-y-4 sm:space-y-6">
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
            <>
              <div className="hidden rounded-xl bg-gray-50 p-4 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">Changes pending</p>
                  <p className="text-sm text-gray-600">Don't forget to save your notification preferences</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleReset}
                    disabled={updating}
                    variant="secondary"
                    className="h-12"
                  >
                    Reset Changes
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updating}
                    variant="primary"
                    className="h-12"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Mobile sticky action bar */}
              <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center px-4 pb-[env(safe-area-inset-bottom,1rem)] pt-3 sm:hidden">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.15)] backdrop-blur">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="font-medium text-gray-900">Changes pending</span>
                      <button
                        onClick={handleReset}
                        disabled={updating}
                        className="font-medium text-blue-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        Reset
                      </button>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={updating}
                      variant="primary"
                      className="h-12 w-full text-base font-semibold"
                    >
                      {updating ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Save All Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Information Section */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 sm:h-12 sm:w-12">
                <Bell className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-blue-900 sm:text-lg">About Notifications</h3>
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