'use client'

import { useState } from 'react'
import { Shield, Smartphone, AlertTriangle, CheckCircle, Key } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
                <Label htmlFor="2fa-phone" className="text-blue-800">
                  Phone Number
                </Label>
                <Input
                  id="2fa-phone"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-2 border-blue-300"
                  disabled={enabling}
                />
                <p className="text-sm text-blue-600 mt-1">
                  We'll send a verification code to this number
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handlePhoneSubmit}
                  disabled={enabling || !phoneNumber}
                  variant="primary"
                >
                  {enabling ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
                <Button
                  onClick={cancelSetup}
                  disabled={enabling}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="2fa-code" className="text-blue-800">
                  Verification Code
                </Label>
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="mt-2 border-blue-300 text-center text-lg font-mono tracking-wider"
                  disabled={enabling}
                  maxLength={6}
                />
                <p className="text-sm text-blue-600 mt-1">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleVerifyCode}
                  disabled={enabling || verificationCode.length !== 6}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {enabling ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button
                  onClick={() => setSetupStep('phone')}
                  disabled={enabling}
                  variant="secondary"
                >
                  Back
                </Button>
                <Button
                  onClick={cancelSetup}
                  disabled={enabling}
                  variant="secondary"
                >
                  Cancel
                </Button>
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
              <Button
                onClick={handleDisable}
                disabled={disabling || loading}
                variant="destructive"
                className="min-h-[48px]"
              >
                {disabling ? 'Disabling...' : 'Disable'}
              </Button>
            ) : (
              <Button
                onClick={handleEnable}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 min-h-[48px]"
              >
                Enable 2FA
              </Button>
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