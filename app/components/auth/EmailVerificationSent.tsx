'use client'

import { useState } from 'react'
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { resendEmailVerification } from '@/lib/auth'
import { logger } from '@/lib/utils/logger'

interface EmailVerificationSentProps {
  email: string
  onResend: () => void
  onEditEmail: () => void
  onClose?: () => void
}

export default function EmailVerificationSent({
  email,
  onResend,
  onEditEmail,
  onClose
}: EmailVerificationSentProps) {
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setResending(true)
    setError('')
    setResendSuccess(false)

    try {
      const result = await resendEmailVerification(email)
      
      if (result.success) {
        setResendSuccess(true)
        onResend()
        // Clear success message after 3 seconds
        setTimeout(() => setResendSuccess(false), 3000)
      } else {
        setError(result.error?.message || 'Failed to resend email. Please try again.')
      }
    } catch (err) {
      logger.error('Resend email verification error', err as Error, {
        component: 'EmailVerificationSent',
        action: 'handleResend'
      })
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Check Your Email
        </h2>
        <p className="text-gray-600">
          We've sent a verification email to:
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">{email}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Please check your inbox and click the verification link to complete your registration. 
          If you don't see the email, check your spam folder.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {resendSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-600">
            Verification email has been resent successfully!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={handleResend}
          variant="outline"
          size="default"
          className="w-full gap-2"
          disabled={resending}
        >
          {resending ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Resend Email
            </>
          )}
        </Button>

        <Button
          onClick={onEditEmail}
          variant="ghost"
          size="default"
          className="w-full gap-2"
          disabled={resending}
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Email Address
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          After verifying your email, you can sign in to your account.
        </p>
      </div>
    </div>
  )
}

