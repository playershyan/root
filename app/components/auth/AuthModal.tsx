'use client'

import { useState, useEffect } from 'react'
import { X, Phone, Mail, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authConfig } from '@/lib/config/auth.config'
import GoogleSignInButton from './GoogleSignInButton'
import EmailAuthForm from './EmailAuthForm'
import PhoneAuthForm from './PhoneAuthForm'
import OTPVerification from './OTPVerification'
import SimpleForgotPassword from './SimpleForgotPassword'
import StreamlinedSignup from './StreamlinedSignup'
import type { AuthModalProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'

type AuthView = 'main' | 'email' | 'phone' | 'otp-verify' | 'forgot-password' | 'streamlined-signup'

export default function AuthModal({
  isOpen,
  onClose,
  initialView = 'login',
  allowedMethods = ['google', 'email', 'phone'],
  onAuthSuccess
}: AuthModalProps) {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<AuthView>('main')
  const [authType, setAuthType] = useState<'login' | 'register'>(initialView)
  const [verificationData, setVerificationData] = useState<{
    phone?: string;
    email?: string;
  }>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [resetEmail, setResetEmail] = useState('')

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

      // Small delay to ensure modal close animation completes
      setTimeout(() => {
        if (onAuthSuccess) {
          // Custom callback provided - execute it (prevents default redirect)
          onAuthSuccess()
        } else {
          // No callback - default behavior is redirect to profile
          router.push(authConfig.redirectUrls.afterLogin)
        }
      }, 100)
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

      // Small delay to ensure modal close animation completes
      setTimeout(() => {
        if (onAuthSuccess) {
          // Custom callback provided - execute it (prevents default redirect)
          onAuthSuccess()
        } else {
          // No callback - default behavior is redirect to profile
          router.push(authConfig.redirectUrls.afterLogin)
        }
      }, 100)
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

    // For registration, use streamlined signup flow
    if (authType === 'register') {
      return (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Join VERA to buy and sell vehicles in Sri Lanka
            </p>
          </div>

          {/* Streamlined Registration Options */}
          <div className="space-y-3">
            {/* Phone Registration - Primary */}
            {enabledMethods.includes('phone') && (
              <Button
                onClick={() => setCurrentView('streamlined-signup')}
                variant="primary-outline"
                size="default"
                className="w-full gap-3"
                disabled={loading}
              >
                <Phone className="w-5 h-5" />
                <span>Continue with Phone</span>
              </Button>
            )}

            {/* Google Registration - Secondary */}
            {enabledMethods.includes('google') && (
              <GoogleSignInButton
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                loading={loading}
                variant="outlined"
                className="w-full"
                text="Continue with Google"
              />
            )}
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
            <Button
              onClick={() => setAuthType('login')}
              variant="link"
              size="sm"
              className="h-auto p-0"
              disabled={loading}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </div>
      )
    }

    // Login flow remains the same
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your VERA account
          </p>
        </div>

        {/* Login Options */}
        <div className="space-y-3">
          {/* Phone Auth */}
          {enabledMethods.includes('phone') && (
            <Button
              onClick={() => setCurrentView('phone')}
              variant="primary-outline"
              size="default"
              className="w-full gap-3"
              disabled={loading}
            >
              <Phone className="w-5 h-5" />
              <span>Login with Phone</span>
            </Button>
          )}

          {/* Google Auth */}
          {enabledMethods.includes('google') && (
            <GoogleSignInButton
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              loading={loading}
              variant="outlined"
              className="w-full"
              text="Login with Google"
            />
          )}

          {/* Email Auth */}
          {enabledMethods.includes('email') && (
            <Button
              onClick={() => setCurrentView('email')}
              variant="outline"
              size="default"
              className="w-full gap-3"
              disabled={loading}
            >
              <Mail className="w-5 h-5" />
              <span>Login with Email</span>
            </Button>
          )}
        </div>

        {/* Toggle to register */}
        <div className="text-center">
          <Button
            onClick={() => setAuthType('register')}
            variant="link"
            size="sm"
            className="h-auto p-0"
            disabled={loading}
          >
            Don't have an account? Create one
          </Button>
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
            <Button
              onClick={() => setCurrentView('main')}
              variant="ghost"
              size="sm"
              className="mb-4 gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <EmailAuthForm
              type={authType}
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              onForgotPassword={() => {
                // Store current email if available
                setCurrentView('forgot-password')
              }}
              loading={loading}
            />
          </div>
        )
      
      case 'phone':
        return (
          <div>
            <Button
              onClick={() => setCurrentView('main')}
              variant="ghost"
              size="sm"
              className="mb-4 gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
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
            <Button
              onClick={() => setCurrentView(verificationData.phone ? 'phone' : 'email')}
              variant="ghost"
              size="sm"
              className="mb-4 gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <OTPVerification
              phone={verificationData.phone}
              email={verificationData.email}
              onVerificationComplete={handleVerificationComplete}
              onResendOTP={handleResendOTP}
            />
          </div>
        )

      case 'forgot-password':
        return (
          <SimpleForgotPassword
            onBack={() => setCurrentView('email')}
            initialEmail={resetEmail}
          />
        )

      case 'streamlined-signup':
        return (
          <StreamlinedSignup
            onBack={() => setCurrentView('main')}
            onSuccess={handleAuthSuccess}
            initialStep="phone-input"
          />
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
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close modal"
            >
              <X size={24} />
            </Button>
          </div>

          {/* Content */}
          {renderCurrentView()}
        </div>
      </div>
    </div>
  )
}