'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, MapPin, Phone, ArrowRight, Check } from 'lucide-react'
import CountrySelector from '../CountrySelector'
import { countries, Country } from '@/lib/data/countries'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'

interface ProfileSetupProps {
  initialData?: {
    email?: string
    name?: string
    phone?: string
  }
}

interface ProfileData {
  name: string
  phone: string
  location: string
  country: string
}

export default function ProfileSetup({ initialData }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [profileData, setProfileData] = useState<ProfileData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    location: '',
    country: 'LK' // Default to Sri Lanka
  })

  const { user, refreshUser } = useAuth()
  const router = useRouter()

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Tell us about yourself' },
    { number: 2, title: 'Contact', description: 'How can people reach you?' }
  ]

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!profileData.name.trim()) {
          newErrors.name = 'Name is required'
        }
        break
      case 2:
        if (!profileData.phone.trim()) {
          newErrors.phone = 'Phone number is required'
        }
        if (!profileData.location.trim()) {
          newErrors.location = 'Location is required'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setErrors({})

    try {
      // Create or update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: profileData.name.trim(),
          phone: formatPhoneForStorage(profileData.phone.trim()),
          location: profileData.location.trim(),
          country: profileData.country,
          membership_type: 'basic',
          language: 'en',
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      await refreshUser()
      router.push('/profile')
    } catch (error) {
      console.error('Profile setup error:', error)
      setErrors({ general: 'Failed to create profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    const inputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    const errorInputClasses = "border-red-500 focus:ring-red-500"

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to VERA!</h2>
              <p className="text-gray-600">Let's start by getting to know you better</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className={`${inputClasses} ${errors.name ? errorInputClasses : ''}`}
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <CountrySelector
                selectedCountry={countries.find(c => c.code === profileData.country) || countries.find(c => c.code === 'LK')!}
                onSelect={(country: Country) => setProfileData({ ...profileData, country: country.code })}
                disabled={loading}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-600">Help buyers and sellers connect with you</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className={`${inputClasses} ${errors.phone ? errorInputClasses : ''}`}
                placeholder="Enter your phone number"
                disabled={loading}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="location"
                  type="text"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  className={`${inputClasses} pl-11 ${errors.location ? errorInputClasses : ''}`}
                  placeholder="Enter your city or area"
                  disabled={loading}
                />
              </div>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>
        )


      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-2 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-medium text-gray-900">{steps[currentStep - 1].title}</p>
            <p className="text-xs text-gray-600">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {renderStep()}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                {currentStep === 2 ? 'Complete Setup' : 'Next'}
                {currentStep < 2 && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}