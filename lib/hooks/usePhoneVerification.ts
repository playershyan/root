import { useState, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'
import { textlkService } from '@/lib/services/textlkService'

interface UsePhoneVerificationOptions {
  purpose?: 'profile' | 'listing' | 'wanted'
}

interface UsePhoneVerificationReturn {
  sendOTP: (phone: string, recaptchaToken?: string) => Promise<{ success: boolean; error?: string }>
  verifyOTP: (phone: string, otpCode: string) => Promise<{ success: boolean; error?: string; verified?: boolean }>
  isSending: boolean
  isVerifying: boolean
  error: string | null
}

export function usePhoneVerification(options: UsePhoneVerificationOptions = {}): UsePhoneVerificationReturn {
  const { purpose = 'profile' } = options
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendOTP = useCallback(async (phone: string, recaptchaToken?: string): Promise<{ success: boolean; error?: string }> => {
    setIsSending(true)
    setError(null)

    try {
      // Validate phone number format (basic client-side check)
      const isValidPhone = textlkService.validatePhoneNumber(phone)
      if (!isValidPhone) {
        const errorMsg = 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      // For updates we send the raw phone (digits) and let the server normalize.
      const formattedPhone = phone

      // Call send OTP API for authenticated updates (profile / listing / wanted)
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          flow: 'phone_update'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to send OTP'
        setError(errorMsg)
        logger.error('Send OTP failed', new Error(errorMsg), {
          component: 'usePhoneVerification',
          action: 'sendOTP',
          purpose,
          phone: formattedPhone,
          status: response.status
        })
        return { success: false, error: errorMsg }
      }

      logger.debug('OTP sent successfully', {
        component: 'usePhoneVerification',
        action: 'sendOTP',
        purpose,
        phone: formattedPhone
      })

      return { success: true }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      setError(errorMsg)
      logger.error('Send OTP error', err as Error, {
        component: 'usePhoneVerification',
        action: 'sendOTP',
        purpose
      })
      return { success: false, error: errorMsg }
    } finally {
      setIsSending(false)
    }
  }, [purpose])

  const verifyOTP = useCallback(async (phone: string, otpCode: string): Promise<{ success: boolean; error?: string; verified?: boolean }> => {
    setIsVerifying(true)
    setError(null)

    try {
      // Format phone for API (server handles normalization)
      const formattedPhone = phone

      logger.debug('Calling verify OTP API', {
        endpoint: '/api/auth/verify-phone-otp',
        phoneNumber: formattedPhone,
        otpCodeLength: otpCode.length,
        isPhoneUpdate: true,
        purpose
      })

      // Call verify OTP API with phone_update flow for authenticated users
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          otpCode: otpCode,
          flow: 'phone_update'
        })
      })

      logger.debug('Verify OTP response received', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Invalid OTP code'
        setError(errorMsg)
        logger.error('Verify OTP failed', new Error(errorMsg), {
          component: 'usePhoneVerification',
          action: 'verifyOTP',
          purpose,
          phone: formattedPhone,
          status: response.status
        })
        return { success: false, error: errorMsg, verified: false }
      }

      logger.debug('OTP verified successfully', {
        component: 'usePhoneVerification',
        action: 'verifyOTP',
        purpose,
        phone: formattedPhone
      })

      return { success: true, verified: true }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed. Please try again.'
      setError(errorMsg)
      logger.error('Verify OTP error', err as Error, {
        component: 'usePhoneVerification',
        action: 'verifyOTP',
        purpose
      })
      return { success: false, error: errorMsg, verified: false }
    } finally {
      setIsVerifying(false)
    }
  }, [purpose])

  return {
    sendOTP,
    verifyOTP,
    isSending,
    isVerifying,
    error
  }
}

