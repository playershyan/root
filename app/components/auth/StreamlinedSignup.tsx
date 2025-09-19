'use client'

import { useState, useEffect } from 'react'
import { X, ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import GoogleSignInButton from './GoogleSignInButton'
import PhoneNumberInput from './PhoneNumberInput'
import OTPInput from './OTPInput'
import UsernameCreation from './UsernameCreation'
import type { AuthResult } from './types'

type SignupStep = 'main' | 'phone-input' | 'otp-verify' | 'username-create'

interface StreamlinedSignupProps {
  onBack: () => void
  onSuccess?: (result: AuthResult) => void
  initialStep?: SignupStep
}

export default function StreamlinedSignup({
  onBack,
  onSuccess,
  initialStep = 'main'
}: StreamlinedSignupProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>(initialStep)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationData, setVerificationData] = useState<{
    phone?: string
    userId?: string
  }>({})

  const router = useRouter()
  const { refreshUser } = useAuth()

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      setCurrentStep(initialStep)
      setPhoneNumber('')
      setVerificationData({})
      setLoading(false)
    }
  }, [initialStep])

  const handleGoogleSuccess = async (result: AuthResult) => {
    // Google auth should directly create account and go to profile
    await refreshUser()
    onSuccess?.(result)
    router.push('/profile')
  }

  const handleGoogleError = (error: string) => {
    console.error('Google auth error:', error)
    // Error handling is managed by GoogleSignInButton
  }

  const handlePhoneSubmit = (phone: string) => {
    setVerificationData({ phone })
    setCurrentStep('otp-verify')
  }

  const handleOTPVerified = (userId: string) => {
    setVerificationData(prev => ({ ...prev, userId }))
    setCurrentStep('username-create')
  }

  const handleAccountCreated = async () => {
    // Account successfully created, go to profile
    await refreshUser()
    onSuccess?.({ success: true })
    router.push('/profile')
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'phone-input':
        setCurrentStep('main')
        break
      case 'otp-verify':
        setCurrentStep('phone-input')
        break
      case 'username-create':
        setCurrentStep('otp-verify')
        break
      default:
        onBack()
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'main', label: 'Method' },
      { key: 'phone-input', label: 'Phone' },
      { key: 'otp-verify', label: 'Verify' },
      { key: 'username-create', label: 'Username' }
    ]

    const currentIndex = steps.findIndex(step => step.key === currentStep)

    if (currentStep === 'main') return null

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.slice(1).map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 < currentIndex ? 'bg-green-500 text-white' :
              index + 1 === currentIndex ? 'bg-blue-500 text-white' :
              'bg-gray-200 text-gray-600'
            }`}>
              {index + 1 < currentIndex ? <Check size={16} /> : index + 1}
            </div>
            {index < 2 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index + 1 < currentIndex ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderMainOptions = () => (
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

      {/* Authentication Options */}
      <div className="space-y-3">
        {/* Phone Registration - Primary Option */}
        <button
          onClick={() => setCurrentStep('phone-input')}
          className="w-full flex items-center justify-center gap-3 p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Continue with Phone</span>
        </button>

        {/* Google Auth - Secondary Option */}
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          loading={loading}
          variant="outlined"
          className="w-full"
          text="Continue with Google"
        />
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'main':
        return renderMainOptions()

      case 'phone-input':
        return (
          <PhoneNumberInput
            onSubmit={handlePhoneSubmit}
            onBack={handleBack}
            loading={loading}
            setLoading={setLoading}
          />
        )

      case 'otp-verify':
        return (
          <OTPInput
            phoneNumber={verificationData.phone!}
            onVerified={handleOTPVerified}
            onBack={handleBack}
            loading={loading}
            setLoading={setLoading}
          />
        )

      case 'username-create':
        return (
          <UsernameCreation
            phoneNumber={verificationData.phone!}
            userId={verificationData.userId!}
            onAccountCreated={handleAccountCreated}
            onBack={handleBack}
            loading={loading}
            setLoading={setLoading}
          />
        )

      default:
        return renderMainOptions()
    }
  }

  return (
    <div>
      {/* Header */}
      {currentStep !== 'main' && (
        <button
          onClick={handleBack}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-800"
          disabled={loading}
        >
          <ArrowLeft size={20} className="mr-1" />
          Back
        </button>
      )}

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      {renderCurrentStep()}
    </div>
  )
}