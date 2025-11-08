'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, AlertTriangle, Shield, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  validatePassword,
  getPasswordStrengthColor
} from '@/lib/utils/securityUtils'

interface PasswordSecurityCardProps {
  hasExistingPassword: boolean
  authProvider?: 'email' | 'google' | 'phone'
  onUpdate: (data: {
    currentPassword?: string
    newPassword: string
    confirmPassword: string
  }) => Promise<void>
  loading?: boolean
}

export default function PasswordSecurityCard({
  hasExistingPassword,
  authProvider = 'email',
  onUpdate,
  loading = false
}: PasswordSecurityCardProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: 'weak' | 'medium' | 'strong'
    score: number
    checks: { [key: string]: boolean }
  }>({
    strength: 'weak',
    score: 0,
    checks: {}
  })

  // Calculate password strength in real-time
  useEffect(() => {
    if (!formData.newPassword) {
      setPasswordStrength({ strength: 'weak', score: 0, checks: {} })
      return
    }

    const checks = {
      length: formData.newPassword.length >= 8,
      uppercase: /[A-Z]/.test(formData.newPassword),
      lowercase: /[a-z]/.test(formData.newPassword),
      numbers: /[0-9]/.test(formData.newPassword),
      symbols: /[^A-Za-z0-9]/.test(formData.newPassword)
    }

    const score = Object.values(checks).filter(Boolean).length
    let strength: 'weak' | 'medium' | 'strong' = 'weak'

    if (score >= 4) strength = 'strong'
    else if (score >= 2) strength = 'medium'

    setPasswordStrength({ strength, score, checks })
  }, [formData.newPassword])

  const handleSubmit = async () => {
    setErrors([])

    // Validation
    if (hasExistingPassword && !formData.currentPassword) {
      setErrors(['Current password is required'])
      return
    }

    const passwordValidation = validatePassword(formData.newPassword, formData.confirmPassword)
    if (!passwordValidation.isValid) {
      setErrors(passwordValidation.errors)
      return
    }

    if (hasExistingPassword && formData.newPassword === formData.currentPassword) {
      setErrors(['New password must be different from current password'])
      return
    }
    
    setSubmitting(true)
    
    try {
      await onUpdate(formData)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      setErrors([error.message || 'Failed to update password'])
    } finally {
      setSubmitting(false)
    }
  }

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 sm:h-12 sm:w-12">
          <Lock className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Password Security</h3>
          <p className="text-sm text-gray-600">Change your account password with enhanced security.</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Informational Banner for Password Creation */}
        {!hasExistingPassword && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4">
            <div className="flex items-start gap-2 text-sm text-blue-800">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">Create a password</p>
                <p>
                  You signed up with {authProvider === 'google' ? 'Google' : 'Phone OTP'}.
                  Setting a password will allow you to sign in using email and password
                  in addition to {authProvider === 'google' ? 'Google' : 'Phone OTP'}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Password - only show if password exists */}
        {hasExistingPassword && (
          <div>
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative mt-2">
              <Input
                id="current-password"
                type={showPassword.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="pr-12"
                disabled={submitting || loading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                disabled={submitting || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* New Password */}
        <div>
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative mt-2">
            <Input
              id="new-password"
              type={showPassword.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
              className="pr-12"
              disabled={submitting || loading}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              disabled={submitting || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Password Strength:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPasswordStrengthColor(passwordStrength.strength)}`}>
                  {passwordStrength.strength === 'strong' && <Shield className="w-3 h-3" />}
                  {passwordStrength.strength === 'medium' && <AlertTriangle className="w-3 h-3" />}
                  {passwordStrength.strength === 'weak' && <Lock className="w-3 h-3" />}
                  {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                </span>
              </div>
              
              {/* Strength Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${strengthColors[passwordStrength.strength]}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>
              
              {/* Requirements Checklist */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'One uppercase letter' },
                    { key: 'lowercase', label: 'One lowercase letter' },
                    { key: 'numbers', label: 'One number' },
                    { key: 'symbols', label: 'One special character' }
                  ].map(req => (
                    <div key={req.key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        passwordStrength.checks[req.key] 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {passwordStrength.checks[req.key] && <Check className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs ${
                        passwordStrength.checks[req.key] ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative mt-2">
            <Input
              id="confirm-password"
              type={showPassword.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="pr-12"
              disabled={submitting || loading}
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              disabled={submitting || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            >
              {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
          )}
        </div>
        
        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">{error}</p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            submitting ||
            loading ||
            (hasExistingPassword && !formData.currentPassword) ||
            !formData.newPassword ||
            !formData.confirmPassword ||
            formData.newPassword !== formData.confirmPassword ||
            passwordStrength.strength === 'weak'
          }
          variant="primary"
          className="h-12 w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {hasExistingPassword ? 'Updating Password...' : 'Creating Password...'}
            </>
          ) : (hasExistingPassword ? 'Update Password' : 'Create Password')}
        </Button>

        {/* Security Tips */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
          <p className="text-sm font-medium text-blue-900">Password security tips</p>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• Use a unique password you haven't used elsewhere</li>
            <li>• Consider using a password manager</li>
            <li>• Avoid common words or personal information</li>
          </ul>
        </div>
      </div>
    </div>
  )
}