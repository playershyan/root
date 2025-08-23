'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { signInWithOTP } from '@/lib/auth'
import { validatePhone } from '@/lib/errorHandling'
import CountrySelector, { useCountrySelector } from '../CountrySelector'
import type { PhoneAuthProps, AuthResult } from './types'

interface PhoneAuthFormProps extends PhoneAuthProps {
  onVerificationRequired?: (phone: string) => void;
}

export default function PhoneAuthForm({
  loading: externalLoading = false,
  disabled = false,
  className = '',
  onSuccess,
  onError,
  countryCode: initialCountryCode = 'LK',
  onCountryChange,
  onVerificationRequired
}: PhoneAuthFormProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { refreshUser } = useAuth()
  const router = useRouter()
  const { selectedCountry, setSelectedCountry } = useCountrySelector(initialCountryCode)

  if (!authConfig.phone.enabled) {
    return null
  }

  const handleCountryChange = (country: any) => {
    setSelectedCountry(country)
    onCountryChange?.(country.code)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loading || externalLoading || disabled) return

    const fullPhone = `${selectedCountry.dial_code}${phone.replace(/^0+/, '')}`
    
    if (!validatePhone(fullPhone)) {
      const errorMessage = 'Please enter a valid phone number'
      setError(errorMessage)
      onError?.(errorMessage)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const result = await signInWithOTP(fullPhone)
      
      if (result.success) {
        // Phone OTP requires verification step
        onVerificationRequired?.(fullPhone)
        const authResult: AuthResult = { 
          success: true, 
          requiresPhoneVerification: true 
        }
        onSuccess?.(authResult)
      } else {
        const errorMessage = result.error?.message || 'Failed to send OTP'
        setError(errorMessage)
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      console.error('Phone auth error:', error)
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const errorInputClasses = "border-red-500 focus:ring-red-500"

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="flex">
            <CountrySelector
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryChange}
              className="border-r-0 rounded-r-none"
              disabled={loading || externalLoading || disabled}
            />
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className={`${inputClasses} ${error ? errorInputClasses : ''}`}
              placeholder="Enter phone number"
              disabled={loading || externalLoading || disabled}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            We'll send you a verification code via SMS
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || externalLoading || disabled || !phone.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading || externalLoading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          By continuing, you agree to receive SMS messages from us
        </p>
      </div>
    </div>
  )
}