'use client'

import { useState } from 'react'
import { ArrowLeft, Building2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import BusinessPageTab from '@/app/components/profile/BusinessPageTab'
import CreateBusinessProfile from '@/app/components/profile/CreateBusinessProfile'
import BusinessProfileManagement from '@/app/components/profile/BusinessProfileManagement'
import { CreateBusinessProfileData, UpdateBusinessProfileData } from '@/lib/types/businessProfile'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'

interface BusinessProfile {
  id: string
  business_name: string
  description?: string
  website?: string
  address?: string
  phone?: string
  whatsapp?: string
  operating_hours?: string
  logo_url?: string
  banner_url?: string
  profile_image_url?: string
  is_active: boolean
  is_verified: boolean
  business_type?: string
  city?: string
  total_listings?: number
  active_listings?: number
  rating?: number
}

interface BusinessPageClientProps {
  profile: BusinessProfile | null
  hasProfile: boolean
}

export default function BusinessPageClient({ profile, hasProfile }: BusinessPageClientProps) {
  const router = useRouter()
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle create business profile
  const handleCreateBusinessProfile = async (data: CreateBusinessProfileData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create business profile')
      }

      toast.success('Business profile created successfully!')
      setShowCreateProfile(false)
      router.refresh()
      
      return { success: true }
    } catch (error) {
      logger.error('Failed to create business profile', error as Error, {
        component: 'BusinessPageClient',
        action: 'createBusinessProfile'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to create business profile')
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }

  // Handle update business profile
  const handleUpdateBusinessProfile = async (data: UpdateBusinessProfileData) => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update business profile')
      }

      toast.success('Business profile updated successfully')
      router.refresh()
    } catch (error) {
      logger.error('Failed to update business profile', error as Error, {
        component: 'BusinessPageClient',
        action: 'updateBusinessProfile'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to update business profile')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Handle pause business profile
  const handlePauseBusinessProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-profile/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to pause business profile')
      }

      toast.success('Business profile paused successfully')
      router.refresh()
    } catch (error) {
      logger.error('Failed to pause business profile', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to pause business profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle resume business profile
  const handleResumeBusinessProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/business-profile/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resume business profile')
      }

      toast.success('Business profile resumed successfully')
      router.refresh()
    } catch (error) {
      logger.error('Failed to resume business profile', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to resume business profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete business profile
  const handleDeleteBusinessProfile = async () => {
    if (!confirm('Are you sure you want to delete your business profile? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete business profile')
      }

      toast.success('Business profile deleted successfully')
      router.refresh()
    } catch (error) {
      logger.error('Failed to delete business profile', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete business profile')
    } finally {
      setLoading(false)
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

        {!hasProfile || !profile ? (
          /* No Business Profile */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center max-w-md mx-auto">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h1 className="text-2xl font-semibold mb-2">Create a Business Profile</h1>
              <p className="text-gray-600 mb-6">
                Showcase your dealership or business to attract more customers and build trust
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Verified Badge</p>
                    <p className="text-sm text-gray-600">Stand out with a verified business badge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Business Page</p>
                    <p className="text-sm text-gray-600">Get a dedicated page for your business</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">More Visibility</p>
                    <p className="text-sm text-gray-600">Reach more potential customers</p>
                  </div>
                </div>
              </div>

              <Button 
                variant="primary" 
                size="default"
                onClick={() => setShowCreateProfile(true)}
                disabled={loading}
              >
                Create Business Profile
              </Button>
            </div>
          </div>
        ) : (
          /* Has Business Profile */
          <div className="space-y-6">
            <BusinessPageTab
              businessProfile={profile}
              onUpdate={handleUpdateBusinessProfile}
              loading={loading}
            />

            {/* Management Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Management</h2>
              <BusinessProfileManagement
                businessProfile={profile}
                onCreateProfile={() => setShowCreateProfile(true)}
                onPauseProfile={handlePauseBusinessProfile}
                onResumeProfile={handleResumeBusinessProfile}
                onDeleteProfile={handleDeleteBusinessProfile}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Create Profile Modal */}
        {showCreateProfile && (
          <CreateBusinessProfile
            onSubmit={handleCreateBusinessProfile}
            onCancel={() => setShowCreateProfile(false)}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

