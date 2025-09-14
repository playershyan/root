'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { signUp, signInWithEmailOTP, verifyEmailOTP } from '@/lib/auth'
import { validateEmail } from '@/lib/errorHandling'
import type { AuthResult } from './types'

interface MultiStepEmailSignupProps {
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: string) => void;
  onBack?: () => void;
  onSwitchToLogin?: () => void;
  loading?: boolean;
}

type SignupStep = 'email-input' | 'email-verification' | 'complete-registration'

export default function MultiStepEmailSignup({
  onSuccess,
  onError,
  onBack,
  onSwitchToLogin,
  loading: externalLoading = false
}: MultiStepEmailSignupProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>('email-input')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resendTimer, setResendTimer] = useState(0)

  const { refreshUser } = useAuth()
  const router = useRouter()

  // Check if email already exists in Supabase
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error('Error checking email existence:', error)
      return false
    }
  }

  // Step 1: Email input with validation
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || externalLoading) return

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
      // Check if email already exists
      const emailExists = await checkEmailExists(email)

      if (emailExists) {
        setErrors({
          email: 'emailExists',
          emailExistsMessage: 'The entered email is already registered.'
        })
        setLoading(false)
        return
      }

      // Send verification email
      const result = await signInWithEmailOTP(email)

      if (result.success) {
        setCurrentStep('email-verification')
        setResendTimer(60)
      } else {
        setErrors({ general: result.error?.message || 'Failed to send verification email' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Email verification
  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits' })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const result = await verifyEmailOTP(email, otpCode)

      if (result.success) {
        setCurrentStep('complete-registration')
      } else {
        setErrors({ otp: result.error?.message || 'Invalid verification code' })
        setOtp(['', '', '', '', '', ''])
      }
    } catch (error) {
      setErrors({ otp: 'Verification failed. Please try again.' })
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Complete registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || externalLoading) return

    setErrors({})

    if (!firstName.trim()) {
      setErrors({ firstName: 'First name is required' })
      return
    }

    if (!lastName.trim()) {
      setErrors({ lastName: 'Last name is required' })
      return
    }

    if (!password) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const result = await signUp(email, password, undefined, fullName)

      if (result.success) {
        await refreshUser()
        const authResult: AuthResult = { success: true, user: result.user }
        onSuccess?.(authResult)
        router.push('/profile')
      } else {
        setErrors({ general: result.error?.message || 'Failed to create account' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' })
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
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all digits filled (mobile behavior)
    if (index === 5 && value && newOtp.every(digit => digit)) {
      const event = new Event('submit', { bubbles: true, cancelable: true })
      const form = document.getElementById('verification-form')
      form?.dispatchEvent(event)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setErrors({})

    try {
      const result = await signInWithEmailOTP(email)

      if (result.success) {
        setResendTimer(60)
        // Clear OTP inputs
        setOtp(['', '', '', '', '', ''])
      } else {
        setErrors({ general: result.error?.message || 'Failed to resend code' })
      }
    } catch (error) {
      setErrors({ general: 'Failed to resend code' })
    } finally {
      setLoading(false)
    }
  }

  // Resend timer effect
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer(prev => prev > 0 ? prev - 1 : 0)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [resendTimer])

  const handleBackNavigation = () => {
    switch (currentStep) {
      case 'email-verification':
        setCurrentStep('email-input')
        break
      case 'complete-registration':
        setCurrentStep('email-verification')
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
      {/* Back Button */}
      <button
        onClick={handleBackNavigation}
        className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
        type="button"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* General Error */}
      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Step 1: Email Input */}
      {currentStep === 'email-input' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sign up with email</h3>
            <p className="text-sm text-gray-600">Enter your email address to get started</p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClasses} ${errors.email ? errorInputClasses : ''}`}
                placeholder="Enter your email"
                disabled={loading || externalLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email === 'emailExists' ? (
                    <>
                      {errors.emailExistsMessage}{' '}
                      <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                      >
                        Log in
                      </button>{' '}
                      instead
                    </>
                  ) : (
                    errors.email
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || externalLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || externalLoading ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Checking email...
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Email Verification */}
      {currentStep === 'email-verification' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verify your email</h3>
            <p className="text-sm text-gray-600">
              A verification code has been sent to your email
            </p>
            <p className="text-sm font-medium text-gray-700 mt-1">{email}</p>
          </div>

          <form id="verification-form" onSubmit={handleEmailVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Verification Code
              </label>
              <div className="flex justify-center gap-3 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>
              {errors.otp && <p className="text-sm text-red-600 text-center">{errors.otp}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm email'
              )}
            </button>
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
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none disabled:opacity-50"
              >
                Resend
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Complete Registration */}
      {currentStep === 'complete-registration' && (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Complete your sign up</h3>
            <p className="text-sm text-gray-600 mb-1">
              Great! Your email has been verified
            </p>
            <p className="text-sm font-medium text-gray-700">{email}</p>
          </div>

          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`${inputClasses} ${errors.firstName ? errorInputClasses : ''}`}
                placeholder="Enter your first name"
                disabled={loading || externalLoading}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`${inputClasses} ${errors.lastName ? errorInputClasses : ''}`}
                placeholder="Enter your last name"
                disabled={loading || externalLoading}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClasses} ${errors.password ? errorInputClasses : ''}`}
                placeholder="Enter your password"
                disabled={loading || externalLoading}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || externalLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || externalLoading ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Complete sign up'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}