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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 sm:h-12 sm:w-12">
          <Shield className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account.</p>
        </div>
      </div>

      {/* Setup Steps */}
      {setupStep && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900 sm:text-base">
              {setupStep === 'phone' ? 'Step 1 · Add your phone number' : 'Step 2 · Enter verification code'}
            </h4>
          </div>

          {setupStep === 'phone' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="2fa-phone" className="text-blue-900">
                  Phone Number
                </Label>
                <Input
                  id="2fa-phone"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-2 border-blue-200"
                  disabled={enabling}
                />
                <p className="mt-1 text-xs text-blue-700 sm:text-sm">
                  We'll send a verification code to this number.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handlePhoneSubmit}
                  disabled={enabling || !phoneNumber}
                  variant="primary"
                  className="h-11 w-full sm:w-auto"
                >
                  {enabling ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
                <Button
                  onClick={cancelSetup}
                  disabled={enabling}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="2fa-code" className="text-blue-900">
                  Verification Code
                </Label>
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="mt-2 border-blue-200 text-center text-lg font-mono tracking-[0.35em]"
                  disabled={enabling}
                  maxLength={6}
                />
                <p className="mt-1 text-xs text-blue-700 sm:text-sm">
                  Enter the 6-digit code sent to {phoneNumber}.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  onClick={handleVerifyCode}
                  disabled={enabling || verificationCode.length !== 6}
                  className="h-11 w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                >
                  {enabling ? 'Verifying...' : 'Verify & Enable'}
                </Button>
                <Button
                  onClick={() => setSetupStep('phone')}
                  disabled={enabling}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto"
                >
                  Back
                </Button>
                <Button
                  onClick={cancelSetup}
                  disabled={enabling}
                  variant="secondary"
                  className="h-11 w-full sm:w-auto"
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
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Current Status */}
      {!setupStep && (
        <div
          className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
            twoFactorData?.isEnabled ? 'border-green-200 bg-green-50/70' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex flex-1 items-start gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                twoFactorData?.isEnabled ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Smartphone
                className={`h-6 w-6 ${
                  twoFactorData?.isEnabled ? 'text-green-600' : 'text-gray-500'
                }`}
              />
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="text-base font-semibold text-gray-900">SMS Authentication</p>
              <p>
                {twoFactorData?.isEnabled
                  ? `Enabled for ${twoFactorData.phoneNumber || 'your phone number'}.`
                  : 'Receive verification codes via SMS for enhanced security.'}
              </p>
              {twoFactorData?.isEnabled && (
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Protected</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            {twoFactorData?.isEnabled ? (
              <Button
                onClick={handleDisable}
                disabled={disabling || loading}
                variant="destructive"
                className="h-11 w-full sm:w-36"
              >
                {disabling ? 'Disabling...' : 'Disable'}
              </Button>
            ) : (
              <Button
                onClick={handleEnable}
                disabled={loading}
                className="h-11 w-full bg-green-600 hover:bg-green-700 sm:w-36"
              >
                Enable 2FA
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Benefits Section */}
      {!twoFactorData?.isEnabled && !setupStep && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-3 sm:p-4">
          <p className="text-sm font-medium text-blue-900">Why enable two-factor authentication?</p>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• Protects against unauthorized access</li>
            <li>• Works even if someone knows your password</li>
            <li>• Sends instant notifications of login attempts</li>
            <li>• Follows industry-standard security practices</li>
          </ul>
        </div>
      )}
    </div>
  )
}