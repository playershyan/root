'use client'

import { useState } from 'react'
import {
  Mail,
  Lock,
  Shield,
  Smartphone,
  Laptop,
  Monitor,
  Tablet,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react'
import {
  SecuritySession,
  EmailUpdateData,
  PasswordChangeData,
  TwoFactorAuthData,
  formatSessionTime,
  getSessionStatus,
  getDeviceIcon,
  validateEmail,
  validatePassword,
  getPasswordStrengthColor
} from '@/lib/utils/securityUtils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface SecuritySettingsCardProps {
  type: 'email' | 'password' | '2fa' | 'sessions'
  data?: any
  onUpdate?: (data: any) => Promise<void>
  loading?: boolean
}

const iconMap = {
  Smartphone,
  Laptop,
  Monitor,
  Tablet
}

export default function SecuritySettingsCard({
  type,
  data,
  onUpdate,
  loading = false
}: SecuritySettingsCardProps) {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [formData, setFormData] = useState<any>({})
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!onUpdate) return
    
    setErrors([])
    setSubmitting(true)
    
    try {
      // Validation based on type
      if (type === 'email') {
        const emailValidation = validateEmail(formData.newEmail)
        if (!emailValidation.isValid) {
          setErrors([emailValidation.error!])
          return
        }
        
        if (formData.newEmail !== formData.confirmEmail) {
          setErrors(['Email addresses do not match'])
          return
        }
      }
      
      if (type === 'password') {
        const passwordValidation = validatePassword(formData.newPassword, formData.confirmPassword)
        if (!passwordValidation.isValid) {
          setErrors(passwordValidation.errors)
          return
        }
      }
      
      await onUpdate(formData)
      setFormData({})
    } catch (error: any) {
      setErrors([error.message || 'An error occurred'])
    } finally {
      setSubmitting(false)
    }
  }

  if (type === 'email') {
    const emailData = data as EmailUpdateData
    
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Email Address</h3>
            <p className="text-sm text-gray-600">Update your account email address</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="current-email">Current Email</Label>
            <div className="relative mt-2">
              <Input
                id="current-email"
                type="email"
                inputMode="email"
                value={emailData?.currentEmail || ''}
                disabled
                className="bg-gray-50 text-gray-600"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailData?.isVerified ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">Unverified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              inputMode="email"
              value={formData.newEmail || ''}
              onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
              placeholder="Enter new email address"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="confirm-email">Confirm New Email</Label>
            <Input
              id="confirm-email"
              type="email"
              inputMode="email"
              value={formData.confirmEmail || ''}
              onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
              placeholder="Confirm new email address"
              className="mt-2"
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            variant="primary"
            className="w-full sm:w-auto"
          >
            {submitting ? 'Updating...' : 'Update Email'}
          </Button>
        </div>
      </div>
    )
  }

  if (type === 'password') {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Password</h3>
            <p className="text-sm text-gray-600">Change your account password</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative mt-2">
              <Input
                id="current-password"
                type={showPassword.current ? 'text' : 'password'}
                value={formData.currentPassword || ''}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
              >
                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative mt-2">
              <Input
                id="new-password"
                type={showPassword.new ? 'text' : 'password'}
                value={formData.newPassword || ''}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Enter new password (min. 6 characters)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
              >
                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.newPassword && (
              <div className="mt-2">
                {(() => {
                  const validation = validatePassword(formData.newPassword)
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPasswordStrengthColor(validation.strength)}`}>
                      {validation.strength === 'strong' && '✓ Strong'}
                      {validation.strength === 'medium' && '○ Medium'}
                      {validation.strength === 'weak' && '⚠ Weak'}
                    </span>
                  )
                })()}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative mt-2">
              <Input
                id="confirm-password"
                type={showPassword.confirm ? 'text' : 'password'}
                value={formData.confirmPassword || ''}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 h-10 w-10 flex items-center justify-center active:scale-95 transition-transform"
              >
                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || loading}
            variant="primary"
            className="w-full sm:w-auto"
          >
            {submitting ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </div>
    )
  }

  if (type === '2fa') {
    const twoFAData = data as TwoFactorAuthData
    
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-medium">SMS Authentication</p>
            <p className="text-sm text-gray-600 mt-1">
              {twoFAData?.isEnabled
                ? `Enabled for ${twoFAData.phoneNumber || 'your phone'}`
                : 'Receive verification codes via SMS'
              }
            </p>
          </div>
          <Button
            onClick={() => onUpdate && onUpdate({ action: twoFAData?.isEnabled ? 'disable' : 'enable' })}
            disabled={loading}
            variant={twoFAData?.isEnabled ? 'danger' : 'success'}
            className="w-full sm:w-auto"
          >
            {twoFAData?.isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    )
  }

  if (type === 'sessions') {
    const sessions = data as SecuritySession[]
    
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Active Sessions</h3>
              <p className="text-sm text-gray-600">Manage your logged-in devices</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onUpdate && onUpdate({ action: 'refresh' })}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="h-11"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            {sessions && sessions.length > 1 && (
              <Button
                onClick={() => onUpdate && onUpdate({ action: 'revokeAll' })}
                variant="ghost"
                size="sm"
                className="h-11 text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                Revoke All Others
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading sessions...</p>
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-gray-600">No active sessions found</p>
            </div>
          ) : (
            sessions.map((session) => {
              const DeviceIcon = iconMap[getDeviceIcon(session.device_name, session.os_name) as keyof typeof iconMap] || Monitor
              const sessionStatus = getSessionStatus(session.last_activity)
              
              return (
                <div 
                  key={session.id} 
                  className={`rounded-lg p-4 flex items-center justify-between ${
                    session.is_current_session 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <DeviceIcon className="w-5 h-5 text-gray-600" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{session.device_name}</p>
                        {session.is_current_session && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="truncate">
                          {session.browser_name} {session.browser_version} • {session.os_name} {session.os_version}
                        </p>
                        <p className="truncate">
                          {session.location_city}, {session.location_country} • {session.ip_address}
                        </p>
                        <p>Last active: {formatSessionTime(session.last_activity)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {session.is_current_session ? (
                      <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Active Now
                      </span>
                    ) : (
                      <>
                        <span className={`text-sm ${sessionStatus.color}`}>
                          {sessionStatus.label}
                        </span>
                        <Button
                          onClick={() => onUpdate && onUpdate({ action: 'revoke', sessionId: session.id })}
                          variant="ghost"
                          size="sm"
                          className="h-11 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          Revoke
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return null
}