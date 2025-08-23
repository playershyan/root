'use client'

import { useState } from 'react'
import { Mail, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Email
          </label>
          <div className="relative">
            <input
              type={showCurrentEmail ? 'email' : 'password'}
              value={emailData?.currentEmail || ''}
              disabled
              className="w-full px-4 py-2 pr-20 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
            />
            <div className="absolute right-2 top-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCurrentEmail(!showCurrentEmail)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                {showCurrentEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Email Address
          </label>
          <input
            type="email"
            value={formData.newEmail}
            onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
            placeholder="Enter new email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting || loading}
          />
        </div>
        
        {/* Confirm Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Email
          </label>
          <input
            type="email"
            value={formData.confirmEmail}
            onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
            placeholder="Confirm new email address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <button 
          onClick={handleSubmit}
          disabled={submitting || loading || !formData.newEmail || !formData.confirmEmail}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Updating Email...
            </div>
          ) : 'Update Email'}
        </button>

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