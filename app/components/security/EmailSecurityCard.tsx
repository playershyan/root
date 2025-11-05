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
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Email Address</h3>
          <p className="text-sm text-gray-600">Update your account email address securely</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        {/* Current Email */}
        <div>
          <Label htmlFor="current-email">Current Email</Label>
          <div className="relative mt-2">
            <Input
              id="current-email"
              type={showCurrentEmail ? 'email' : 'password'}
              value={emailData?.currentEmail || ''}
              disabled
              className="pr-32 font-mono text-sm"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowCurrentEmail(!showCurrentEmail)}
                className="h-8 w-8"
              >
                {showCurrentEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
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
            placeholder="Enter new email address"
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">{error}</p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || loading || !formData.newEmail || !formData.confirmEmail}
          variant="primary"
          className="w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Updating Email...
            </>
          ) : 'Update Email'}
        </Button>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Security Notice</p>
              <p className="text-sm text-blue-700 mt-1">
                You'll receive a verification email at your new address. Your email won't be changed until verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}