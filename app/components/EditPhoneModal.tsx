'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Phone, AlertCircle, CheckCircle2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'
import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
import { usePhoneVerification } from '@/lib/hooks/usePhoneVerification'

interface EditPhoneModalProps {
  currentPhone: string
  isOpen: boolean
  onVerified: (newPhone: string, otpCode?: string) => void
  onCancel: () => void
  purpose: 'profile' | 'listing' | 'wanted'
  showSuccessToast?: (message: string, duration?: number) => void
  showErrorToast?: (message: string, duration?: number) => void
}

export default function EditPhoneModal({
  currentPhone,
  isOpen,
  onVerified,
  onCancel,
  purpose,
  showSuccessToast,
  showErrorToast
}: EditPhoneModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [newPhone, setNewPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const { sendOTP, verifyOTP, isSending, isVerifying } = usePhoneVerification({ purpose })

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setNewPhone('')
      setOtp(['', '', '', '', '', ''])
      setError('')
      setTimer(60)
      setCanResend(false)
      // Focus phone input
      setTimeout(() => phoneInputRef.current?.focus(), 100)
    } else {
      // Clean up timeout when modal closes
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [isOpen])

  // Timer countdown for step 2
  useEffect(() => {
    if (!isOpen || step !== 2 || timer <= 0) return

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
  }, [isOpen, step, timer])

  // Close modal on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onCancel])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onCancel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
      // Ensure body overflow is reset
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleSendOTP = async () => {
    if (!newPhone || newPhone.trim() === '') {
      setError('Please enter a phone number')
      return
    }

    // Basic validation
    const cleanPhone = newPhone.replace(/\D/g, '')
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('Please enter a valid Sri Lankan phone number')
      return
    }

    setError('')
    const result = await sendOTP(newPhone)

    if (result.success) {
      setStep(2)
      setTimer(60)
      setCanResend(false)
      // Focus first OTP input
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } else {
      setError(result.error || 'Failed to send OTP. Please try again.')
    }
  }

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
      handleVerifyOTP(newOtp.join(''))
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

      // Focus the next empty field or verify if complete
      const nextEmptyIndex = newOtp.findIndex(digit => !digit)
      if (nextEmptyIndex === -1) {
        handleVerifyOTP(newOtp.join(''))
      } else {
        inputRefs.current[nextEmptyIndex]?.focus()
      }
    }
  }

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('')

    if (code.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setError('')
    const verifyResult = await verifyOTP(newPhone, code)

    if (verifyResult.success && verifyResult.verified) {
      // Show success screen inside modal
      setStep(3)

      // Auto-close after 2 seconds
      closeTimeoutRef.current = setTimeout(() => {
        // Show success toast using parent's toast function
        if (showSuccessToast) {
          showSuccessToast(`Phone number verified successfully! ${formatPhoneDisplay(newPhone, '94')}`, 3000)
        }

        // Success! Call parent callback with phone AND OTP code for API submission
        onVerified(newPhone, code)

        // Reset state
        setStep(1)
        setNewPhone('')
        setOtp(['', '', '', '', '', ''])
        setError('')
        closeTimeoutRef.current = null
      }, 2000)
    } else {
      setError(verifyResult.error || 'Invalid OTP code. Please try again.')
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setCanResend(false)
    setTimer(60)
    setError('')
    setOtp(['', '', '', '', '', ''])

    const result = await sendOTP(newPhone)
    if (result.success) {
      inputRefs.current[0]?.focus()
    } else {
      setError('Failed to resend code. Please try again.')
      setCanResend(true)
      setTimer(0)
    }
  }

  const handleBack = () => {
    setStep(1)
    setOtp(['', '', '', '', '', ''])
    setError('')
    setTimeout(() => phoneInputRef.current?.focus(), 100)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - hide on success step */}
        {step !== 3 && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending || isVerifying}
          >
            <X size={24} />
          </button>
        )}

        {/* Header - hide on success step */}
        {step !== 3 && (
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {step === 1 ? 'Edit Phone Number' : 'Verify Phone Number'}
            </h3>
            {currentPhone && (
              <p className="text-sm text-gray-600">
                Current: <span className="font-medium">{formatPhoneDisplay(currentPhone, '94')}</span>
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}

        {/* Step 1: Enter new phone number */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPhone" className="text-sm font-medium text-gray-700 mb-2">
                New Phone Number
              </Label>
              <Input
                ref={phoneInputRef}
                id="newPhone"
                type="tel"
                placeholder="0771234567"
                value={newPhone}
                onChange={(e) => {
                  setNewPhone(e.target.value)
                  setError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendOTP()
                  }
                }}
                className="w-full"
                disabled={isSending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Sri Lankan mobile number (e.g., 0771234567)
              </p>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={isSending || !newPhone}
              variant="primary"
              size="default"
              className="w-full"
            >
              {isSending ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>

            <Button
              onClick={onCancel}
              variant="ghost"
              size="sm"
              disabled={isSending}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-900">{formatPhoneDisplay(newPhone, '94')}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Enter the code to verify {getPurposeText()}
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex justify-center gap-3 mb-4">
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
                  disabled={isVerifying}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <Button
              onClick={() => handleVerifyOTP()}
              disabled={isVerifying || otp.some(digit => !digit)}
              variant="primary"
              size="default"
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

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
                  disabled={isSending}
                >
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend in {formatTimer(timer)}
                </p>
              )}
            </div>

            {/* Back button */}
            <div className="text-center">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                disabled={isVerifying}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Change Number
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            {/* Success Message */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verification Successful!
              </h3>
              <p className="text-gray-600">
                Your phone number has been verified
              </p>
              <p className="text-lg font-medium text-green-600 mt-2">
                {formatPhoneDisplay(newPhone, '94')}
              </p>
            </div>

            {/* Auto-close message */}
            <p className="text-sm text-gray-500">
              Closing automatically...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
