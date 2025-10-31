'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { verifyOTP } from '@/lib/auth'
import type { OTPVerificationProps, AuthResult } from './types'
import { isNative, readFromClipboard } from '@/lib/capacitor-bridge'
import { Capacitor } from '@capacitor/core'

export default function OTPVerification({
  phone,
  email,
  onVerificationComplete,
  onResendOTP,
  resendTimer = 60
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(resendTimer)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { refreshUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (timer > 0) {
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
    }
  }, [timer])

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus()
    
    // SMS Auto-fill for Android (native app only)
    if (isNative() && Capacitor.getPlatform() === 'android') {
      setupSMSAutoFill()
    }
  }, [])

  const setupSMSAutoFill = async () => {
    // Android SMS Retriever API integration
    // This requires a custom Capacitor plugin or Web Intent handling
    // For now, we'll implement clipboard monitoring as a fallback
    
    // Check clipboard on mount (OTP might be copied)
    const clipboardText = await readFromClipboard()
    if (clipboardText && /^\d{6}$/.test(clipboardText.trim())) {
      const code = clipboardText.trim()
      const newOtp = code.split('').slice(0, 6)
      setOtp(newOtp)
      
      // Auto-submit if complete
      if (newOtp.length === 6 && newOtp.every(digit => digit)) {
        setTimeout(() => handleVerify(code), 500)
      }
    }

    // Listen for SMS events (would require custom plugin)
    // For now, provide manual paste option
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

    // Auto-submit when all fields are filled
    if (index === 5 && value && newOtp.every(digit => digit)) {
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

    setLoading(true)
    setError('')
    
    try {
      if (!phone) {
        throw new Error('OTP verification currently only supports phone numbers')
      }

      const result = await verifyOTP(phone, code)
      
      if (result.success) {
        await refreshUser()
        const authResult: AuthResult = { success: true, user: result.user }
        onVerificationComplete(authResult)
        router.push(authConfig.redirectUrls.afterLogin)
      } else {
        const errorMessage = result.error?.message || 'Invalid verification code'
        setError(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'Verification failed. Please try again.'
      console.error('OTP verification error:', error)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setCanResend(false)
    setTimer(resendTimer)
    setError('')
    
    try {
      await onResendOTP()
    } catch (error) {
      setError('Failed to resend code. Please try again.')
      setCanResend(true)
      setTimer(0)
    }
  }

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Verify Your {phone ? 'Phone Number' : 'Email'}
        </h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to{' '}
          <span className="font-medium">
            {phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : email}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

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
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              disabled={loading}
            />
          ))}
        </div>

        <button
          onClick={() => handleVerify()}
          disabled={loading || otp.some(digit => !digit)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
          >
            Resend Code
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend in {formatTimer(timer)}
          </p>
        )}
      </div>
    </div>
  )
}