'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useListingManagement } from '@/app/hooks/useListingManagement'

export default function ListingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { listings, loading } = useListingManagement(user?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold mb-6">My Listings</h1>

          {loading ? (
            <p className="text-gray-600">Loading listings...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">You have {listings.length} listing(s)</p>
              <p className="text-sm text-gray-500">Listings page - Full content will be migrated from backup</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
