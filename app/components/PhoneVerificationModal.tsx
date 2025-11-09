'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
  onPhoneNumberEdit: () => void
  onVerificationSuccess: () => void
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onPhoneNumberEdit,
  onVerificationSuccess
}: PhoneVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-fill OTP on mobile using WebOTP API
  useEffect(() => {
    if ('OTPCredential' in window) {
      const abortController = new AbortController()
      
      // @ts-ignore - WebOTP API might not be fully typed
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortController.signal
      }).then((otp: any) => {
        if (otp && otp.code) {
          const otpCode = otp.code
          const otpArray = otpCode.split('').slice(0, 6)
          setOtp([...otpArray, ...Array(6 - otpArray.length).fill('')])
          
          // Auto-submit if we have 6 digits
          if (otpArray.length === 6) {
            handleVerifyOtp(otpCode)
          }
        }
      }).catch((err: any) => {
        if (err.name !== 'AbortError') {
          logger.debug('WebOTP not supported or failed', {
            component: 'PhoneVerificationModal',
            error: err.message
          })
        }
      })

      return () => abortController.abort()
    }
  }, [isOpen])

  // Countdown timer
  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, timeLeft])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', ''])
      setError('')
      setSuccess('')
      setTimeLeft(600)
      setCanResend(false)
      inputRefs.current[0]?.focus()
    }
  }, [isOpen])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newOtp = [...Array(6)].map((_, i) => digits[i] || '')
      setOtp(newOtp)
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '')
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus()
      } else {
        inputRefs.current[5]?.focus()
      }

      // Auto-submit if we have 6 digits
      if (digits.length === 6) {
        handleVerifyOtp(digits)
      }
    }
  }

  const handleVerifyOtp = async (otpCode?: string) => {
    const codeToVerify = otpCode || otp.join('')
    
    if (codeToVerify.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

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
          otp: codeToVerify
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Phone number verified successfully!')
        setTimeout(() => {
          onVerificationSuccess()
          onClose()
        }, 1500)
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (error) {
      logger.error('Phone verification failed', error as Error, {
        component: 'PhoneVerificationModal',
        action: 'handleVerifyOtp'
      })
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('OTP sent successfully!')
        setTimeLeft(600)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      logger.error('Resend OTP failed', error as Error, {
        component: 'PhoneVerificationModal',
        action: 'handleResendOtp'
      })
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-10 w-10"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Verify Phone Number
          </h2>
          <p className="text-gray-600 mb-6">
            We sent a 6-digit code to <br />
            <span className="font-semibold text-blue-600">{phoneNumber}</span>
          </p>

          {/* OTP Input */}
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 min-h-touch text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={loading}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-sm text-gray-500 mb-4">
            {timeLeft > 0 ? (
              `Code expires in ${formatTime(timeLeft)}`
            ) : (
              'Code has expired'
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm mb-4 p-2 bg-green-50 rounded">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some(digit => digit === '')}
              variant="primary"
              size="default"
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={handleResendOtp}
                disabled={loading || !canResend}
                variant="outline"
                size="default"
                className="flex-1"
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </Button>

              <Button
                onClick={onPhoneNumberEdit}
                disabled={loading}
                variant="outline"
                size="default"
                className="flex-1"
              >
                Edit Number
              </Button>
            </div>
          </div>

          {/* Additional info for mobile users */}
          <p className="text-xs text-gray-500 mt-4">
            On mobile? The code might be automatically detected and filled.
          </p>
        </div>
      </div>
    </div>
  )
}