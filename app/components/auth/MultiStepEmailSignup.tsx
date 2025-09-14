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

export default function MultiStepEmailSignup({
  onSuccess,
  onError,
  onBack,
  onSwitchToLogin,
  loading: externalLoading = false
}: MultiStepEmailSignupProps) {
  // TEMPORARILY DISABLED - EMAIL AUTH IS DISABLED
  return (
    <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg text-center">
      <div className="mb-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">Email Signup Temporarily Disabled</h3>
        <p className="text-sm text-gray-600 mb-4">
          Email authentication is currently undergoing maintenance.
        </p>
        <p className="text-sm text-gray-600">
          Please use Google or Phone authentication instead.
        </p>
      </div>

      <button
        onClick={onBack}
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to main options
      </button>
    </div>
  )
}

/*
ORIGINAL CODE COMMENTED OUT - TO RE-ENABLE, REMOVE THE COMMENT BLOCKS AND SET authConfig.email.enabled = true

type SignupStep = 'email-input' | 'email-verification'

export default function MultiStepEmailSignup({
  onSuccess,
  onError,
  onBack,
  onSwitchToLogin,
  loading: externalLoading = false
}: MultiStepEmailSignupProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>('email-input')
  const [email, setEmail] = useState('')
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

  // Step 1: Email input with validation - Send Magic Link
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

      // Send magic link (not OTP)
      const result = await signInWithEmailOTP(email)

      if (result.success) {
        // Skip OTP step, go straight to "check email" message
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

  // Magic link flow - no OTP verification needed
  // User will be authenticated via callback when they click the email link

  // Magic link handles authentication - no manual registration step needed

  // OTP functions removed - using magic link flow

  const handleResendCode = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    setErrors({})

    try {
      const result = await signInWithEmailOTP(email)

      if (result.success) {
        setResendTimer(60)
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
      default:
        onBack?.()
        break
    }
  }

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const errorInputClasses = "border-red-500 focus:ring-red-500"

  return (
    <div className="space-y-4">
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

      {errors.general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

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

      {currentStep === 'email-verification' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
            <p className="text-sm text-gray-600 mb-1">
              We've sent a verification link to:
            </p>
            <p className="text-sm font-medium text-blue-600 mb-4">{email}</p>
            <p className="text-sm text-gray-600">
              Click the link in your email to continue with your signup.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Don't see the email?
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Check your spam folder or try resending the link.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend available in {resendTimer} seconds
              </p>
            ) : (
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend verification link'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      // Magic link flow - no step 3 needed, user completes profile setup after clicking email link
    </div>
  )
}

END OF COMMENTED CODE */