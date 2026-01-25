'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Phone, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatPhoneDisplay } from './phoneFormatter'
import { usePhoneVerification } from './usePhoneVerification'

// Special privilege UID - bypasses validation and OTP requirements
const PRIVILEGED_USER_ID = '9b288153-3836-45ff-8f0b-8a196e423477' // Remove or update for your project

interface EditPhoneModalProps {
  currentPhone: string
  isOpen: boolean
  onVerified: (newPhone: string, otpCode?: string, shouldCache?: boolean) => void
  onCancel: () => void
  purpose: 'profile' | 'listing' | 'wanted'
  hasProfileContact?: boolean // If true, caching is disabled (profile contact takes precedence)
  showSuccessToast?: (message: string, duration?: number) => void
  showErrorToast?: (message: string, duration?: number) => void
  user?: { id: string } | null // Pass user from your auth context
}

export default function EditPhoneModal({
  currentPhone,
  isOpen,
  onVerified,
  onCancel,
  purpose,
  hasProfileContact = false,
  showSuccessToast,
  showErrorToast,
  user
}: EditPhoneModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [newPhone, setNewPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [saveContactInfo, setSaveContactInfo] = useState(true)

  const { sendOTP, verifyOTP, isSending, isVerifying } = usePhoneVerification({ purpose })

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const clickOutsideHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setNewPhone('')
      setOtp(['', '', '', '', '', ''])
      setError('')
      setTimer(60)
      setCanResend(false)
      setTimeout(() => phoneInputRef.current?.focus(), 100)
    } else {
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

  // Close modal on escape key and manage body overflow
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  // Close on outside click
  useEffect(() => {
    if (clickOutsideHandlerRef.current) {
      document.removeEventListener('mousedown', clickOutsideHandlerRef.current)
      clickOutsideHandlerRef.current = null
    }

    if (!isOpen) {
      return
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!isOpen || !modalRef.current) {
        return
      }
      if (!modalRef.current.contains(target)) {
        onCancel()
      }
    }

    clickOutsideHandlerRef.current = handleClickOutside
    document.addEventListener('mousedown', handleClickOutside, false)

    return () => {
      if (clickOutsideHandlerRef.current) {
        document.removeEventListener('mousedown', clickOutsideHandlerRef.current, false)
        clickOutsideHandlerRef.current = null
      }
    }
  }, [isOpen, onCancel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      document.body.style.overflow = ''
    }
  }, [])

  const handleSendOTP = async () => {
    if (!newPhone || newPhone.trim() === '') {
      setError('Please enter a phone number')
      return
    }

    const cleanPhone = newPhone.replace(/\D/g, '')
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('Please enter a valid Sri Lankan phone number')
      return
    }

    setError('')

    // Bypass OTP for privileged user
    if (user?.id === PRIVILEGED_USER_ID) {
      if (showSuccessToast) {
        showSuccessToast(`Phone number updated successfully! ${formatPhoneDisplay(newPhone, '94')}`, 3000)
      }
      const shouldCache = (purpose === 'listing' || purpose === 'wanted') && !hasProfileContact && saveContactInfo
      onVerified(newPhone, undefined, shouldCache)
      setStep(1)
      setNewPhone('')
      setOtp(['', '', '', '', '', ''])
      setError('')
      return
    }

    const result = await sendOTP(newPhone)

    if (result.success) {
      setStep(2)
      setTimer(60)
      setCanResend(false)
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

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
      setStep(3)

      closeTimeoutRef.current = setTimeout(() => {
        if (showSuccessToast) {
          showSuccessToast(`Phone number verified successfully! ${formatPhoneDisplay(newPhone, '94')}`, 3000)
        }

        const shouldCache = (purpose === 'listing' || purpose === 'wanted') && !hasProfileContact && saveContactInfo
        onVerified(newPhone, code, shouldCache)

        setStep(1)
        setNewPhone('')
        setOtp(['', '', '', '', '', ''])
        setError('')
        closeTimeoutRef.current = null
      }, 2000)
    } else {
      setError(verifyResult.error || 'Invalid OTP code. Please try again.')
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

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {step !== 3 && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending || isVerifying}
          >
            <X size={24} />
          </button>
        )}

        {/* Header */}
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
              <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700 mb-2">
                New Phone Number
              </label>
              <input
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Sri Lankan mobile number (e.g., 0771234567)
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isSending || !newPhone}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>

            <button
              onClick={onCancel}
              disabled={isSending}
              className="w-full text-gray-600 hover:text-gray-800 py-2"
            >
              Cancel
            </button>
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
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isVerifying}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Save contact info checkbox */}
            {(purpose === 'listing' || purpose === 'wanted') && !hasProfileContact && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="saveContactInfo"
                  checked={saveContactInfo}
                  onChange={(e) => setSaveContactInfo(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="saveContactInfo" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">Save contact info</span>
                  <p className="text-xs text-gray-600 mt-1">
                    Remember this phone number for future listings and wanted requests.
                  </p>
                </label>
              </div>
            )}

            <button
              onClick={() => handleVerifyOTP()}
              disabled={isVerifying || otp.some(digit => !digit)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? (
                <>
                  <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </button>

            {/* Resend section */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isSending}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Resend Code
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend in {formatTimer(timer)}
                </p>
              )}
            </div>

            {/* Back button */}
            <div className="text-center">
              <button
                onClick={handleBack}
                disabled={isVerifying}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Change Number
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

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

            <p className="text-sm text-gray-500">
              Closing automatically...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

