'use client'

import { useState } from 'react'
import { textlkService } from '@/lib/services/textlkService'
import { logger } from '@/lib/utils/logger'

interface PhoneNumberInputProps {
  onSubmit: (phone: string) => void
  onBack: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export default function PhoneNumberInput({
  onSubmit,
  onBack,
  loading,
  setLoading
}: PhoneNumberInputProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format Sri Lankan number: 0XX XXX XXXX
    if (digits.length <= 10) {
      if (digits.startsWith('0')) {
        const formatted = digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10)
        return formatted.trim()
      }
    }

    return digits
  }

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '')
    return textlkService.validatePhoneNumber(cleaned)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    const cleanedPhone = phone.replace(/\s/g, '')

    if (!validatePhone(cleanedPhone)) {
      setError('Please enter a valid Sri Lankan phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Send OTP via our custom API
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: cleanedPhone,
          recaptchaToken: '', // Add reCAPTCHA if needed
          isRegistration: true
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Move to OTP verification step
        onSubmit(cleanedPhone)
      } else {
        setError(result.error || 'Failed to send verification code')
      }
    } catch (error) {
      logger.error('Phone verification error', error as Error, {
        component: 'PhoneNumberInput',
        action: 'handleSubmit'
      })
      setError('Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatPhoneNumber(value)
    setPhone(formatted)

    // Clear error when user starts typing
    if (error) setError('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Your Phone Number
        </h2>
        <p className="text-gray-600">
          We'll send you a verification code via SMS
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">+94</span>
            </div>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="77 123 4567"
              disabled={loading}
              maxLength={12} // 0XX XXX XXXX format
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Enter your Sri Lankan mobile number
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !phone.trim() || phone.replace(/\s/g, '').length < 10}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Standard message rates may apply
        </p>
      </div>
    </div>
  )
}