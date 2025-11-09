'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { signInWithOTP } from '@/lib/auth'
import { validatePhone } from '@/lib/errorHandling'
import { formatPhoneForStorage, formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
import type { PhoneAuthProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface PhoneAuthFormProps extends PhoneAuthProps {
  onVerificationRequired?: (phone: string) => void;
}

export default function PhoneAuthForm({
  loading: externalLoading = false,
  disabled = false,
  className = '',
  onSuccess,
  onError,
  countryCode: initialCountryCode = 'LK',
  onCountryChange,
  onVerificationRequired
}: PhoneAuthFormProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { refreshUser } = useAuth()
  const router = useRouter()

  if (!authConfig.phone.enabled) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || externalLoading || disabled) return

    // Format phone for storage (Sri Lankan format only - country code + number without zero)
    const fullPhone = formatPhoneForStorage(phone, '94')
    
    if (!validatePhone(fullPhone)) {
      const errorMessage = 'Please enter a valid phone number'
      setError(errorMessage)
      onError?.(errorMessage)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await signInWithOTP(fullPhone)
      
      if (result.success) {
        // Phone OTP requires verification step
        onVerificationRequired?.(fullPhone)
        const authResult: AuthResult = { 
          success: true, 
          requiresPhoneVerification: true 
        }
        onSuccess?.(authResult)
      } else {
        const errorMessage = result.error?.message || 'Failed to send OTP'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      logger.error('Phone auth error', error as Error, {
        component: 'PhoneAuthForm',
        action: 'handleSubmit'
      })
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number
          </Label>
          <div className="flex items-center gap-2">
            <div className="h-12 px-4 flex items-center border border-input rounded-lg bg-muted text-foreground font-medium">
              +94
            </div>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
              placeholder="77 123 4567"
              maxLength={10}
              disabled={loading || externalLoading || disabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your 10-digit Sri Lankan mobile number. We'll send you a verification code via SMS
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="default"
          className="w-full"
          disabled={loading || externalLoading || disabled || !phone.trim()}
        >
          {loading || externalLoading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          By continuing, you agree to receive SMS messages from us
        </p>
      </div>
    </div>
  )
}