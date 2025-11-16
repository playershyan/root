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
import EmailVerificationSent from './EmailVerificationSent'
import type { AuthModalProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

type AuthView = 'main' | 'email' | 'phone' | 'otp-verify' | 'forgot-password' | 'streamlined-signup' | 'email-verification-sent'

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
    name?: string;
  }>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const { toasts, showSuccess, removeToast } = useToast()

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('main')
      setAuthType(initialView)
      setVerificationData({})
      setLoading(false)
      setSuccessMessage('')
      setVerificationEmail('')
    }
  }, [isOpen, initialView])

  const handleAuthSuccess = (result: AuthResult) => {
    if (result.requiresEmailVerification) {
      // Show email verification sent view instead of closing
      if (result.email) {
        setVerificationEmail(result.email)
        setCurrentView('email-verification-sent')
      } else {
        // Fallback if email not provided
        setSuccessMessage('Please check your email to verify your account.')
        setTimeout(() => onClose(), 3000)
      }
    } else if (result.requiresPhoneVerification) {
      // Already handled by phone form
    } else {
      // Successful auth
      // Provide explicit feedback and then close + redirect
      if (authType === 'register') {
        setSuccessMessage('Profile created successfully. Redirecting to your account...')
      } else {
        setSuccessMessage('Logged in successfully. Redirecting...')
      }

      // Also show a toast notification for better UX
      showSuccess(authType === 'register' ? 'Profile created successfully' : 'Logged in successfully')

      setTimeout(() => {
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
      }, 1200)
    }
  }

  const handleAuthError = (error: string) => {
    logger.error('Auth error', new Error(error), {
      component: 'AuthModal',
      action: 'handleAuthError'
    })
    // Error handling is managed by individual components
  }

  const handlePhoneVerificationRequired = (data: { phone: string; name?: string }) => {
    setVerificationData({ phone: data.phone, name: data.name })
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
      try {
        // Use our custom API endpoint that uses Text.lk service instead of Supabase
        const response = await fetch('/api/auth/send-phone-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: verificationData.phone,
            recaptchaToken: '', // Add reCAPTCHA if needed
            isRegistration: true
          }),
        })

        const result = await response.json()
        if (result.success) {
          // Show success message to user
          setSuccessMessage('Verification code resent successfully')
        } else {
          setSuccessMessage(result.error || 'Failed to resend code')
        }
      } catch (error) {
        setSuccessMessage('Failed to resend verification code')
      }
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
            {/* Google Registration */}
            {enabledMethods.includes('google') && (
              <GoogleSignInButton
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
                loading={loading}
                variant="primary-outline"
                className="w-full"
                text="Continue with Google"
              />
            )}

            {/* Email Registration */}
            {enabledMethods.includes('email') && (
              <Button
                onClick={() => setCurrentView('email')}
                variant="outline"
                size="default"
                className="w-full gap-3"
                disabled={loading}
              >
                <Mail className="w-5 h-5" />
                <span>Continue with Email</span>
              </Button>
            )}

            {/* Phone Registration */}
            {enabledMethods.includes('phone') && (
              <Button
                onClick={() => setCurrentView('streamlined-signup')}
                variant="outline"
                size="default"
                className="w-full gap-3"
                disabled={loading}
              >
                <Phone className="w-5 h-5" />
                <span>Continue with Phone</span>
              </Button>
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
          {/* Google Auth */}
          {enabledMethods.includes('google') && (
            <GoogleSignInButton
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              loading={loading}
              variant="primary-outline"
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

          {/* Phone Auth */}
          {enabledMethods.includes('phone') && (
            <Button
              onClick={() => setCurrentView('phone')}
              variant="outline"
              size="default"
              className="w-full gap-3"
              disabled={loading}
            >
              <Phone className="w-5 h-5" />
              <span>Login with Phone</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Success</h3>
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
              type={authType}
              onSuccess={handleAuthSuccess}
              onError={handleAuthError}
              onVerificationRequired={handlePhoneVerificationRequired}
              loading={loading}
              allowedMethods={allowedMethods}
              onSwitchToEmail={() => setCurrentView('email')}
              onSwitchToGoogle={() => {
                // Trigger Google sign-in by switching to main view
                // The Google button will be available there
                setCurrentView('main')
              }}
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
              name={verificationData.name}
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

      case 'email-verification-sent':
        return (
          <EmailVerificationSent
            email={verificationEmail}
            onResend={() => {
              // Resend handled by component
            }}
            onEditEmail={() => {
              setCurrentView('email')
              setAuthType('register')
            }}
            onClose={onClose}
          />
        )

      default:
        return renderAuthOptions()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
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
    </>
  )
}