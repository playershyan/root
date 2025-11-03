'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/app/contexts/AuthContext'
import { useBusinessProfile } from '@/app/hooks/useBusinessProfile'
import { supabase } from '@/lib/supabase'
import BusinessProfileManagement from '@/app/components/profile/BusinessProfileManagement'
import CreateBusinessProfile from '@/app/components/profile/CreateBusinessProfile'
import { CreateBusinessProfileData } from '@/lib/types/businessProfile'

interface ProfileData {
  id: string
  fullName: string
  phone: string
  phoneVerified: boolean
  phoneVerifiedAt: string | null
  avatar: string
  tempPhone: string
  country: string
}

export default function AccountPage() {
  const router = useRouter()
  const { user } = useAuth()

  const {
    businessProfile,
    loading: businessLoading,
    createBusinessProfile,
    pauseBusinessProfile,
    resumeBusinessProfile,
    deleteBusinessProfile
  } = useBusinessProfile()

  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    fullName: '',
    phone: '',
    phoneVerified: false,
    phoneVerifiedAt: null,
    avatar: '',
    tempPhone: '',
    country: 'LK'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [showCreateProfile, setShowCreateProfile] = useState(false)

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        router.push('/')
        return
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            id: user.id,
            fullName: profileData.name || '',
            phone: profileData.phone || user.phone || '',
            phoneVerified: profileData.phone_verified || false,
            phoneVerifiedAt: profileData.phone_verified_at,
            avatar: profileData.avatar_url || '',
            tempPhone: profileData.temp_phone || '',
            country: profileData.location || 'LK'
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }

    loadProfile()
  }, [user, router])

  // Handle profile form submission
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.fullName,
          phone: profile.phone,
          location: profile.country,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      if (result.success) {
        alert('Profile updated successfully!')
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Business profile event handlers
  const handleCreateBusinessProfile = async (data: CreateBusinessProfileData) => {
    const result = await createBusinessProfile(data)
    if (result.success) {
      setShowCreateProfile(false)
      alert('Business profile created successfully!')
    } else {
      alert(`Error: ${result.error || 'Failed to create business profile'}`)
    }
    return result
  }

  const handlePauseBusinessProfile = async () => {
    const result = await pauseBusinessProfile()
    if (result.success) {
      alert('Business profile paused successfully!')
    } else {
      alert(`Error: ${result.error || 'Failed to pause business profile'}`)
    }
  }

  const handleResumeBusinessProfile = async () => {
    const result = await resumeBusinessProfile()
    if (result.success) {
      alert('Business profile resumed successfully!')
    } else {
      alert(`Error: ${result.error || 'Failed to resume business profile'}`)
    }
  }

  const handleDeleteBusinessProfile = async () => {
    if (!confirm('Are you sure you want to delete your business profile? This action cannot be undone.')) {
      return
    }

    const result = await deleteBusinessProfile()
    if (result.success) {
      alert('Business profile deleted successfully!')
    } else {
      alert(`Error: ${result.error || 'Failed to delete business profile'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-semibold">My Profile</h1>
          </div>

          <div className="p-6">
            {/* Personal Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.fullName || 'User'}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      user?.user_metadata?.full_name
                        ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : profile.fullName
                          ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                          : 'U'
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-white border-2 border-gray-300 rounded-full p-1 hover:bg-gray-50"
                    title="Avatar upload coming soon"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email (disabled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Country (static) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                    🇱🇰 Sri Lanka
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Business Profile Management Section */}
            <div className="mt-12 border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Business Profile</h3>
              <BusinessProfileManagement
                businessProfile={businessProfile}
                onCreateProfile={() => setShowCreateProfile(true)}
                onPauseProfile={handlePauseBusinessProfile}
                onResumeProfile={handleResumeBusinessProfile}
                onDeleteProfile={handleDeleteBusinessProfile}
                loading={businessLoading}
              />
            </div>

            {/* Create Business Profile Modal */}
            {showCreateProfile && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <CreateBusinessProfile
                    onSubmit={handleCreateBusinessProfile}
                    onCancel={() => setShowCreateProfile(false)}
                    loading={businessLoading}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
