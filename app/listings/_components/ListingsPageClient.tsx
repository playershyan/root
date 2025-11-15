'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Filter, Search, Star, Crown, Zap, AlertCircle } from 'lucide-react'
import FeaturedAdCard from '@/app/components/listings/FeaturedAdCard'
import TopSpotCard from '@/app/components/listings/TopSpotCard'
import BoostedCard from '@/app/components/listings/BoostedCard'
import UrgentListingCard from '@/app/components/listings/UrgentListingCard'
import RegularAdCard from '@/app/components/listings/RegularAdCard'
import LocationFilter from '@/app/components/LocationFilter'
import { Button } from '@/components/ui/button'
import { getVehicleCategories, getMakesByCategory } from '@/lib/constants/vehicleData'
import type { ListingSummary, PromotedSlots } from '@/lib/types/listings-feed'
import type {
  ListingsPageFilterState,
  ListingsPagePaginationState,
  SortOption
} from '@/app/listings/types'

// Lazy load MobileFilterSheet for mobile view
const MobileFilterSheet = dynamic(() => import('@/app/components/filters/MobileFilterSheet'), {
  ssr: false
})

const fuelOptions = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG']
const transmissionOptions = ['Automatic', 'Manual', 'CVT', 'Tiptronic']

interface ListingsPageClientProps {
  listings: ListingSummary[]
  promoted: PromotedSlots
  pagination: ListingsPagePaginationState
  filters: ListingsPageFilterState
}

function toSortParam(sort: SortOption): string {
  switch (sort) {
    case 'price_low':
      return 'price-low'
    case 'price_high':
      return 'price-high'
    case 'year_new':
      return 'year-new'
    case 'year_old':
      return 'year-old'
    case 'mileage_low':
      return 'mileage-low'
    case 'recent':
    default:
      return 'recent'
  }
}

function fromSortParam(value: string | undefined): SortOption {
  switch (value) {
    case 'price-low':
      return 'price_low'
    case 'price-high':
      return 'price_high'
    case 'year-new':
      return 'year_new'
    case 'year-old':
      return 'year_old'
    case 'mileage-low':
      return 'mileage_low'
    default:
      return 'recent'
  }
}

export default function ListingsPageClient({
  listings,
  promoted,
  pagination,
  filters
}: ListingsPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [localFilters, setLocalFilters] = useState<ListingsPageFilterState>(filters)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const availableMakes = useMemo(() => {
    if (!localFilters.vehicleType) return []
    return getMakesByCategory(localFilters.vehicleType).map((make) => make.name)
  }, [localFilters.vehicleType])

  const availableModels = useMemo(() => {
    if (!localFilters.vehicleType) return []
    const makeList = getMakesByCategory(localFilters.vehicleType)
    if (localFilters.make) {
      const selectedMake = makeList.find((m) => m.name === localFilters.make)
      return selectedMake ? selectedMake.models.sort() : []
    }
    const models = new Set<string>()
    makeList.forEach((make) => make.models.forEach((model) => models.add(model)))
    return Array.from(models).sort()
  }, [localFilters.vehicleType, localFilters.make])

  const applyFilters = (nextFilters: ListingsPageFilterState, nextPage?: number) => {
    const params = new URLSearchParams()
    if (nextFilters.search.trim()) params.set('q', nextFilters.search.trim())
    if (nextFilters.vehicleType) params.set('category', nextFilters.vehicleType)
    if (nextFilters.location.trim()) params.set('location', nextFilters.location.trim())
    if (nextFilters.make) params.set('make', nextFilters.make)
    if (nextFilters.model) params.set('model', nextFilters.model)
    if (nextFilters.minYear) params.set('minYear', nextFilters.minYear)
    if (nextFilters.maxYear) params.set('maxYear', nextFilters.maxYear)
    if (nextFilters.minPrice) params.set('minPrice', nextFilters.minPrice)
    if (nextFilters.maxPrice) params.set('maxPrice', nextFilters.maxPrice)
    if (nextFilters.fuelTypes.length > 0) params.set('fuel', nextFilters.fuelTypes.join(','))
    if (nextFilters.transmissionTypes.length > 0) {
      params.set('transmission', nextFilters.transmissionTypes.join(','))
    }
    if (nextFilters.urgentOnly) params.set('urgent', 'true')
    const sortParam = toSortParam(nextFilters.sort)
    if (sortParam !== 'recent') params.set('sort', sortParam)
    if (nextPage && nextPage > 1) params.set('page', String(nextPage))

    startTransition(() => {
      router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname)
    })
  }

  const handleFilterChange = (partial: Partial<ListingsPageFilterState>) => {
    setLocalFilters((prev) => ({
      ...prev,
      ...partial
    }))
  }

  const handleApply = () => {
    applyFilters(localFilters, 1)
  }

  const handleClearFilters = () => {
    const reset: ListingsPageFilterState = {
      search: '',
      vehicleType: '',
      location: '',
      make: '',
      model: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      fuelTypes: [],
      transmissionTypes: [],
      urgentOnly: false,
      sort: 'recent'
    }
    setLocalFilters(reset)
    applyFilters(reset, 1)
  }

  const handleFuelToggle = (fuel: string) => {
    setLocalFilters((prev) => {
      const exists = prev.fuelTypes.includes(fuel)
      const nextFuelTypes = exists
        ? prev.fuelTypes.filter((f) => f !== fuel)
        : [...prev.fuelTypes, fuel]
      const nextState = { ...prev, fuelTypes: nextFuelTypes }
      return nextState
    })
  }

  const handleTransmissionToggle = (trans: string) => {
    setLocalFilters((prev) => {
      const exists = prev.transmissionTypes.includes(trans)
      const nextTypes = exists
        ? prev.transmissionTypes.filter((t) => t !== trans)
        : [...prev.transmissionTypes, trans]
      return { ...prev, transmissionTypes: nextTypes }
    })
  }

  const goToPage = (page: number) => {
    applyFilters(localFilters, page)
  }

  // Helper function to render the appropriate card based on promotion status
  const renderListingCard = (listing: ListingSummary) => {
    const listingData = {
      ...listing,
      user_id: listing.user_id ?? 'unknown',
      image_urls: listing.image_urls ?? [],
      year: listing.year ?? 0,
      location: listing.location ?? '',
      make: listing.make ?? '',
      model: listing.model ?? '',
      created_at: listing.created_at ?? new Date().toISOString(),
      views: 0
    }

    // Priority order: featured > top_spot > urgent > boosted > regular
    // Featured listings get special card styling (even if not in top 2 spots)
    if (listing.is_featured) {
      return (
        <FeaturedAdCard
          key={listing.id}
          promotionType="featured"
          listing={listingData}
        />
      )
    }
    
    if (listing.is_top_spot) {
      return (
        <TopSpotCard
          key={listing.id}
          listing={{
            ...listingData,
            is_top_spot: true
          } as any}
        />
      )
    }
    
    if (listing.is_urgent) {
      return (
        <UrgentListingCard
          key={listing.id}
          listing={{
            ...listingData,
            is_urgent: true
          } as any}
        />
      )
    }
    
    if (listing.is_boosted) {
      return (
        <BoostedCard
          key={listing.id}
          listing={{
            ...listingData,
            is_boosted: true
          } as any}
        />
      )
    }
    
    // Default to regular card
    return (
      <RegularAdCard
        key={listing.id}
        listing={listingData}
      />
    )
  }

  const activeFilterBadges = useMemo(() => {
    const badges: { label: string; onClear: () => void }[] = []
    if (localFilters.vehicleType) {
      badges.push({
        label: localFilters.vehicleType,
        onClear: () => handleFilterChange({ vehicleType: '', make: '', model: '' })
      })
    }
    if (localFilters.location) {
      badges.push({
        label: localFilters.location,
        onClear: () => handleFilterChange({ location: '' })
      })
    }
    if (localFilters.make) {
      badges.push({
        label: localFilters.make,
        onClear: () => handleFilterChange({ make: '', model: '' })
      })
    }
    if (localFilters.model) {
      badges.push({
        label: localFilters.model,
        onClear: () => handleFilterChange({ model: '' })
      })
    }
    if (localFilters.minYear || localFilters.maxYear) {
      badges.push({
        label: `Year ${localFilters.minYear || '—'}-${localFilters.maxYear || '—'}`,
        onClear: () => handleFilterChange({ minYear: '', maxYear: '' })
      })
    }
    if (localFilters.minPrice || localFilters.maxPrice) {
      badges.push({
        label: `Rs. ${localFilters.minPrice || '—'}-${localFilters.maxPrice || '—'}`,
        onClear: () => handleFilterChange({ minPrice: '', maxPrice: '' })
      })
    }
    if (localFilters.fuelTypes.length > 0) {
      badges.push({
        label: `Fuel: ${localFilters.fuelTypes.join(', ')}`,
        onClear: () => handleFilterChange({ fuelTypes: [] })
      })
    }
    if (localFilters.transmissionTypes.length > 0) {
      badges.push({
        label: `Transmission: ${localFilters.transmissionTypes.join(', ')}`,
        onClear: () => handleFilterChange({ transmissionTypes: [] })
      })
    }
    if (localFilters.urgentOnly) {
      badges.push({
        label: 'Urgent only',
        onClear: () => handleFilterChange({ urgentOnly: false })
      })
    }
    return badges
  }, [localFilters])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Vehicles</h1>
              <p className="mt-2 text-sm text-gray-600">
                Showing {pagination.total.toLocaleString()} vehicles
                {localFilters.vehicleType && (
                  <span className="ml-1 text-blue-600">
                    ({localFilters.vehicleType})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex w-full items-center gap-2 lg:w-auto lg:flex-1">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden px-3 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Open filters"
                >
                  <Filter size={16} />
                </button>

                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localFilters.search}
                    onChange={(event) => handleFilterChange({ search: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        applyFilters({ ...localFilters, search: event.currentTarget.value }, 1)
                      }
                    }}
                    placeholder="Search make, model, location..."
                    className="w-full px-6 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleApply}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                    aria-label="Search"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
              <Button variant="ghost" onClick={handleClearFilters} className="text-xs text-gray-500">
                Clear filters
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="hidden lg:block rounded-xl border border-gray-200 bg-gray-50 p-4 lg:p-5">
              <div className="space-y-5 text-sm text-gray-700">
                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Vehicle type</label>
                  <select
                    value={localFilters.vehicleType}
                    onChange={(event) =>
                      handleFilterChange({
                        vehicleType: event.target.value,
                        make: '',
                        model: ''
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All types</option>
                    {getVehicleCategories().map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <LocationFilter
                    selectedLocation={localFilters.location || null}
                    onLocationChange={(location) => handleFilterChange({ location: location || '' })}
                    expanded={locationExpanded}
                    onToggleExpand={() => setLocationExpanded(!locationExpanded)}
                    variant="listings"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Make</label>
                  <select
                    value={localFilters.make}
                    onChange={(event) =>
                      handleFilterChange({ make: event.target.value, model: '' })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={!localFilters.vehicleType}
                  >
                    <option value="">All makes</option>
                    {availableMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Model</label>
                  <select
                    value={localFilters.model}
                    onChange={(event) => handleFilterChange({ model: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={availableModels.length === 0}
                  >
                    <option value="">All models</option>
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block font-semibold text-gray-900">Min year</label>
                    <input
                      value={localFilters.minYear}
                      onChange={(event) => handleFilterChange({ minYear: event.target.value })}
                      type="number"
                      min={1950}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-semibold text-gray-900">Max year</label>
                    <input
                      value={localFilters.maxYear}
                      onChange={(event) => handleFilterChange({ maxYear: event.target.value })}
                      type="number"
                      min={1950}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block font-semibold text-gray-900">Min price</label>
                    <input
                      value={localFilters.minPrice}
                      onChange={(event) => handleFilterChange({ minPrice: event.target.value })}
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-semibold text-gray-900">Max price</label>
                    <input
                      value={localFilters.maxPrice}
                      onChange={(event) => handleFilterChange({ maxPrice: event.target.value })}
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Fuel type</label>
                  <div className="space-y-2">
                    {fuelOptions.map((fuel) => (
                      <label key={fuel} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={localFilters.fuelTypes.includes(fuel)}
                          onChange={() => handleFuelToggle(fuel)}
                        />
                        {fuel}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Transmission</label>
                  <div className="space-y-2">
                    {transmissionOptions.map((trans) => (
                      <label key={trans} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={localFilters.transmissionTypes.includes(trans)}
                          onChange={() => handleTransmissionToggle(trans)}
                        />
                        {trans}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgent-only"
                    checked={localFilters.urgentOnly}
                    onChange={(event) => handleFilterChange({ urgentOnly: event.target.checked })}
                  />
                  <label htmlFor="urgent-only" className="text-sm">
                    Urgent listings only
                  </label>
                </div>

                <div>
                  <label className="mb-2 block font-semibold text-gray-900">Sort by</label>
                  <select
                    value={localFilters.sort}
                    onChange={(event) =>
                      handleFilterChange({ sort: event.target.value as SortOption })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="recent">Most recent</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="year_new">Year: Newest first</option>
                    <option value="year_old">Year: Oldest first</option>
                    <option value="mileage_low">Mileage: Lowest first</option>
                  </select>
                </div>

                <Button className="w-full" onClick={handleApply}>
                  Apply filters
                </Button>
              </div>
            </aside>

            <section className="space-y-6">
              {activeFilterBadges.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3">
                  {activeFilterBadges.map((badge) => (
                    <span
                      key={badge.label}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {badge.label}
                      <button
                        onClick={badge.onClear}
                        className="text-blue-500 transition-colors hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {isPending && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Updating results…
                </div>
              )}

              {localFilters.search && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Showing results for <strong>{localFilters.search}</strong>
                </div>
              )}

              {/* Featured Listings - Always at the top (first 2 spots) */}
              {promoted.featured.length > 0 && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <h2 className="mb-3 text-lg font-semibold text-yellow-800 flex items-center gap-2">
                    <Star className="text-yellow-500 fill-yellow-500" size={16} />
                    Featured Listings
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {promoted.featured.slice(0, 2).map((listing) => (
                      <FeaturedAdCard
                        key={listing.id}
                        promotionType="featured"
                        listing={{
                          ...listing,
                          user_id: listing.user_id ?? 'unknown',
                          image_urls: listing.image_urls ?? []
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Promoted Sections - Only when vehicle type filter is applied */}
              {localFilters.vehicleType && (promoted.top_spot.length > 0 || promoted.boosted.length > 0 || promoted.urgent.length > 0) && (
                <div className="space-y-4">
                  {promoted.top_spot.length > 0 && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                      <h2 className="mb-3 text-lg font-semibold text-purple-800 flex items-center gap-2">
                        <Crown className="text-purple-500" size={16} />
                        Top Spot Listings
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {promoted.top_spot.map((listing) => (
                          <TopSpotCard
                            key={listing.id}
                            listing={{
                              ...listing,
                              is_top_spot: true,
                              user_id: listing.user_id ?? 'unknown',
                              image_urls: listing.image_urls ?? []
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {promoted.boosted.length > 0 && (
                <div className="rounded-xl border border-blue-200 bg-white p-4">
                  <h2 className="mb-3 text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <Zap className="text-blue-500" size={16} />
                    Boosted Listings
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {promoted.boosted.map((listing) => (
                      <BoostedCard
                        key={listing.id}
                        listing={{
                          ...listing,
                          is_boosted: true,
                          user_id: listing.user_id ?? 'unknown',
                          image_urls: listing.image_urls ?? []
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {promoted.urgent.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <h2 className="mb-3 text-lg font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="text-red-500" size={16} />
                    Urgent Deals
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {promoted.urgent.map((listing) => (
                      <UrgentListingCard
                        key={listing.id}
                        listing={{
                          ...listing,
                          is_urgent: true,
                          user_id: listing.user_id ?? 'unknown',
                          image_urls: listing.image_urls ?? []
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Main Listings */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 lg:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Vehicle Listings
                  </h2>
                  <span className="text-sm text-gray-500">
                    Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                  </span>
                </div>

                {listings.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                    <Search size={64} className="text-gray-300" />
                    <p className="mt-4 text-lg font-semibold text-gray-700">No vehicles found</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Try adjusting your filters or clearing them to see more results.
                    </p>
                    <Button className="mt-4" variant="outline" onClick={handleClearFilters}>
                      Reset filters
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {listings.map((listing) => renderListingCard(listing))}
                  </div>
                )}

                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <div className="text-sm text-gray-500">
                      {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}–
                      {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                      {pagination.total.toLocaleString()} vehicles
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={pagination.page === 1 || isPending}
                        onClick={() => goToPage(pagination.page - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {pagination.page} / {Math.max(pagination.totalPages, 1)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={pagination.page >= pagination.totalPages || isPending}
                        onClick={() => goToPage(pagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        category={localFilters.vehicleType}
        onCategoryChange={(category) => handleFilterChange({ vehicleType: category, make: '', model: '' })}
        selectedLocation={localFilters.location || null}
        onLocationChange={(location) => handleFilterChange({ location: location || '' })}
        make={localFilters.make || 'All Makes'}
        onMakeChange={(make) => handleFilterChange({ make: make === 'All Makes' ? '' : make, model: '' })}
        model={localFilters.model || 'All Models'}
        onModelChange={(model) => handleFilterChange({ model: model === 'All Models' ? '' : model })}
        minYear={localFilters.minYear}
        onMinYearChange={(year) => handleFilterChange({ minYear: year })}
        maxYear={localFilters.maxYear}
        onMaxYearChange={(year) => handleFilterChange({ maxYear: year })}
        minPrice={localFilters.minPrice}
        onMinPriceChange={(price) => handleFilterChange({ minPrice: price })}
        maxPrice={localFilters.maxPrice}
        onMaxPriceChange={(price) => handleFilterChange({ maxPrice: price })}
        fuelTypes={localFilters.fuelTypes}
        onFuelTypesChange={(fuels) => handleFilterChange({ fuelTypes: fuels })}
        transmissionTypes={localFilters.transmissionTypes}
        onTransmissionTypesChange={(transmissions) => handleFilterChange({ transmissionTypes: transmissions })}
        urgentOnly={localFilters.urgentOnly}
        onUrgentOnlyChange={(urgent) => handleFilterChange({ urgentOnly: urgent })}
        sortBy={toSortParam(localFilters.sort)}
        onSortByChange={(sort) => handleFilterChange({ sort: fromSortParam(sort) })}
      />
    </div>
  )
}

