import { useState, useCallback } from 'react'
import { textlkService } from './textlkService'

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
      // Validate phone number format
      const isValidPhone = textlkService.validatePhoneNumber(phone)
      if (!isValidPhone) {
        const errorMsg = 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      const formattedPhone = phone

      // Call send OTP API
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
        return { success: false, error: errorMsg }
      }

      return { success: true }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsSending(false)
    }
  }, [purpose])

  const verifyOTP = useCallback(async (phone: string, otpCode: string): Promise<{ success: boolean; error?: string; verified?: boolean }> => {
    setIsVerifying(true)
    setError(null)

    try {
      const formattedPhone = phone

      // Call verify OTP API
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          otpCode: otpCode,
          flow: 'phone_update',
          purpose
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Invalid OTP code'
        setError(errorMsg)
        return { success: false, error: errorMsg, verified: false }
      }

      return { success: true, verified: true }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Verification failed. Please try again.'
      setError(errorMsg)
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

