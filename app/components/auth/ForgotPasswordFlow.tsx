'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { validateEmail } from '@/lib/errorHandling'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ForgotPasswordFlowProps {
  onBack?: () => void;
  onSuccess?: () => void;
  initialEmail?: string;
}

type ForgotPasswordStep = 'email-input' | 'email-verification' | 'new-password' | 'success'

export default function ForgotPasswordFlow({
  onBack,
  onSuccess,
  initialEmail = ''
}: ForgotPasswordFlowProps) {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email-input')
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resendTimer, setResendTimer] = useState(0)
  const [successTimer, setSuccessTimer] = useState(3)

  const router = useRouter()

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendTimer])

  // Success redirect timer
  useEffect(() => {
    if (currentStep === 'success' && successTimer > 0) {
      const timer = setInterval(() => {
        setSuccessTimer(prev => {
          if (prev <= 1) {
            // Redirect to login
            if (onSuccess) {
              onSuccess()
            } else {
              onBack?.()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [currentStep, successTimer, onSuccess, onBack])

  // Step 1: Email input for password reset
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setErrors({})

    if (!email) {
      setErrors({ email: 'Email is required' })
      return
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' })
      return
    }

    setLoading(true)

    try {
      // Send password reset OTP
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
      })

      if (error) {
        // Check if it's a rate limit error
        if (error.message.includes('rate') || error.message.includes('limit')) {
          setErrors({ general: 'Too many reset attempts. Please try again later.' })
        } else {
          setErrors({ general: error.message || 'Failed to send reset code' })
        }
      } else {
        setCurrentStep('email-verification')
        setResendTimer(60)
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Email verification
  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits' })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Verify OTP code
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery'
      })

      if (error) {
        setErrors({ otp: error.message || 'Invalid verification code' })
        setOtp(['', '', '', '', '', ''])
      } else {
        setCurrentStep('new-password')
      }
    } catch (error) {
      setErrors({ otp: 'Verification failed. Please try again.' })
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Set new password
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setErrors({})

    // Validate passwords
    if (!newPassword) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (newPassword.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' })
      return
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setLoading(true)

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setErrors({ general: error.message || 'Failed to update password' })
      } else {
        // Clear sensitive data
        setNewPassword('')
        setConfirmPassword('')
        setOtp(['', '', '', '', '', ''])

        // Show success
        setCurrentStep('success')
        setSuccessTimer(3)
      }
    } catch (error) {
      setErrors({ general: 'Failed to update password. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setErrors({ ...errors, otp: '' })

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`reset-otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all digits filled
    if (index === 5 && value && newOtp.every(digit => digit)) {
      const event = new Event('submit', { bubbles: true, cancelable: true })
      const form = document.getElementById('reset-verification-form')
      form?.dispatchEvent(event)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`reset-otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
      })

      if (error) {
        setErrors({ general: error.message || 'Failed to resend code' })
      } else {
        setResendTimer(60)
        setOtp(['', '', '', '', '', ''])
      }
    } catch (error) {
      setErrors({ general: 'Failed to resend code' })
    } finally {
      setLoading(false)
    }
  }

  const handleBackNavigation = () => {
    switch (currentStep) {
      case 'email-verification':
        setCurrentStep('email-input')
        setOtp(['', '', '', '', '', ''])
        break
      case 'new-password':
        setCurrentStep('email-verification')
        setNewPassword('')
        setConfirmPassword('')
        break
      default:
        onBack?.()
        break
    }
  }

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const errorInputClasses = "border-red-500 focus:ring-red-500"

  return (
    <div className="space-y-4">
      {/* Back Button (not shown on success) */}
      {currentStep !== 'success' && (
        <Button
          onClick={handleBackNavigation}
          variant="ghost"
          size="sm"
          className="mb-4 gap-2"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
      )}

      {/* General Error */}
      {errors.general && currentStep !== 'success' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Step 1: Email Input */}
      {currentStep === 'email-input' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reset your password</h3>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a verification code
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <Label htmlFor="reset-email">
                Email Address
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-300' : ''}
                placeholder="Enter your email"
                disabled={loading}
                inputMode="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="default"
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending code...
                </>
              ) : (
                'Next'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 2: Email Verification */}
      {currentStep === 'email-verification' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Enter verification code</h3>
            <p className="text-sm text-gray-600">
              A password reset code has been sent to your email
            </p>
            <p className="text-sm font-medium text-gray-700 mt-1">{email}</p>
          </div>

          <form id="reset-verification-form" onSubmit={handleCodeVerification} className="space-y-4">
            <div>
              <Label className="block mb-3 text-center">
                Verification Code
              </Label>
              <div className="flex justify-center gap-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reset-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 min-h-touch text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-sm text-red-600 text-center">{errors.otp}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
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
                'Verify'
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600 mb-2">
              Didn't get any code?
            </p>
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend in {resendTimer} seconds
              </p>
            ) : (
              <Button
                onClick={handleResendCode}
                disabled={loading}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                Resend
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: New Password */}
      {currentStep === 'new-password' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create new password</h3>
            <p className="text-sm font-medium text-gray-700">{email}</p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Label htmlFor="new-password">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={errors.password ? 'border-red-300' : ''}
                placeholder="Enter new password"
                disabled={loading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirm-new-password">
                Confirm Password
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'border-red-300' : ''}
                placeholder="Confirm new password"
                disabled={loading}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              size="default"
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Updating password...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Step 4: Success */}
      {currentStep === 'success' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Password changed successfully</h3>
          <p className="text-sm text-gray-600">
            Redirecting to login in {successTimer} seconds...
          </p>
        </div>
      )}
    </div>
  )
}