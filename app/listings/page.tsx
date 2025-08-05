'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Types
type Listing = {
  id: string
  title: string
  description: string | null
  price: number
  make: string
  model: string
  year: number
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  location: string
  phone: string
  image_url: string | null
  image_urls: string[] | null
  is_featured: boolean
  created_at: string
}

// Sri Lankan locations
const SRI_LANKAN_LOCATIONS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 
  'Galle', 'Matara', 'Negombo', 'Kurunegala',
  'Anuradhapura', 'Jaffna'
]

// Popular car makes
const CAR_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda',
  'Suzuki', 'Mitsubishi', 'Hyundai', 'BMW',
  'Mercedes-Benz', 'Audi', 'Others'
]

// Model mapping
const MODELS_BY_MAKE: Record<string, string[]> = {
  'Toyota': ['Prius', 'Aqua', 'Corolla', 'Yaris', 'Vitz', 'Allion', 'Premio', 'Camry', 'CHR', 'Hilux'],
  'Honda': ['Civic', 'Fit', 'Vezel', 'Grace', 'City', 'CRV', 'HRV', 'Accord'],
  'Nissan': ['Leaf', 'March', 'Sunny', 'X-Trail', 'Tiida', 'Bluebird'],
  'Suzuki': ['Alto', 'Swift', 'WagonR', 'Celerio', 'Every'],
  'Mazda': ['Axela', 'Demio', 'CX-3', 'CX-5', 'Familia'],
  'Mitsubishi': ['Lancer', 'Montero', 'Outlander', 'Mirage'],
  'Hyundai': ['Elantra', 'Tucson', 'i20', 'Sonata'],
  'BMW': ['3 Series', '5 Series', 'X1', 'X3', 'X5'],
  'Mercedes-Benz': ['C Class', 'E Class', 'A Class', 'GLA'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5']
}

// All available models (flatten all models from all makes)
const ALL_MODELS = Object.values(MODELS_BY_MAKE).flat().sort()

// Animated placeholder texts
const PLACEHOLDER_TEXTS = [
  "Prius 2019",
  "Honda Civic in Kandy",
  "Alto 2015 Colombo"
]

export default function AdvancedListingsPage() {
  // State management
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDER_TEXTS[0])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  
  // Filters state
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedMakes, setSelectedMakes] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [fuelTypes, setFuelTypes] = useState<string[]>([])
  const [transmissionTypes, setTransmissionTypes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('recent')
  
  // UI state
  const [expandedFilters, setExpandedFilters] = useState({
    location: true,
    make: true,
    model: true,  // Change from false to true
    year: false,
    price: false,
    fuel: false,
    transmission: false
  })
  
  const [savedListings, setSavedListings] = useState<string[]>([])
  const [showAIGuide, setShowAIGuide] = useState(false)
  const [aiGuideContent, setAIGuideContent] = useState('')
  const [loadingAIGuide, setLoadingAIGuide] = useState(false)

  // Add these search states for filters
  const [locationSearch, setLocationSearch] = useState('')
  const [makeSearch, setMakeSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')

  // Carousel state
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({})
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  // Search input ref for focus
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Animated placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setPlaceholderText(PLACEHOLDER_TEXTS[placeholderIndex])
  }, [placeholderIndex])

  // Fetch listings
  useEffect(() => {
    fetchListings()
  }, [])

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters()
  }, [listings, searchTerm, selectedLocations, selectedMakes, selectedModels, 
      minYear, maxYear, minPrice, maxPrice, fuelTypes, transmissionTypes, sortBy])

  // Initialize image loading states
  useEffect(() => {
    const initialLoadingState: Record<string, boolean> = {}
    listings.forEach(listing => {
      if (listing.image_urls && listing.image_urls.length > 0) {
        initialLoadingState[listing.id] = true
      }
    })
    setImageLoading(initialLoadingState)
  }, [listings])

  // Generate AI guide when search changes
  useEffect(() => {
    if (searchTerm && (selectedMakes.length > 0 || searchTerm.length > 3)) {
      generateAIGuide()
    } else {
      setShowAIGuide(false)
    }
  }, [searchTerm, selectedMakes])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Process image URLs
      const processedListings = data?.map(listing => ({
        ...listing,
        image_urls: listing.image_urls || (listing.image_url ? [listing.image_url] : [])
      })) || []
      
      setListings(processedListings)
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...listings]

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(listing => 
        selectedLocations.some(loc => listing.location.toLowerCase().includes(loc.toLowerCase()))
      )
    }

    // Make filter
    if (selectedMakes.length > 0) {
      filtered = filtered.filter(listing => 
        selectedMakes.includes(listing.make)
      )
    }

    // Model filter
    if (selectedModels.length > 0) {
      filtered = filtered.filter(listing => 
        selectedModels.includes(listing.model)
      )
    }

    // Year filter
    if (minYear) {
      filtered = filtered.filter(listing => listing.year >= parseInt(minYear))
    }
    if (maxYear) {
      filtered = filtered.filter(listing => listing.year <= parseInt(maxYear))
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(listing => listing.price >= parseInt(minPrice))
    }
    if (maxPrice) {
      filtered = filtered.filter(listing => listing.price <= parseInt(maxPrice))
    }

    // Fuel type filter
    if (fuelTypes.length > 0) {
      filtered = filtered.filter(listing => 
        listing.fuel_type && fuelTypes.includes(listing.fuel_type)
      )
    }

    // Transmission filter
    if (transmissionTypes.length > 0) {
      filtered = filtered.filter(listing => 
        listing.transmission && transmissionTypes.includes(listing.transmission)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'year-new':
          return b.year - a.year
        case 'year-old':
          return a.year - b.year
        case 'mileage-low':
          return (a.mileage || 0) - (b.mileage || 0)
        default: // recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredListings(filtered)
  }

  const generateAIGuide = async () => {
    setLoadingAIGuide(true)
    setShowAIGuide(true)
    
    // Simulate AI generation (replace with actual API call)
    setTimeout(() => {
      const mockGuide = `
        <h3>AI Buying Guide for ${selectedMakes.join(', ') || searchTerm}</h3>
        <p><strong>Overview:</strong> These vehicles are known for reliability and fuel efficiency in Sri Lankan conditions.</p>
        <p><strong>Key Strengths:</strong></p>
        <ul>
          <li>Excellent fuel economy - ideal for daily commuting</li>
          <li>Low maintenance costs with readily available parts</li>
          <li>Good resale value in the local market</li>
        </ul>
        <p><strong>What to Inspect:</strong></p>
        <ul>
          <li>Service history and maintenance records</li>
          <li>Hybrid battery condition (if applicable)</li>
          <li>Suspension and tires for local road conditions</li>
        </ul>
        <p><strong>Common Issues:</strong> Check for proper AC functionality and electrical systems.</p>
        <p><em>Note: Always get an independent inspection before purchase.</em></p>
      `
      setAIGuideContent(mockGuide)
      setLoadingAIGuide(false)
    }, 1500)
  }

  const toggleFilter = (filterName: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }))
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedLocations([])
    setSelectedMakes([])
    setSelectedModels([])
    setMinYear('')
    setMaxYear('')
    setMinPrice('')
    setMaxPrice('')
    setFuelTypes([])
    setTransmissionTypes([])
    setSortBy('recent')
    // Clear filter searches
    setLocationSearch('')
    setMakeSearch('')
    setModelSearch('')
    
    // Clear localStorage cache
    localStorage.removeItem('vehiclePostDraft')
    localStorage.removeItem('listingsCache')
    localStorage.removeItem('userPreferences')
  }

  const toggleSavedListing = (listingId: string) => {
    setSavedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    )
  }

  const navigateImage = (listingId: string, direction: 'prev' | 'next', totalImages: number) => {
    setActiveImageIndex(prev => {
      const currentIndex = prev[listingId] || 0
      const newIndex = direction === 'prev' 
        ? (currentIndex - 1 + totalImages) % totalImages
        : (currentIndex + 1) % totalImages
      return { ...prev, [listingId]: newIndex }
    })
  }

  const getPageTitle = () => {
    if (selectedLocations.length > 0) {
      return `Cars for sale in ${selectedLocations.join(', ')}`
    }
    return 'Cars for sale in all of Sri Lanka'
  }




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">{getPageTitle()}</h1>
          
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholderText}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
              <span className="absolute right-4 top-3.5 text-gray-400">🔍</span>
            </div>
            <button 
              onClick={applyFilters}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              🔍 Search
            </button>
          </div>

          {/* Results count and sort */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Found <span className="font-semibold">{filteredListings.length}</span> vehicles
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recently Listed</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
              <option value="mileage-low">Mileage: Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-32">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Location Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('location')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Location
                  <span>{expandedFilters.location ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.location && (
                  <div className="mt-2">
                    {/* Search input for locations */}
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {SRI_LANKAN_LOCATIONS
                        .filter(location => 
                          location.toLowerCase().includes(locationSearch.toLowerCase())
                        )
                        .map(location => (
                          <label key={location} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLocations([...selectedLocations, location])
                                } else {
                                  setSelectedLocations(selectedLocations.filter(l => l !== location))
                                }
                              }}
                              className="mr-2 rounded"
                            />
                            <span className="text-sm">{location}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Make Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('make')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Make
                  <span>{expandedFilters.make ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.make && (
                  <div className="mt-2">
                    {/* Search input for makes */}
                    <input
                      type="text"
                      placeholder="Search makes..."
                      value={makeSearch}
                      onChange={(e) => setMakeSearch(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {CAR_MAKES
                        .filter(make => 
                          make.toLowerCase().includes(makeSearch.toLowerCase())
                        )
                        .map(make => (
                          <label key={make} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedMakes.includes(make)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMakes([...selectedMakes, make])
                                } else {
                                  const newSelectedMakes = selectedMakes.filter(m => m !== make)
                                  setSelectedMakes(newSelectedMakes)
                                  // Clear models that are no longer available
                                  if (newSelectedMakes.length === 0) {
                                    setSelectedModels([])
                                  } else {
                                    const availableModels = newSelectedMakes.flatMap(m => MODELS_BY_MAKE[m] || [])
                                    setSelectedModels(selectedModels.filter(model => availableModels.includes(model)))
                                  }
                                }
                              }}
                              className="mr-2 rounded"
                            />
                            <span className="text-sm">{make}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Model Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('model')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Model
                  <span>{expandedFilters.model ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.model && (
                  <div className="mt-2">
                    {/* Search input for models */}
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(selectedMakes.length > 0 
                        ? selectedMakes.flatMap(make => MODELS_BY_MAKE[make] || [])
                        : ALL_MODELS
                      )
                        .filter(model => 
                          model.toLowerCase().includes(modelSearch.toLowerCase())
                        )
                        .map(model => (
                          <label key={model} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedModels.includes(model)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedModels([...selectedModels, model])
                                } else {
                                  setSelectedModels(selectedModels.filter(m => m !== model))
                                }
                              }}
                              className="mr-2 rounded"
                            />
                            <span className="text-sm">{model}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            
              {/* Year Range Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('year')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Year
                  <span>{expandedFilters.year ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.year && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      placeholder="Min Year"
                      value={minYear}
                      onChange={(e) => setMinYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="1990"
                      max="2025"
                    />
                    <input
                      type="number"
                      placeholder="Max Year"
                      value={maxYear}
                      onChange={(e) => setMaxYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="1990"
                      max="2025"
                    />
                  </div>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('price')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Price (LKR)
                  <span>{expandedFilters.price ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.price && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Fuel Type Filter */}
              <div className="mb-4 border-b pb-4">
                <button
                  onClick={() => toggleFilter('fuel')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Fuel Type
                  <span>{expandedFilters.fuel ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.fuel && (
                  <div className="mt-2 space-y-2">
                    {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(fuel => (
                      <label key={fuel} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fuelTypes.includes(fuel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFuelTypes([...fuelTypes, fuel])
                            } else {
                              setFuelTypes(fuelTypes.filter(f => f !== fuel))
                            }
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm">{fuel}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Transmission Filter */}
              <div className="mb-4">
                <button
                  onClick={() => toggleFilter('transmission')}
                  className="flex justify-between items-center w-full py-2 text-left font-medium"
                >
                  Transmission
                  <span>{expandedFilters.transmission ? '▲' : '▼'}</span>
                </button>
                {expandedFilters.transmission && (
                  <div className="mt-2 space-y-2">
                    {['Automatic', 'Manual'].map(trans => (
                      <label key={trans} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={transmissionTypes.includes(trans)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTransmissionTypes([...transmissionTypes, trans])
                            } else {
                              setTransmissionTypes(transmissionTypes.filter(t => t !== trans))
                            }
                          }}
                          className="mr-2 rounded"
                        />
                        <span className="text-sm">{trans}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* AI Buying Guide */}
            {showAIGuide && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-4">
                  <span className="text-2xl mr-2">✨</span>
                  <h2 className="text-xl font-semibold text-blue-900">AI Buying Guide</h2>
                </div>
                {loadingAIGuide ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div 
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: aiGuideContent }}
                  />
                )}
              </div>
            )}

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => {
                  const images = listing.image_urls || []
                  const currentImageIndex = activeImageIndex[listing.id] || 0
                  const isSaved = savedListings.includes(listing.id)
                  
                  return (
                    <div key={listing.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      {/* Image Carousel */}
                      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden group">
                        {images.length > 0 ? (
                          <>
                            {!imageLoading[listing.id] && !imageError[listing.id] && (
                              <img
                              src={images[currentImageIndex]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                              onError={() => setImageError(prev => ({ ...prev, [listing.id]: true }))}
                            />
                            )}
                            {imageLoading[listing.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                              </div>
                            )}
                            {imageError[listing.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                                <span>Image failed to load</span>
                              </div>
                            )}
                            {images.length > 1 && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    navigateImage(listing.id, 'prev', images.length)
                                  }}
                                  aria-label={`Previous image (${currentImageIndex + 1} of ${images.length})`}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ◀
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    navigateImage(listing.id, 'next', images.length)
                                  }}
                                  aria-label={`Next image (${currentImageIndex + 1} of ${images.length})`}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ▶
                                </button>
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                  {currentImageIndex + 1}/{images.length}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                        
                        {/* Featured Badge */}
                        {listing.is_featured && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                            Featured
                          </div>
                        )}
                        
                        {/* Save Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            toggleSavedListing(listing.id)
                          }}
                          className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                        >
                          <span className={`text-xl ${isSaved ? 'text-red-500' : 'text-gray-600'}`}>
                            {isSaved ? '❤️' : '🤍'}
                          </span>
                        </button>
                      </div>
                      
                      {/* Listing Details */}
                      <Link href={`/listings/${listing.id}`} className="block p-4">
                        <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 mb-3">
                          Rs. {listing.price.toLocaleString()}
                        </p>
                        
                        {/* Key Specs */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{listing.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⛽</span>
                            <span>{listing.fuel_type || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🛣️</span>
                            <span>{listing.mileage?.toLocaleString() || 'N/A'} km</span>
                          </div>
                        </div>
                        
                        {/* Contact Button */}
                        <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Contact Dealer
                        </button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No vehicles found matching your criteria.</p>
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}