'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useInView } from 'react-intersection-observer'
import LocationFilter from '@/app/components/LocationFilter'
import ContactModal from '@/app/components/modals/ContactModal'
import UrgentWantedCard from '@/app/components/wantedRequests/UrgentWantedCard'
import RegularWantedCard from '@/app/components/wantedRequests/RegularWantedCard'
import { logger } from '@/lib/utils/logger'

interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  budget?: number
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  location: string
  phone: string
  whatsapp?: string
  email?: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number
  created_at: string
  user_name?: string
  user_avatar?: string
  is_active: boolean
  saved?: boolean
  is_high_priority?: boolean
  high_priority_until?: string
  views?: number
  responses?: number
}

interface FilterState {
  locations: string[]
  make: string
  model: string
  minBudget: string
  maxBudget: string
  yearFrom: string
  yearTo: string
}

const MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki',
  'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz'
]

const MAKE_MODELS = {
  'Toyota': ['Prius', 'Camry', 'Corolla', 'Vitz', 'Aqua', 'CHR', 'Highlander', 'Land Cruiser', 'Hiace', 'Hilux'],
  'Honda': ['Civic', 'Accord', 'Fit', 'Vezel', 'CR-V', 'Insight', 'City', 'Jazz', 'Pilot', 'Ridgeline'],
  'Nissan': ['March', 'Tiida', 'Sylphy', 'Teana', 'X-Trail', 'Murano', 'Navara', 'Juke', 'Qashqai', 'Leaf'],
  'Mazda': ['Demio', 'Axela', 'Atenza', 'CX-3', 'CX-5', 'CX-9', 'BT-50', 'Premacy', 'Biante', 'Roadster'],
  'Suzuki': ['Alto', 'Swift', 'Wagon R', 'Baleno', 'Vitara', 'Jimny', 'Ertiga', 'S-Cross', 'Ignis', 'Ciaz'],
  'Mitsubishi': ['Lancer', 'Outlander', 'Pajero', 'Montero', 'ASX', 'Mirage', 'Triton', 'Galant', 'Colt', 'Eclipse'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'i30', 'Accent', 'Genesis', 'Kona'],
  'Kia': ['Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto', 'Rio', 'Soul', 'Stinger', 'Carnival', 'Seltos'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS']
}

const ALL_MODELS = Object.values(MAKE_MODELS).flat().sort()

// Format budget to nearest 0.5M increment with K/M suffix
const formatBudget = (value: number | null | undefined): string => {
  if (!value) return '0'

  if (value < 1000000) {
    const rounded = Math.round(value / 50000) * 50000
    const thousands = rounded / 1000
    return `${thousands}K`
  }

  const rounded = Math.round(value / 500000) * 500000
  const millions = rounded / 1000000

  return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
}

// Helper function to render the appropriate card component
const renderWantedCard = (request: WantedRequest) => {
  const requestWithBudget = {
    ...request,
    budget: request.max_budget || request.min_budget || 0
  }

  // Show urgent card for high priority requests
  if (request.is_high_priority) {
    return <UrgentWantedCard key={request.id} request={requestWithBudget} />
  }

  return <RegularWantedCard key={request.id} request={requestWithBudget} />
}

function WantedSearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [requests, setRequests] = useState<WantedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<WantedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [filters, setFilters] = useState<FilterState>({
    locations: ['All of Sri Lanka'],
    make: 'All Makes',
    model: 'All Models',
    minBudget: '',
    maxBudget: '',
    yearFrom: '',
    yearTo: ''
  })
  const [displayCount, setDisplayCount] = useState(12)
  const [hasMore, setHasMore] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<WantedRequest | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [savedRequests, setSavedRequests] = useState<Set<string>>(new Set())

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlMake = searchParams.get('make')
    const urlModel = searchParams.get('model')
    const urlMinYear = searchParams.get('minYear')
    const urlMaxYear = searchParams.get('maxYear')
    const urlMinPrice = searchParams.get('minPrice')
    const urlMaxPrice = searchParams.get('maxPrice')

    if (urlMake || urlModel || urlMinYear || urlMaxYear || urlMinPrice || urlMaxPrice) {
      setFilters(prev => ({
        ...prev,
        make: urlMake && MAKES.includes(urlMake) ? urlMake : 'All Makes',
        model: urlModel && ALL_MODELS.includes(urlModel) ? urlModel : 'All Models',
        minBudget: urlMinPrice || '',
        maxBudget: urlMaxPrice || '',
        yearFrom: urlMinYear || '',
        yearTo: urlMaxYear || ''
      }))
    }
  }, [searchParams])

  // Load initial data
  useEffect(() => {
    fetchRequests()
    loadSavedRequests()
  }, [])

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters()
  }, [requests, searchTerm, filters, sortBy])

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('wanted_requests')
        .select(`
          *,
          profiles!wanted_requests_user_id_fkey (
            id,
            name,
            phone,
            whatsapp,
            email,
            location,
            avatar_url,
            business_profiles (
              id,
              business_name,
              phone,
              whatsapp,
              address,
              is_active
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const enhancedRequests = (data || []).map((req) => {
        const profile = req.profiles

        let contactInfo = {
          phone: req.phone,
          whatsapp: req.whatsapp,
          email: req.email,
          location: req.location
        }

        if (profile) {
          if (profile.business_profiles && profile.business_profiles.is_active) {
            const businessProfile = profile.business_profiles
            contactInfo = {
              phone: businessProfile.phone || profile.phone || req.phone,
              whatsapp: businessProfile.whatsapp || businessProfile.phone || profile.whatsapp || profile.phone || req.whatsapp,
              email: profile.email || req.email,
              location: businessProfile.address || profile.location || req.location
            }
          } else {
            contactInfo = {
              phone: profile.phone || req.phone,
              whatsapp: profile.whatsapp || profile.phone || req.whatsapp,
              email: profile.email || req.email,
              location: profile.location || req.location
            }
          }
        }

        return {
          ...req,
          ...contactInfo,
          user_name: profile?.name || req.user_name || `User ${req.id.slice(0, 4)}`,
          user_avatar: (profile?.name || req.user_name || 'U').slice(0, 2).toUpperCase()
        }
      })

      setRequests(enhancedRequests)
      setFilteredRequests(enhancedRequests.slice(0, displayCount))
    } catch (error) {
      logger.error('Error fetching requests', error as Error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedRequests = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedWantedRequests')
      if (saved) {
        setSavedRequests(new Set(JSON.parse(saved)))
      }
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...requests]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.make?.toLowerCase().includes(searchLower) ||
          req.model?.toLowerCase().includes(searchLower) ||
          req.location.toLowerCase().includes(searchLower) ||
          (req.min_year && req.min_year.toString().includes(searchLower)) ||
          (req.max_year && req.max_year.toString().includes(searchLower))
        )
      })
    }

    // Location filter
    if (filters.locations.length > 0 && !filters.locations.includes('All of Sri Lanka')) {
      filtered = filtered.filter(req =>
        filters.locations.some(loc =>
          req.location.toLowerCase().includes(loc.toLowerCase())
        )
      )
    }

    // Make filter
    if (filters.make && filters.make !== 'All Makes') {
      filtered = filtered.filter(req =>
        req.make === filters.make
      )
    }

    // Model filter
    if (filters.model && filters.model !== 'All Models') {
      filtered = filtered.filter(req =>
        req.model === filters.model
      )
    }

    // Budget filter
    if (filters.minBudget) {
      const min = parseFloat(filters.minBudget)
      filtered = filtered.filter(req =>
        req.max_budget ? req.max_budget >= min : true
      )
    }
    if (filters.maxBudget) {
      const max = parseFloat(filters.maxBudget)
      filtered = filtered.filter(req =>
        req.min_budget ? req.min_budget <= max : true
      )
    }

    // Year filter
    if (filters.yearFrom) {
      const yearFrom = parseInt(filters.yearFrom)
      filtered = filtered.filter(req =>
        req.max_year ? req.max_year >= yearFrom : true
      )
    }
    if (filters.yearTo) {
      const yearTo = parseInt(filters.yearTo)
      filtered = filtered.filter(req =>
        req.min_year ? req.min_year <= yearTo : true
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'budget-high':
          return (b.max_budget || 0) - (a.max_budget || 0)
        case 'budget-low':
          return (a.min_budget || 0) - (b.min_budget || 0)
        case 'urgency':
          const aUrgency = a.urgency === 'high' ? 0 : 1
          const bUrgency = b.urgency === 'high' ? 0 : 1
          return aUrgency - bUrgency
        default: // recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    const slicedResults = filtered.slice(0, displayCount)
    setFilteredRequests(slicedResults)
    setHasMore(filtered.length > displayCount)

  }, [requests, searchTerm, filters, sortBy, displayCount])

  const loadMore = () => {
    setDisplayCount(prev => prev + 12)
  }

  const clearFilters = () => {
    setFilters({
      locations: ['All of Sri Lanka'],
      make: 'All Makes',
      model: 'All Models',
      minBudget: '',
      maxBudget: '',
      yearFrom: '',
      yearTo: ''
    })
    setSearchTerm('')
    setSearchInput('')
    router.push('/wanted/search')
  }

  const getActiveFiltersText = () => {
    const activeFilters = []

    if (filters.make !== 'All Makes') activeFilters.push(`Make: ${filters.make}`)
    if (filters.model !== 'All Models') activeFilters.push(`Model: ${filters.model}`)
    if (filters.minBudget) activeFilters.push(`Min Budget: Rs. ${parseInt(filters.minBudget).toLocaleString()}`)
    if (filters.maxBudget) activeFilters.push(`Max Budget: Rs. ${parseInt(filters.maxBudget).toLocaleString()}`)
    if (filters.yearFrom) activeFilters.push(`From Year: ${filters.yearFrom}`)
    if (filters.yearTo) activeFilters.push(`To Year: ${filters.yearTo}`)

    return activeFilters.join(' • ')
  }

  const hasActiveFilters = () => {
    return filters.make !== 'All Makes' ||
           filters.model !== 'All Models' ||
           filters.minBudget ||
           filters.maxBudget ||
           filters.yearFrom ||
           filters.yearTo
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href="/wanted"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
              >
                ← Back to All Wanted Requests
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Search Results
              </h1>
              {hasActiveFilters() && (
                <p className="text-sm text-gray-600 mt-1">
                  Filtered by: {getActiveFiltersText()}
                </p>
              )}
            </div>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by make, model, year, or location"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setSearchTerm(searchInput.trim())}
                />
                <button
                  onClick={() => setSearchTerm(searchInput.trim())}
                  className="absolute right-1 top-1 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <i className="fas fa-search text-sm"></i>
                </button>
              </div>

              {hasActiveFilters() && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="text-gray-600 text-sm">
            {filteredRequests.length} wanted requests found
            {searchTerm && ` for "${searchTerm}"`}
            {hasActiveFilters() && ' with applied filters'}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Sort Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {filteredRequests.length} of {requests.length} total requests
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="budget-high">Budget: High to Low</option>
              <option value="budget-low">Budget: Low to High</option>
              <option value="urgency">Most Urgent</option>
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading wanted requests...</p>
          </div>
        ) : filteredRequests.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRequests.map((request) => renderWantedCard(request))}
            </div>

            {/* Load More / Infinite Scroll */}
            <div ref={loadMoreRef} className="text-center mt-8">
              {hasMore && (
                <div className="text-gray-600 text-sm">
                  {loading ? 'Loading more wanted requests...' : 'Scroll for more'}
                </div>
              )}
              {!hasMore && filteredRequests.length > 12 && (
                <div className="text-gray-500 text-sm">No more wanted requests to load</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="max-w-md mx-auto">
              <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No wanted requests found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters() || searchTerm
                  ? 'No wanted requests match your search criteria.'
                  : 'No wanted requests available at the moment.'
                }
              </p>
              {(hasActiveFilters() || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedRequest && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => {
            setShowContactModal(false)
            setSelectedRequest(null)
          }}
          listing={{
            id: selectedRequest.id,
            title: selectedRequest.title,
            phone: selectedRequest.phone,
            whatsapp: selectedRequest.whatsapp,
            price: selectedRequest.max_budget || selectedRequest.min_budget || 0,
            location: selectedRequest.location,
            make: selectedRequest.make,
            model: selectedRequest.model,
            year: selectedRequest.max_year || selectedRequest.min_year
          }}
        />
      )}
    </div>
  )
}

export default function WantedSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading search page...</p>
        </div>
      </div>
    }>
      <WantedSearchPageContent />
    </Suspense>
  )
}