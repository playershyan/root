'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  EmailUpdateData,
  validateEmail
} from '@/lib/utils/securityUtils'

interface EmailSecurityCardProps {
  emailData: EmailUpdateData
  onUpdate: (data: {
    newEmail: string
    confirmEmail: string
  }) => Promise<void>
  loading?: boolean
}

export default function EmailSecurityCard({
  emailData,
  onUpdate,
  loading = false
}: EmailSecurityCardProps) {
  const [formData, setFormData] = useState({
    newEmail: '',
    confirmEmail: ''
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showCurrentEmail, setShowCurrentEmail] = useState(false)

  const handleSubmit = async () => {
    setErrors([])
    
    // Validation
    const emailValidation = validateEmail(formData.newEmail)
    if (!emailValidation.isValid) {
      setErrors([emailValidation.error!])
      return
    }
    
    if (formData.newEmail !== formData.confirmEmail) {
      setErrors(['Email addresses do not match'])
      return
    }
    
    if (formData.newEmail === emailData.currentEmail) {
      setErrors(['New email must be different from current email'])
      return
    }
    
    setSubmitting(true)
    
    try {
      await onUpdate(formData)
      setFormData({ newEmail: '', confirmEmail: '' })
    } catch (error: any) {
      setErrors([error.message || 'Failed to update email'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 sm:h-12 sm:w-12">
          <Mail className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Email Address</h3>
          <p className="text-sm text-gray-600">Update your account email address securely.</p>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Current Email */}
        <div>
          <Label htmlFor="current-email">Current Email</Label>
          <div className="relative mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <Input
              id="current-email"
              type={showCurrentEmail ? 'email' : 'password'}
              value={emailData?.currentEmail || ''}
              disabled
              className="border-0 bg-transparent pr-28 font-mono text-sm text-gray-700 focus-visible:ring-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowCurrentEmail(!showCurrentEmail)}
                className="h-8 w-8"
              >
                {showCurrentEmail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {emailData?.isVerified ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">Unverified</span>
                </div>
              )}
            </div>
          </div>
          {!emailData?.isVerified && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Email not verified</p>
                  <p className="text-sm text-amber-700">
                    Check your inbox and click the verification link to secure your account.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Email */}
        <div>
          <Label htmlFor="new-email">New Email Address</Label>
          <Input
            id="new-email"
            type="email"
            inputMode="email"
            value={formData.newEmail}
            onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
            placeholder="you@example.com"
            className="mt-2"
            disabled={submitting || loading}
          />
        </div>

        {/* Confirm Email */}
        <div>
          <Label htmlFor="confirm-email">Confirm New Email</Label>
          <Input
            id="confirm-email"
            type="email"
            inputMode="email"
            value={formData.confirmEmail}
            onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
            placeholder="Confirm new email address"
            className="mt-2"
            disabled={submitting || loading}
          />
        </div>
        
        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading || !formData.newEmail || !formData.confirmEmail}
          variant="primary"
          className="h-12 w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Updating Email...
            </>
          ) : 'Update Email'}
        </Button>

        {/* Security Notice */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
          <div className="flex items-start gap-2 text-sm text-blue-800">
            <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Security Notice</p>
              <p className="mt-1">
                You'll receive a verification email at your new address. Your email won't be changed until verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}