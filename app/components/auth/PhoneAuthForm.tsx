'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { validatePhone } from '@/lib/errorHandling'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'
import { Mail, RefreshCw } from 'lucide-react'
import type { PhoneAuthProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface PhoneAuthFormProps extends PhoneAuthProps {
  onVerificationRequired?: (data: { phone: string; name?: string }) => void;
  onSwitchToEmail?: () => void;
  onSwitchToGoogle?: () => void;
  allowedMethods?: Array<'google' | 'email' | 'phone'>;
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
  onVerificationRequired,
  onSwitchToEmail,
  onSwitchToGoogle,
  allowedMethods = ['google', 'email', 'phone']
}: PhoneAuthFormProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [isRecaptchaError, setIsRecaptchaError] = useState(false)
  const [retrying, setRetrying] = useState(false)

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
    setIsRecaptchaError(false)
    
    try {
      // Get reCAPTCHA token for login flows (required by API)
      // Note: API requires reCAPTCHA token for login flows even if not enabled on client
      // IMPORTANT: Always get a fresh token (don't use cache) to avoid expired token errors
      let recaptchaToken: string | null = null
      if (type === 'login') {
        if (recaptchaEnabled) {
          try {
            // Get a fresh token immediately before making the API request
            // Force fresh token (skip cache) to avoid expired token errors
            // reCAPTCHA tokens have limited validity and should be used immediately
            recaptchaToken = await getToken('phone_otp', { forceFresh: true })
            if (!recaptchaToken) {
              setIsRecaptchaError(true)
              setError('reCAPTCHA failed. Please refresh the page and try again')
              setLoading(false)
              return
            }
            
            // Immediately use the token - make API request right away to minimize expiration risk
          } catch (recaptchaError) {
            logger.error('reCAPTCHA token generation failed', recaptchaError as Error, {
              component: 'PhoneAuthForm',
              action: 'handleSubmit'
            })
            setIsRecaptchaError(true)
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

      // Important: Make the API request immediately after getting the token
      // This minimizes the time between token generation and API verification

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
          setIsRecaptchaError(true)
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

  const handleRetry = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    if (loading || retrying) return
    
    setRetrying(true)
    setError('')
    setIsRecaptchaError(false)
    
    // Re-submit the form with a fresh reCAPTCHA token
    // Create a synthetic form event to trigger handleSubmit
    const syntheticEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      target: null,
      currentTarget: null,
    } as React.FormEvent<HTMLFormElement>
    
    try {
      await handleSubmit(syntheticEvent)
    } catch (error) {
      // Error is already handled in handleSubmit
    } finally {
      // Reset retrying after a small delay to allow loading state to update
      setTimeout(() => {
        setRetrying(false)
      }, 100)
    }
  }

  const handleSwitchToEmail = () => {
    setError('')
    setIsRecaptchaError(false)
    onSwitchToEmail?.()
  }

  const handleSwitchToGoogle = () => {
    setError('')
    setIsRecaptchaError(false)
    onSwitchToGoogle?.()
  }

  // Check if alternative methods are available
  const canUseEmail = allowedMethods.includes('email') && onSwitchToEmail
  const canUseGoogle = allowedMethods.includes('google') && onSwitchToGoogle
  const showAlternatives = isRecaptchaError && (canUseEmail || canUseGoogle)

  return (
    <div className={`space-y-4 sm:space-y-5 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg space-y-3 sm:space-y-3">
            <p className="text-sm sm:text-base text-red-600 leading-relaxed">{error}</p>
            
            {/* Retry button for reCAPTCHA errors */}
            {isRecaptchaError && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <Button
                  type="button"
                  onClick={handleRetry}
                  variant="outline"
                  size="default"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={retrying || loading}
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Retrying...' : 'Retry'}
                </Button>

                {/* Alternative authentication methods */}
                {showAlternatives && (
                  <div className="pt-3 sm:pt-3.5 border-t border-red-200">
                    <p className="text-xs sm:text-sm text-red-700 mb-2.5 sm:mb-3 font-semibold">
                      Or try a different method:
                    </p>
                    <div className="flex flex-col gap-2 sm:gap-2.5">
                      {canUseEmail && (
                        <Button
                          type="button"
                          onClick={handleSwitchToEmail}
                          variant="outline"
                          size="default"
                          className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          disabled={loading}
                        >
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                          <span className="truncate">Continue with Email</span>
                        </Button>
                      )}
                      {canUseGoogle && (
                        <Button
                          type="button"
                          onClick={handleSwitchToGoogle}
                          variant="outline"
                          size="default"
                          className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          disabled={loading}
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span className="truncate">Continue with Google</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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