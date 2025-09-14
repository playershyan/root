'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { authConfig } from '@/lib/config/auth.config'
import GoogleSignInButton from './GoogleSignInButton'
import EmailAuthForm from './EmailAuthForm'
import PhoneAuthForm from './PhoneAuthForm'
import OTPVerification from './OTPVerification'
import type { AuthModalProps, AuthResult } from './types'

type AuthView = 'main' | 'email' | 'phone' | 'otp-verify'

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'login',
  allowedMethods = ['google', 'email', 'phone']
}: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>('main')
  const [authType, setAuthType] = useState<'login' | 'register'>(initialView)
  const [verificationData, setVerificationData] = useState<{
    phone?: string;
    email?: string;
  }>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('main')
      setAuthType(initialView)
      setVerificationData({})
      setLoading(false)
      setSuccessMessage('')
    }
  }, [isOpen, initialView])

  const handleAuthSuccess = (result: AuthResult) => {
    if (result.requiresEmailVerification) {
      setSuccessMessage('Please check your email to verify your account.')
      setTimeout(() => onClose(), 3000)
    } else if (result.requiresPhoneVerification) {
      // Already handled by phone form
    } else {
      // Successful auth, close modal
      onClose()
    }
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // Error handling is managed by individual components
  }

  const handlePhoneVerificationRequired = (phone: string) => {
    setVerificationData({ phone })
    setCurrentView('otp-verify')
  }

  const handleEmailVerificationRequired = (email: string) => {
    setVerificationData({ email })
    setCurrentView('otp-verify')
  }

  const handleVerificationComplete = (result: AuthResult) => {
    if (result.success) {
      onClose()
    }
  }

  const handleResendOTP = async () => {
    // Re-trigger OTP send based on verification data
    if (verificationData.phone) {
      const { signInWithOTP } = await import('@/lib/auth')
      await signInWithOTP(verificationData.phone)
    }
    // Add email OTP resend logic when implemented
  }

  const renderAuthOptions = () => {
    const enabledMethods = allowedMethods.filter(method => {
      switch (method) {
        case 'google': return authConfig.google.enabled
        case 'email': return authConfig.email.enabled
        case 'phone': return authConfig.phone.enabled
        default: return false
      }
    })

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authType === 'register' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {authType === 'register'
              ? 'Join VERA to buy and sell vehicles'
              : 'Sign in to your VERA account'
            }
          </p>
        </div>

        {/* All Auth Options - Phone first, then Google, then Email */}
        <div className="space-y-3">
          {/* Phone Auth - Primary */}
          {enabledMethods.includes('phone') && (
            <button
              onClick={() => setCurrentView('phone')}
              className="w-full flex items-center justify-center gap-3 p-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{authType === 'register' ? 'Sign up with Phone' : 'Login with Phone'}</span>
            </button>
          )}

          {/* Google Auth - Secondary */}
          {enabledMethods.includes('google') && (
            <GoogleSignInButton
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              loading={loading}
              variant="outlined"
              className="w-full"
              text={authType === 'register' ? 'Sign up with Google' : 'Login with Google'}
            />
          )}

          {/* Email Auth - Last */}
          {enabledMethods.includes('email') && (
            <button
              onClick={() => setCurrentView('email')}
              className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-700">{authType === 'register' ? 'Sign up with Email' : 'Login with Email'}</span>
            </button>
          )}
        </div>

        {/* Toggle between login/register */}
        <div className="text-center">
          <button
            onClick={() => setAuthType(authType === 'register' ? 'login' : 'register')}
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
            disabled={loading}
          >
            {authType === 'register' 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"
            }
          </button>
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    if (successMessage) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-gray-600">{successMessage}</p>
        </div>
      )
    }

    switch (currentView) {
      case 'main':
        return renderAuthOptions()
      
      case 'email':
        return (
          <div>
            <button
              onClick={() => setCurrentView('main')}
              className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <EmailAuthForm
              type={authType}
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              loading={loading}
            />
          </div>
        )
      
      case 'phone':
        return (
          <div>
            <button
              onClick={() => setCurrentView('main')}
              className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <PhoneAuthForm
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              onVerificationRequired={handlePhoneVerificationRequired}
              loading={loading}
            />
          </div>
        )
      
      case 'otp-verify':
        return (
          <div>
            <button
              onClick={() => setCurrentView(verificationData.phone ? 'phone' : 'email')}
              className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <OTPVerification
              phone={verificationData.phone}
              email={verificationData.email}
              onVerificationComplete={handleVerificationComplete}
              onResendOTP={handleResendOTP}
            />
          </div>
        )
      
      default:
        return renderAuthOptions()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header with close button */}
          <div className="flex justify-between items-center mb-6">
            <div /> {/* Spacer */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          {renderCurrentView()}
        </div>
      </div>
    </div>
  )
}