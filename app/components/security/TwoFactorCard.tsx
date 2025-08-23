'use client'

import { useState } from 'react'
import { Shield, Smartphone, AlertTriangle, CheckCircle, Key } from 'lucide-react'
import { TwoFactorAuthData } from '@/lib/utils/securityUtils'

interface TwoFactorCardProps {
  twoFactorData: TwoFactorAuthData
  onUpdate: (data: {
    action: 'enable' | 'disable'
    phoneNumber?: string
    verificationCode?: string
  }) => Promise<void>
  loading?: boolean
}

export default function TwoFactorCard({
  twoFactorData,
  onUpdate,
  loading = false
}: TwoFactorCardProps) {
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [setupStep, setSetupStep] = useState<'phone' | 'verify' | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')

  const handleEnable = async () => {
    setSetupStep('phone')
    setError('')
  }

  const handlePhoneSubmit = async () => {
    if (!phoneNumber) {
      setError('Phone number is required')
      return
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number')
      return
    }

    setEnabling(true)
    setError('')

    try {
      // This would typically send a verification code
      await onUpdate({ action: 'enable', phoneNumber })
      setSetupStep('verify')
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code')
    } finally {
      setEnabling(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setEnabling(true)
    setError('')

    try {
      await onUpdate({ 
        action: 'enable', 
        phoneNumber, 
        verificationCode 
      })
      setSetupStep(null)
      setPhoneNumber('')
      setVerificationCode('')
    } catch (error: any) {
      setError(error.message || 'Invalid verification code')
    } finally {
      setEnabling(false)
    }
  }

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
      return
    }

    setDisabling(true)
    setError('')

    try {
      await onUpdate({ action: 'disable' })
    } catch (error: any) {
      setError(error.message || 'Failed to disable two-factor authentication')
    } finally {
      setDisabling(false)
    }
  }

  const cancelSetup = () => {
    setSetupStep(null)
    setPhoneNumber('')
    setVerificationCode('')
    setError('')
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
        </div>
      </div>

      {/* Setup Steps */}
      {setupStep && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">
              {setupStep === 'phone' ? 'Step 1: Add Phone Number' : 'Step 2: Verify Code'}
            </h4>
          </div>

          {setupStep === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={enabling}
                />
                <p className="text-sm text-blue-600 mt-1">
                  We'll send a verification code to this number
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handlePhoneSubmit}
                  disabled={enabling || !phoneNumber}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {enabling ? 'Sending Code...' : 'Send Verification Code'}
                </button>
                <button
                  onClick={cancelSetup}
                  disabled={enabling}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-wider"
                  disabled={enabling}
                  maxLength={6}
                />
                <p className="text-sm text-blue-600 mt-1">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleVerifyCode}
                  disabled={enabling || verificationCode.length !== 6}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {enabling ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  onClick={() => setSetupStep('phone')}
                  disabled={enabling}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={cancelSetup}
                  disabled={enabling}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Current Status */}
      {!setupStep && (
        <div className={`rounded-lg p-6 flex items-center justify-between ${
          twoFactorData?.isEnabled
            ? 'bg-green-50 border border-green-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              twoFactorData?.isEnabled
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              <Smartphone className={`w-6 h-6 ${
                twoFactorData?.isEnabled
                  ? 'text-green-600'
                  : 'text-gray-500'
              }`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">SMS Authentication</p>
              <p className="text-sm text-gray-600 mt-1">
                {twoFactorData?.isEnabled 
                  ? `Enabled for ${twoFactorData.phoneNumber || 'your phone number'}`
                  : 'Receive verification codes via SMS for enhanced security'
                }
              </p>
              {twoFactorData?.isEnabled && (
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Protected</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {twoFactorData?.isEnabled ? (
              <button 
                onClick={handleDisable}
                disabled={disabling || loading}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disabling ? 'Disabling...' : 'Disable'}
              </button>
            ) : (
              <button 
                onClick={handleEnable}
                disabled={loading}
                className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {!twoFactorData?.isEnabled && !setupStep && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Why Enable Two-Factor Authentication?</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Protects against unauthorized access</li>
                <li>• Required even if someone knows your password</li>
                <li>• Instant notifications of login attempts</li>
                <li>• Industry-standard security practice</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}