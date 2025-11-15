'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Phone, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'

interface PhoneVerificationModalProps {
  phone: string
  isOpen: boolean
  onVerified: (verifiedPhone: string, otpCode: string) => void
  onCancel: () => void
  purpose: 'profile' | 'listing' | 'wanted'
  onResend?: () => Promise<void>
}

export default function PhoneVerificationModal({
  phone,
  isOpen,
  onVerified,
  onCancel,
  purpose,
  onResend
}: PhoneVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [verifying, setVerifying] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', ''])
      setError('')
      setLoading(false)
      setTimer(60)
      setCanResend(false)
      setVerifying(false)
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [isOpen])

  // Timer countdown
  useEffect(() => {
    if (!isOpen || timer <= 0) return

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timer])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onCancel])

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i]
      }
      setOtp(newOtp)
      
      // Focus the next empty field or submit if complete
      const nextEmptyIndex = newOtp.findIndex(digit => !digit)
      if (nextEmptyIndex === -1) {
        handleVerify(newOtp.join(''))
      } else {
        inputRefs.current[nextEmptyIndex]?.focus()
      }
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setVerifying(true)
    setError('')

    try {
      // Call parent's verification handler
      // The parent component will handle the actual API call
      onVerified(phone, code)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.'
      setError(errorMessage)
      logger.error('OTP verification error', err as Error, {
        component: 'PhoneVerificationModal',
        action: 'handleVerify',
        purpose
      })
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setCanResend(false)
    setTimer(60)
    setError('')
    setOtp(['', '', '', '', '', ''])
    
    try {
      if (onResend) {
        await onResend()
      }
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError('Failed to resend code. Please try again.')
      setCanResend(true)
      setTimer(0)
      logger.error('Resend OTP error', err as Error, {
        component: 'PhoneVerificationModal',
        action: 'handleResend',
        purpose
      })
    }
  }

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPurposeText = () => {
    switch (purpose) {
      case 'profile':
        return 'your profile'
      case 'listing':
        return 'this listing'
      case 'wanted':
        return 'this wanted request'
      default:
        return 'your account'
    }
  }

  if (!isOpen) return null

  const formattedPhone = formatPhoneDisplay(phone, '94')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={verifying}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Verify Your Phone Number
          </h3>
          <p className="text-sm text-gray-600">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-gray-900">{formattedPhone}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Enter the code to verify {getPurposeText()}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}

        {/* OTP Input */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 min-h-touch text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors active:scale-95"
                disabled={verifying || loading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerify()}
            disabled={verifying || loading || otp.some(digit => !digit)}
            variant="primary"
            size="default"
            className="w-full"
          >
            {verifying || loading ? (
              <>
                <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </Button>
        </div>

        {/* Resend section */}
        <div className="text-center space-y-2 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Didn't receive the code?
          </p>
          {canResend ? (
            <Button
              onClick={handleResend}
              variant="link"
              size="sm"
              className="h-auto p-0 text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              Resend Code
            </Button>
          ) : (
            <p className="text-sm text-gray-500">
              Resend in {formatTimer(timer)}
            </p>
          )}
        </div>

        {/* Cancel button */}
        <div className="mt-4 text-center">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            disabled={verifying || loading}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
