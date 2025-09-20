'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { BusinessProfile } from '@/lib/types/businessProfile'
import DealershipCard from '@/app/components/dealers/DealershipCard'
import { Search, MapPin, Building2 } from 'lucide-react'

export default function DealerDirectoryPage() {
  const [dealers, setDealers] = useState<BusinessProfile[]>([])
  const [filteredDealers, setFilteredDealers] = useState<BusinessProfile[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    fetchDealers()
  }, [])

  useEffect(() => {
    filterDealers(activeSearchQuery)
  }, [activeSearchQuery, dealers])

  async function fetchDealers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('is_paused', false)
        .order('is_verified', { ascending: false })
        .order('business_name', { ascending: true })

      if (error) throw error
      setDealers(data || [])
      setFilteredDealers(data || [])
    } catch (error) {
      console.error('Error fetching dealers:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterDealers(query: string) {
    if (!query.trim()) {
      setFilteredDealers(dealers)
      return
    }

    const searchTerm = query.toLowerCase()
    const filtered = dealers.filter(dealer => {
      const locationMatch = dealer.address?.toLowerCase().includes(searchTerm)
      const nameMatch = dealer.business_name?.toLowerCase().includes(searchTerm)
      return locationMatch || nameMatch
    })
    setFilteredDealers(filtered)
  }

  function handleSearch() {
    setActiveSearchQuery(searchInput)
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  function handleClearSearch() {
    setSearchInput('')
    setActiveSearchQuery('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            Dealer Directory
          </h1>
          <p className="text-blue-100 mt-2 text-lg">
            Find trusted car dealerships near you
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by location/dealership name"
              className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer hover:text-blue-600 transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-400 hover:text-blue-600" />
            </button>
          </div>
          {activeSearchQuery && (
            <div className="mt-2 flex items-center">
              <span className="text-sm text-gray-600">
                Showing results for: <span className="font-medium">{activeSearchQuery}</span>
              </span>
              <button
                onClick={handleClearSearch}
                className="ml-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {activeSearchQuery ? `Results for "${activeSearchQuery}"` : 'All Dealerships'} ({filteredDealers.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDealers.length > 0 ? (
          <div className="space-y-4">
            {filteredDealers.map((dealer) => (
              <DealershipCard key={dealer.id} dealer={dealer} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {activeSearchQuery ? `No dealerships found for "${activeSearchQuery}"` : 'No dealerships available'}
            </p>
            <p className="text-gray-400 mt-2">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}