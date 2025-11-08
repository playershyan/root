'use client'

import { useEffect, useRef, useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, LogOut } from 'lucide-react'
import {
  SecuritySession,
  EmailUpdateData,
  TwoFactorAuthData
} from '@/lib/utils/securityUtils'
import EmailSecurityCard from './EmailSecurityCard'
import PasswordSecurityCard from './PasswordSecurityCard'
import TwoFactorCard from './TwoFactorCard'
import SessionsCard from './SessionsCard'
import DeleteAccountCard from './DeleteAccountCard'
import { Button } from '@/components/ui/button'

interface SecurityTabProps {
  emailData?: EmailUpdateData
  twoFactorData?: TwoFactorAuthData
  sessions?: SecuritySession[]
  userEmail?: string
  hasExistingPassword?: boolean
  authProvider?: 'email' | 'google' | 'phone'
  onEmailUpdate?: (data: any) => Promise<void>
  onPasswordUpdate?: (data: any) => Promise<void>
  onTwoFactorUpdate?: (data: any) => Promise<void>
  onSessionUpdate?: (data: any) => Promise<void>
  onAccountDelete?: () => Promise<void>
  onLogout?: () => Promise<void>
  loading?: boolean
}

export default function SecurityTab({
  emailData,
  twoFactorData,
  sessions,
  userEmail,
  hasExistingPassword = false,
  authProvider = 'email',
  onEmailUpdate,
  onPasswordUpdate,
  onTwoFactorUpdate,
  onSessionUpdate,
  onAccountDelete,
  onLogout,
  loading = false
}: SecurityTabProps) {
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleUpdate = async (type: string, updateFn: ((data: any) => Promise<void>) | undefined, data: any) => {
    if (!updateFn) return
    
    setUpdateSuccess(null)
    setUpdateError(null)
    
    try {
      await updateFn(data)
      setUpdateSuccess(`${type} updated successfully!`)
      
      // Clear success message after 5 seconds
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      successTimeoutRef.current = setTimeout(() => setUpdateSuccess(null), 5000)
    } catch (error: any) {
      setUpdateError(error.message || `Failed to update ${type.toLowerCase()}`)
      
      // Clear error message after 10 seconds
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = setTimeout(() => setUpdateError(null), 10000)
    }
  }

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white px-4 py-3 sm:rounded-t-2xl sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
              Account Security
            </h1>
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              Stay protected with a quick overview of your security posture.
            </p>
          </div>
          {onLogout && (
            <div className="flex gap-2">
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-full border-red-200 text-sm font-medium text-red-600 hover:border-red-300 hover:bg-red-50 sm:h-10"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 px-4 pb-10 pt-5 sm:space-y-8 sm:px-6 sm:pb-8 sm:pt-6">
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

          {/* Security Settings Cards */}
          <div className="space-y-4 sm:space-y-6">
            {/* Email Settings */}
            {emailData && (
              <EmailSecurityCard
                emailData={emailData}
                onUpdate={(data) => handleUpdate('Email address', onEmailUpdate, data)}
                loading={loading}
              />
            )}

            {/* Password Settings */}
            <PasswordSecurityCard
              hasExistingPassword={hasExistingPassword}
              authProvider={authProvider}
              onUpdate={(data) => handleUpdate('Password', onPasswordUpdate, data)}
              loading={loading}
            />

            {/* Two-Factor Authentication */}
            {twoFactorData && (
              <TwoFactorCard
                twoFactorData={twoFactorData}
                onUpdate={(data) => handleUpdate('Two-factor authentication', onTwoFactorUpdate, data)}
                loading={loading}
              />
            )}

            {/* Active Sessions */}
            {sessions && sessions.length > 0 && (
              <SessionsCard
                sessions={sessions}
                onUpdate={(data) => handleUpdate('Sessions', onSessionUpdate, data)}
                loading={loading}
              />
            )}

            {/* Delete Account - Danger Zone */}
            <details className="rounded-2xl border border-red-200 bg-red-50/40 p-4 sm:p-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <span className="text-base font-semibold text-red-600 sm:text-lg">Danger Zone</span>
                <span className="text-xs text-red-500 sm:text-sm">Tap to toggle</span>
              </summary>
              <div className="mt-4">
                <DeleteAccountCard
                  userEmail={userEmail}
                  onDelete={onAccountDelete}
                  loading={loading}
                />
              </div>
            </details>
          </div>

          {/* Security Tips */}
          <details className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center gap-3 text-base font-semibold text-blue-900 sm:text-lg">
              <Shield className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
              Security Tips
            </summary>
            <ul className="mt-3 space-y-1 text-sm text-blue-800 sm:mt-4">
              <li>• Use a strong, unique password for your account</li>
              <li>• Enable two-factor authentication for extra security</li>
              <li>• Regularly review and revoke unused sessions</li>
              <li>• Keep your email address verified and up to date</li>
              <li>• Never share your login credentials with others</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  )
}