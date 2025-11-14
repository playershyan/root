'use client'

import { useState, FormEvent } from 'react'
import { ArrowLeft, Camera, User, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { useBusinessProfile } from '@/app/hooks/useBusinessProfile'
import BusinessProfileManagement from '@/app/components/profile/BusinessProfileManagement'
import CreateBusinessProfile from '@/app/components/profile/CreateBusinessProfile'
import { CreateBusinessProfileData } from '@/lib/types/businessProfile'

interface ProfileData {
  full_name?: string
  display_name?: string
  avatar_url?: string
  phone?: string
  whatsapp?: string
  location?: string
  bio?: string
}

interface AccountStats {
  account_age_days: number
  total_listings: number
  total_wanted_requests: number
  total_messages: number
  total_favorites: number
}

interface AccountPageClientProps {
  initialProfile: ProfileData | null
  stats: AccountStats
  email: string
}

export default function AccountPageClient({ initialProfile, stats, email }: AccountPageClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: initialProfile?.full_name || '',
    displayName: initialProfile?.display_name || '',
    phone: initialProfile?.phone || '',
    whatsapp: initialProfile?.whatsapp || '',
    location: initialProfile?.location || '',
    bio: initialProfile?.bio || ''
  })

  const {
    businessProfile,
    loading: businessLoading,
    createBusinessProfile,
    pauseBusinessProfile,
    resumeBusinessProfile,
    deleteBusinessProfile
  } = useBusinessProfile()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          display_name: formData.displayName,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          location: formData.location,
          bio: formData.bio
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      if (result.success) {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        router.refresh()
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      logger.error('Error updating profile', error as Error)
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Try again later.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBusinessProfile = async (data: CreateBusinessProfileData) => {
    const result = await createBusinessProfile(data)
    if (result.success) {
      setShowCreateProfile(false)
      toast.success('Business profile created successfully!')
      router.refresh()
    } else {
      toast.error(`Error: ${result.error || 'Failed to create business profile'}`)
    }
    return result
  }

  const handlePauseBusinessProfile = async () => {
    const result = await pauseBusinessProfile()
    if (result.success) {
      toast.success('Business profile paused successfully!')
      router.refresh()
    } else {
      toast.error(`Error: ${result.error || 'Failed to pause business profile'}`)
    }
  }

  const handleResumeBusinessProfile = async () => {
    const result = await resumeBusinessProfile()
    if (result.success) {
      toast.success('Business profile resumed successfully!')
      router.refresh()
    } else {
      toast.error(`Error: ${result.error || 'Failed to resume business profile'}`)
    }
  }

  const handleDeleteBusinessProfile = async () => {
    if (!confirm('Are you sure you want to delete your business profile? This action cannot be undone.')) {
      return
    }

    const result = await deleteBusinessProfile()
    if (result.success) {
      toast.success('Business profile deleted successfully!')
      router.refresh()
    } else {
      toast.error(`Error: ${result.error || 'Failed to delete business profile'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        fullName: initialProfile?.full_name || '',
                        displayName: initialProfile?.display_name || '',
                        phone: initialProfile?.phone || '',
                        whatsapp: initialProfile?.whatsapp || '',
                        location: initialProfile?.location || '',
                        bio: initialProfile?.bio || ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {initialProfile?.avatar_url ? (
                  <img
                    src={initialProfile.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                  >
                    <Camera className="w-4 h-4 text-gray-600" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <form className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="displayName">Display Name (Optional)</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Enter display name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio (Optional)</Label>
                      <Input
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                      />
                    </div>
                  </form>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-gray-900">{initialProfile?.full_name || 'Not set'}</p>
                    </div>

                    {initialProfile?.display_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Display Name</label>
                        <p className="mt-1 text-gray-900">{initialProfile.display_name}</p>
                      </div>
                    )}

                    {initialProfile?.bio && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bio</label>
                        <p className="mt-1 text-gray-600">{initialProfile.bio}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Colombo, Sri Lanka"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 py-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900">{email}</p>
                  </div>
                </div>

                {initialProfile?.phone && (
                  <div className="flex items-center gap-3 py-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900">{initialProfile.phone}</p>
                    </div>
                  </div>
                )}

                {initialProfile?.whatsapp && (
                  <div className="flex items-center gap-3 py-2">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">WhatsApp</p>
                      <p className="text-gray-900">{initialProfile.whatsapp}</p>
                    </div>
                  </div>
                )}

                {initialProfile?.location && (
                  <div className="flex items-center gap-3 py-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location</p>
                      <p className="text-gray-900">{initialProfile.location}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Account Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.total_listings}</p>
                <p className="text-sm text-gray-600">Listings</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.total_wanted_requests}</p>
                <p className="text-sm text-gray-600">Requests</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.total_favorites}</p>
                <p className="text-sm text-gray-600">Favorites</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{stats.total_messages}</p>
                <p className="text-sm text-gray-600">Messages</p>
              </div>
            </div>
          </div>

          {/* Business Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Business Profile</h2>
            
            {businessLoading ? (
              <p className="text-gray-500">Loading business profile...</p>
            ) : businessProfile && businessProfile.is_active ? (
              <BusinessProfileManagement
                businessProfile={businessProfile}
                onPause={handlePauseBusinessProfile}
                onResume={handleResumeBusinessProfile}
                onDelete={handleDeleteBusinessProfile}
              />
            ) : showCreateProfile ? (
              <CreateBusinessProfile
                onSubmit={handleCreateBusinessProfile}
                onCancel={() => setShowCreateProfile(false)}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You don't have a business profile yet.</p>
                <Button onClick={() => setShowCreateProfile(true)}>
                  Create Business Profile
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

