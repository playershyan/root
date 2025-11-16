'use client'

import { useState, useRef, useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface OTPInputProps {
  phoneNumber: string
  onVerified: (userId: string) => void
  onBack: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function OTPInput({
  phoneNumber,
  onVerified,
  onBack,
  loading,
  setLoading
}: OTPInputProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    const cleaned = phone.replace(/^\+?94/, '').replace(/^0/, '')
    if (cleaned.length >= 7) {
      return `+94 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
    }
    return phone
  }

  // Start cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Auto-submit when all fields are filled (mobile behavior)
  useEffect(() => {
    const otpValue = otp.join('')
    if (otpValue.length === 6 && !loading) {
      handleVerifyOTP(otpValue)
    }
  }, [otp, loading])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('')
      const newOtp = [...otp]
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)

      // Focus last filled input or next empty one
      const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5)
      inputRefs.current[lastFilledIndex]?.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Clear error when user starts typing
    if (error) setError('')

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = async (otpValue: string) => {
    if (loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otpCode: otpValue,
          flow: 'register'
        }),
      })

      const result = await response.json()

      if (result.success) {
        // OTP verified, move to username creation
        onVerified(result.userId)
      } else {
        setError(result.error || 'Invalid verification code')
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      logger.error('OTP verification error', error as Error, {
        component: 'OTPInput',
        action: 'handleVerifyOTP'
      })
      setError('Failed to verify code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (loading || resendCooldown > 0) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          flow: 'register'
        }),
      })

      const result = await response.json()

      if (result.success) {
        setResendCooldown(60) // 60 second cooldown
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (error) {
      logger.error('Resend OTP error', error as Error, {
        component: 'OTPInput',
        action: 'handleResendOTP'
      })
      setError('Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = () => {
    const otpValue = otp.join('')
    if (otpValue.length === 6) {
      handleVerifyOTP(otpValue)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verify Your Phone
        </h2>
        <p className="text-gray-600">
          Enter the verification code sent to
        </p>
        <p className="text-gray-900 font-medium">
          {formatPhoneForDisplay(phoneNumber)}
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <Label className="block mb-3 text-center">
            Verification Code
          </Label>
          <div className="flex gap-3 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-12 min-h-touch text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* Manual Submit Button (for desktop) */}
        <Button
          onClick={handleManualSubmit}
          disabled={loading || otp.join('').length !== 6}
          variant="default"
          size="default"
          className="w-full"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
      </div>

      {/* Resend Code */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Didn't receive the code?
        </p>
        <Button
          onClick={handleResendOTP}
          disabled={loading || resendCooldown > 0}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : 'Resend Code'
          }
        </Button>
      </div>
    </div>
  )
}