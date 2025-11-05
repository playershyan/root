'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useBusinessProfile } from '@/app/hooks/useBusinessProfile'
import BusinessPageTab from '@/app/components/profile/BusinessPageTab'
import BusinessProfileRecovery from '@/app/components/profile/BusinessProfileRecovery'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface UpdateBusinessProfileData {
  business_name?: string
  business_description?: string
  business_address?: string
  business_phone?: string
  business_email?: string
  business_website?: string
}

export default function BusinessPage() {
  const router = useRouter()
  const { businessProfile, loading, fetchBusinessProfile } = useBusinessProfile()
  const [businessLoading, setBusinessLoading] = useState(false)

  // Handle business profile update
  const handleUpdateBusinessProfile = async (data: UpdateBusinessProfileData) => {
    setBusinessLoading(true)
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

      const result = await response.json()

      // Refresh business profile data
      await fetchBusinessProfile()

      alert('Business profile updated successfully')
      return result
    } catch (error) {
      console.error('Error updating business profile:', error)
      throw error
    } finally {
      setBusinessLoading(false)
    }
  }

  // Handle recovery callback
  const handleRecovered = async (businessName: string) => {
    console.log(`Business profile "${businessName}" recovered`)
    // Refresh business profile data
    await fetchBusinessProfile()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold mb-6">Business Profile</h1>

          {loading ? (
            <p className="text-gray-600">Loading business profile...</p>
          ) : businessProfile ? (
            <BusinessPageTab
              businessProfile={businessProfile}
              onUpdate={handleUpdateBusinessProfile}
              loading={businessLoading}
            />
          ) : (
            <BusinessProfileRecovery onRecovered={handleRecovered} />
          )}
        </div>
      </div>
    </div>
  )
}
