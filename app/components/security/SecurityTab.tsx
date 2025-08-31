'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
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

interface SecurityTabProps {
  emailData?: EmailUpdateData
  twoFactorData?: TwoFactorAuthData
  sessions?: SecuritySession[]
  userEmail?: string
  onEmailUpdate?: (data: any) => Promise<void>
  onPasswordUpdate?: (data: any) => Promise<void>
  onTwoFactorUpdate?: (data: any) => Promise<void>
  onSessionUpdate?: (data: any) => Promise<void>
  onAccountDelete?: () => Promise<void>
  loading?: boolean
}

export default function SecurityTab({
  emailData,
  twoFactorData,
  sessions,
  userEmail,
  onEmailUpdate,
  onPasswordUpdate,
  onTwoFactorUpdate,
  onSessionUpdate,
  onAccountDelete,
  loading = false
}: SecurityTabProps) {
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleUpdate = async (type: string, updateFn: ((data: any) => Promise<void>) | undefined, data: any) => {
    if (!updateFn) return
    
    setUpdateSuccess(null)
    setUpdateError(null)
    
    try {
      await updateFn(data)
      setUpdateSuccess(`${type} updated successfully!`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setUpdateSuccess(null), 5000)
    } catch (error: any) {
      setUpdateError(error.message || `Failed to update ${type.toLowerCase()}`)
      
      // Clear error message after 10 seconds
      setTimeout(() => setUpdateError(null), 10000)
    }
  }

  // Calculate security score
  const getSecurityScore = () => {
    let score = 0
    let total = 0
    
    // Email verification
    total += 25
    if (emailData?.isVerified) score += 25
    
    // Two-factor authentication
    total += 50
    if (twoFactorData?.isEnabled) score += 50
    
    // Session management (bonus for having few active sessions)
    total += 25
    if (sessions && sessions.length <= 2) score += 25
    else if (sessions && sessions.length <= 4) score += 15
    else if (sessions && sessions.length <= 6) score += 5
    
    return { score, total, percentage: Math.round((score / total) * 100) }
  }

  const securityScore = getSecurityScore()
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Settings
          </h1>
        </div>

        {/* Security Score */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Security Score</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(securityScore.percentage)}`}>
              {securityScore.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                securityScore.percentage >= 80 ? 'bg-green-500' :
                securityScore.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${securityScore.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            {securityScore.percentage >= 80 && 'Excellent security! Your account is well protected.'}
            {securityScore.percentage >= 60 && securityScore.percentage < 80 && 'Good security. Consider enabling additional features.'}
            {securityScore.percentage < 60 && 'Your account could be more secure. Enable additional security features.'}
          </p>
        </div>
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

          {/* Security Settings Cards */}
          <div className="space-y-6">
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
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
              <DeleteAccountCard
                userEmail={userEmail}
                onDelete={onAccountDelete}
                loading={loading}
              />
            </div>
          </div>

          {/* Security Tips */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Security Tips</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Use a strong, unique password for your account</li>
                  <li>• Enable two-factor authentication for extra security</li>
                  <li>• Regularly review and revoke unused sessions</li>
                  <li>• Keep your email address verified and up to date</li>
                  <li>• Never share your login credentials with others</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}