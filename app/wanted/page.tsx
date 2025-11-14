import { Suspense } from 'react'
import Link from 'next/link'
import { getWantedRequestsDynamic } from './utils/getWantedRequests'
import type { WantedFilters } from './utils/getWantedRequests'
import SearchBar from './components/SearchBar'
import FilterPanel from './components/FilterPanel'
import LoadMoreButton from './components/LoadMoreButton'
import UrgentWantedCard from '@/app/components/wantedRequests/UrgentWantedCard'
import RegularWantedCard from '@/app/components/wantedRequests/RegularWantedCard'

// Enable ISR with 30-second revalidation
export const revalidate = 30

// Make/Model data
const MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 
  'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz'
]

const MAKE_MODELS: Record<string, string[]> = {
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

function getAvailableModels(make: string): string[] {
  if (make === 'All Makes' || !make) {
    return ALL_MODELS
  }
  return MAKE_MODELS[make] || []
}

interface PageProps {
  searchParams: {
    location?: string
    make?: string
    model?: string
    minBudget?: string
    maxBudget?: string
    yearFrom?: string
    yearTo?: string
    sortBy?: string
    highPriorityOnly?: string
    search?: string
    page?: string
  }
}

export default async function WantedRequestsPage({ searchParams }: PageProps) {
  // Parse filters from URL
  const filters: WantedFilters = {
    location: searchParams.location,
    make: searchParams.make,
    model: searchParams.model,
    minBudget: searchParams.minBudget,
    maxBudget: searchParams.maxBudget,
    yearFrom: searchParams.yearFrom,
    yearTo: searchParams.yearTo,
    sortBy: searchParams.sortBy || 'recent',
    highPriorityOnly: searchParams.highPriorityOnly === 'true',
    search: searchParams.search
  }

  const currentPage = parseInt(searchParams.page || '1')
  
  // Fetch data on server
  const { requests, totalCount } = await getWantedRequestsDynamic(filters, currentPage, 20)
  
  const hasMore = (currentPage * 20) < totalCount

  // Render wanted card
  const renderWantedCard = (request: any) => {
    const requestWithBudget = {
      ...request,
      budget: request.max_budget || request.min_budget || 0
    }

    if (request.is_high_priority) {
      return <UrgentWantedCard key={request.id} request={requestWithBudget} />
    }

    return <RegularWantedCard key={request.id} request={requestWithBudget} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                {filters.location || 'All of Sri Lanka'}
              </h1>
            </div>
            
            {/* Desktop Post Wanted Button */}
            <Link 
              href="/wanted/post" 
              className="hidden lg:inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
            >
              <i className="fas fa-plus"></i>
              Publish a Wanted Request
            </Link>
            
            {/* Mobile Post Wanted Button */}
            <Link 
              href="/wanted/post" 
              className="inline-flex lg:hidden items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
            >
              <i className="fas fa-plus"></i>
              Publish a Wanted Request
            </Link>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mb-4">
            <div className="flex gap-2">
              <Suspense fallback={<div className="flex-1 h-12 bg-gray-200 rounded-full animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-gray-600 text-xs sm:text-sm">
            {totalCount} wanted request{totalCount !== 1 ? 's' : ''} found
            {filters.search && ` for "${filters.search}"`}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Suspense fallback={<div className="h-96 bg-gray-200 rounded-lg animate-pulse" />}>
              <FilterPanel 
                makes={MAKES} 
                getAvailableModels={getAvailableModels}
              />
            </Suspense>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {requests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {requests.map((request) => renderWantedCard(request))}
                </div>

                {/* Load More */}
                <Suspense fallback={<div className="text-center mt-6 text-gray-600">Loading...</div>}>
                  <LoadMoreButton 
                    currentPage={currentPage}
                    hasMore={hasMore}
                  />
                </Suspense>
              </>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-3">
                  {filters.search || filters.make || filters.model || filters.location 
                    ? 'No wanted requests match your filters.'
                    : 'No wanted requests yet.'}
                </p>
                {(filters.search || filters.make || filters.model) && (
                  <Link 
                    href="/wanted"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Clear filters and try again
                  </Link>
                )}
                {!filters.search && !filters.make && !filters.model && (
                  <Link 
                    href="/wanted/post" 
                    className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Post the first wanted request
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
