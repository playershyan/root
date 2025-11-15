'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { validatePhone } from '@/lib/errorHandling'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'
import type { PhoneAuthProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface PhoneAuthFormProps extends PhoneAuthProps {
  onVerificationRequired?: (data: { phone: string; name?: string }) => void;
}

export default function PhoneAuthForm({
  type = 'register',
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
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')

  const { refreshUser } = useAuth()
  const router = useRouter()
  const { getToken, isEnabled: recaptchaEnabled } = useRecaptcha()

  if (!authConfig.phone.enabled) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || externalLoading || disabled) return

    const trimmedName = name.trim()

    // Only require name for registration, not for login
    if (type === 'register' && !trimmedName) {
      setNameError('Full name is required')
      return
    }

    // Validate phone number before formatting (accepts with or without leading 0)
    // User can enter: 0771234567 or 771234567
    const cleanedPhone = phone.replace(/[^0-9]/g, '')
    
    if (!validatePhone(cleanedPhone)) {
      const errorMessage = 'Please enter a valid phone number (e.g., 0771234567 or 771234567)'
      setError(errorMessage)
      onError?.(errorMessage)
      return
    }

    // Format phone for storage (Sri Lankan format only - country code + number without zero)
    const fullPhone = formatPhoneForStorage(cleanedPhone, '94')

    setLoading(true)
    setError('')
    setNameError('')
    
    try {
      // Get reCAPTCHA token for login flows (required by API)
      // Note: API requires reCAPTCHA token for login flows even if not enabled on client
      let recaptchaToken: string | null = null
      if (type === 'login') {
        if (recaptchaEnabled) {
          try {
            recaptchaToken = await getToken('phone_otp')
            if (!recaptchaToken) {
              setError('reCAPTCHA failed. Please refresh the page and try again')
              setLoading(false)
              return
            }
          } catch (recaptchaError) {
            logger.error('reCAPTCHA token generation failed', recaptchaError as Error, {
              component: 'PhoneAuthForm',
              action: 'handleSubmit'
            })
            setError('reCAPTCHA failed. Please refresh the page and try again')
            setLoading(false)
            return
          }
        } else {
          // reCAPTCHA not enabled on client, but API requires it for login
          // This indicates a configuration issue - try anyway or show helpful error
          logger.warn('reCAPTCHA not enabled but required for login', {
            component: 'PhoneAuthForm',
            action: 'handleSubmit'
          })
        }
      }

      // Use our custom API endpoint that uses Text.lk service instead of Supabase
      // isRegistration: true for register, false for login
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          recaptchaToken: recaptchaToken || '',
          isRegistration: type === 'register'
        }),
      })

      const result = await response.json()

      if (result.success || response.ok) {
        // Phone OTP requires verification step
        // Only pass name if it was provided (for registration)
        onVerificationRequired?.({ phone: fullPhone, name: trimmedName || undefined })
        const authResult: AuthResult = { 
          success: true, 
          requiresPhoneVerification: true 
        }
        onSuccess?.(authResult)
      } else {
        const errorMessage = result.error || 'Failed to send OTP'
        
        // Handle specific error cases
        if (errorMessage.toLowerCase().includes('recaptcha verification required') || 
            errorMessage.toLowerCase().includes('recaptcha')) {
          setError('reCAPTCHA failed. Please refresh the page and try again')
        } else if (errorMessage.toLowerCase().includes('unsupported phone provider') || 
            errorMessage.toLowerCase().includes('phone provider')) {
          setError('SMS service is not configured for your region. Please contact support.')
        } else {
          setError(errorMessage)
        }
        
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

        {type === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError('')
              }}
              className={nameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
              placeholder="Enter your full name"
              disabled={loading || externalLoading || disabled}
            />
            {nameError && (
              <p className="text-sm text-red-600">
                {nameError}
              </p>
            )}
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
              placeholder="771234567 or 0771234567"
              maxLength={10}
              disabled={loading || externalLoading || disabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your Sri Lankan mobile number (9 or 10 digits). We'll send you a verification code via SMS
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="default"
          className="w-full"
          disabled={
            loading ||
            externalLoading ||
            disabled ||
            !phone.trim() ||
            phone.replace(/[^0-9]/g, '').length < 9 ||
            phone.replace(/[^0-9]/g, '').length > 10 ||
            (type === 'register' && !name.trim())
          }
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