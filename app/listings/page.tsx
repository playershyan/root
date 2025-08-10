'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import LocationFilter from '@/app/components/LocationFilter'
import PriceDisplay from '@/app/components/PriceDisplay'
import FeaturedAdCard from '@/app/components/listings/FeaturedAdCard'
import RegularAdCard from '@/app/components/listings/RegularAdCard'
import PromotionBadges from '@/app/components/listings/PromotionBadges'
import { getVehicleCategories, getMakesByCategory, getModelsByMake, getCategoryInfo } from '@/lib/constants/vehicleData'
import { RotationService } from '@/lib/services/rotationService'
import { PromotionService, PromotedListing } from '@/lib/services/promotionService'

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
  pricing_type?: 'cash' | 'finance'
  monthly_payment?: number
  asking_price?: number
  negotiable?: boolean
  vehicle_type?: string
}




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
  
  // Promoted listings
  const [featuredAds, setFeaturedAds] = useState<PromotedListing[]>([])
  const [topSpotAds, setTopSpotAds] = useState<PromotedListing[]>([])
  const [boostedAds, setBoostedAds] = useState<PromotedListing[]>([])
  const [urgentAds, setUrgentAds] = useState<PromotedListing[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDER_TEXTS[0])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  
  // Filters state
  const [selectedVehicleCategory, setSelectedVehicleCategory] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedMakes, setSelectedMakes] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [fuelTypes, setFuelTypes] = useState<string[]>([])
  const [transmissionTypes, setTransmissionTypes] = useState<string[]>([])
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  
  // UI state
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    location: true,
    make: true,
    model: true,
    mobile: false
  })
  
  const [savedListings, setSavedListings] = useState<string[]>([])
  const [showAIGuide, setShowAIGuide] = useState(false)
  const [aiGuideContent, setAIGuideContent] = useState('')
  const [aiGuideDetailed, setAIGuideDetailed] = useState('')
  const [loadingAIGuide, setLoadingAIGuide] = useState(false)
  const [aiGuideExpanded, setAIGuideExpanded] = useState(false)

  // Search input states
  const [searchInput, setSearchInput] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')

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

  // Load promoted ads when category changes
  useEffect(() => {
    if (selectedVehicleCategory) {
      loadPromotedAds()
    }
  }, [selectedVehicleCategory])

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters()
  }, [listings, searchTerm, selectedVehicleCategory, selectedLocation, selectedMakes, selectedModels, 
      minYear, maxYear, minPrice, maxPrice, fuelTypes, transmissionTypes, sortBy, urgentOnly])
  
  // Clear make/model filters when vehicle category changes and auto-collapse category filter
  useEffect(() => {
    setSelectedMakes([])
    setSelectedModels([])
    // Auto-collapse category filter when a category is selected
    if (selectedVehicleCategory) {
      setExpandedFilters(prev => ({ ...prev, category: false }))
    }
  }, [selectedVehicleCategory])

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

  const loadPromotedAds = async () => {
    try {
      // Get rotated promoted ads for the selected category
      const [featured, topSpot, boosted, urgent] = await Promise.all([
        RotationService.getRotatedFeaturedAds(selectedVehicleCategory, 2),
        RotationService.getRotatedTopSpotAds(selectedVehicleCategory, 3),
        PromotionService.getPromotedListings('boost', selectedVehicleCategory, 10),
        PromotionService.getPromotedListings('urgent', selectedVehicleCategory, 10)
      ])

      setFeaturedAds(featured)
      setTopSpotAds(topSpot)
      setBoostedAds(boosted)
      setUrgentAds(urgent)

      // Track impressions for featured and top spot ads
      const impressionPromises = []
      featured.forEach(ad => {
        impressionPromises.push(RotationService.trackImpression(ad.id, 'featured'))
      })
      topSpot.forEach(ad => {
        impressionPromises.push(RotationService.trackImpression(ad.id, 'top_spot'))
      })
      await Promise.all(impressionPromises)

    } catch (error) {
      console.error('Error loading promoted ads:', error)
    }
  }

  const fetchListings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('is_sold', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Process image URLs and filter out promoted listings to avoid duplicates
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

    // Vehicle category filter
    if (selectedVehicleCategory) {
      filtered = filtered.filter(listing => 
        listing.vehicle_type === selectedVehicleCategory
      )
    }

    // Urgent filter
    if (urgentOnly) {
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes('urgent') || 
        listing.description?.toLowerCase().includes('urgent')
      )
    }

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
    if (selectedLocation) {
      filtered = filtered.filter(listing => 
        listing.location.toLowerCase().includes(selectedLocation.toLowerCase())
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
    
    try {
      // Create search context from selected filters and search term
      const searchContext = [
        searchTerm,
        ...selectedMakes,
        ...selectedModels,
        selectedLocation && `in ${selectedLocation}`
      ].filter(Boolean).join(' ') || 'vehicles'

      const response = await fetch('/api/generate-ai-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchContext: searchContext
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Store both compact and detailed content from the API response
      const compactContent = data.compact || ''
      const detailedContent = data.detailed || data.content || ''
      
      // If compact is empty but detailed exists, create a shorter version
      let finalCompact = compactContent
      if (!compactContent && detailedContent) {
        // Extract first paragraph and first few list items as compact version
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = detailedContent
        const paragraphs = tempDiv.querySelectorAll('p')
        const lists = tempDiv.querySelectorAll('ul, ol')
        
        let compactHTML = ''
        
        // Add disclaimer if it exists
        if (paragraphs[0]?.style.fontSize === '0.75rem') {
          compactHTML += paragraphs[0].outerHTML
          compactHTML += paragraphs[1]?.outerHTML || ''
        } else {
          compactHTML += paragraphs[0]?.outerHTML || ''
        }
        
        // Add first list with max 4 items
        if (lists[0]) {
          const listItems = lists[0].querySelectorAll('li')
          if (listItems.length > 0) {
            compactHTML += '<ul>'
            for (let i = 0; i < Math.min(4, listItems.length); i++) {
              compactHTML += listItems[i].outerHTML
            }
            compactHTML += '</ul>'
          }
        }
        
        finalCompact = compactHTML
      }
      
      setAIGuideContent(finalCompact)
      setAIGuideDetailed(detailedContent)
      
      // Reset expansion state for new content
      setAIGuideExpanded(false)
    } catch (error) {
      console.error('Error generating AI guide:', error)
      
      // Fallback content in case of API failure
      const fallbackCompact = `
        <p style="font-size: 0.75rem; font-style: italic; color: #666; margin-bottom: 1rem;">AI guide temporarily unavailable. Please try again later.</p>
        <h3>General Buying Tips for ${selectedMakes.join(', ') || searchTerm || 'Vehicles'}</h3>
        <p><strong>Essential Checks:</strong> Always inspect service history, test drive thoroughly, and verify legal documentation before purchase.</p>
      `
      const fallbackDetailed = `
        ${fallbackCompact}
        <p><strong>Smart Strategy:</strong> Research market prices, get independent inspection, and negotiate based on vehicle condition.</p>
        <p><strong>Documentation:</strong> Verify ownership papers, revenue license, and insurance validity.</p>
        <p><strong>Test Drive:</strong> Check engine performance, brakes, steering, and all electrical systems.</p>
      `
      setAIGuideContent(fallbackCompact)
      setAIGuideDetailed(fallbackDetailed)
      setAIGuideExpanded(false)
    } finally {
      setLoadingAIGuide(false)
    }
  }

  const toggleFilterExpand = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const handleLocationChange = (location: string | null) => {
    setSelectedLocation(location)
  }

  const handleMakeToggle = (make: string) => {
    setSelectedMakes(prev => 
      prev.includes(make)
        ? prev.filter(m => m !== make)
        : [...prev, make]
    )
  }

  const handleModelToggle = (model: string) => {
    setSelectedModels(prev =>
      prev.includes(model)
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }

  const getAvailableModels = () => {
    if (!selectedVehicleCategory) return []
    
    // If specific makes are selected, get models from those makes only
    if (selectedMakes.length > 0) {
      const models = new Set<string>()
      selectedMakes.forEach(makeName => {
        const makes = getMakesByCategory(selectedVehicleCategory)
        const make = makes.find(m => m.name === makeName)
        if (make) {
          make.models.forEach(model => models.add(model))
        }
      })
      return Array.from(models).sort()
    }
    
    // Otherwise get all models from the selected category
    const makes = getMakesByCategory(selectedVehicleCategory)
    const allModels = new Set<string>()
    makes.forEach(make => {
      make.models.forEach(model => allModels.add(model))
    })
    return Array.from(allModels).sort()
  }
  
  const getAvailableMakes = () => {
    if (!selectedVehicleCategory) return []
    return getMakesByCategory(selectedVehicleCategory).map(make => make.name)
  }

  // Handle manual search trigger (Enter or button click)
  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim())
  }, [searchInput])

  // Handle search on Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  const clearAllFilters = () => {
    setSearchTerm('')
    setSearchInput('')
    // Keep selectedVehicleCategory - don't clear it
    setSelectedLocation(null)
    setSelectedMakes([])
    setSelectedModels([])
    setMinYear('')
    setMaxYear('')
    setMinPrice('')
    setMaxPrice('')
    setFuelTypes([])
    setTransmissionTypes([])
    setSortBy('recent')
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
    const categoryInfo = selectedVehicleCategory ? getCategoryInfo(selectedVehicleCategory) : null
    const categoryLabel = categoryInfo ? categoryInfo.label : 'Vehicles'
    
    if (selectedLocation) {
      return `${categoryLabel} for sale in ${selectedLocation}`
    }
    return `${categoryLabel} for sale in all of Sri Lanka`
  }

  // Render filter content - reusable for both mobile and desktop (progressive loading)
  const renderFilterContent = () => (
    <>

      {/* Vehicle Category Filter - Always visible */}
      <div className="mb-6">
        <div 
          onClick={() => toggleFilterExpand('category')}
          className="flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">
              {selectedVehicleCategory ? 'Vehicle Category' : 'Choose Vehicle Category'}
            </span>
            {selectedVehicleCategory && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-xs font-medium text-yellow-700 border border-yellow-300">
                <i className={getCategoryInfo(selectedVehicleCategory)?.icon}></i>
                <span>{getCategoryInfo(selectedVehicleCategory)?.label}</span>
              </div>
            )}
          </div>
          <span className={`text-gray-400 text-sm transition-transform ${expandedFilters.category ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
        <div className={`mt-3 overflow-hidden transition-all duration-300 ${expandedFilters.category ? 'max-h-[800px]' : 'max-h-0'}`}>
          <div 
            className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#9CA3AF #F3F4F6'
            }}
          >
            {selectedVehicleCategory && (
              <button
                onClick={() => setSelectedVehicleCategory('')}
                className="w-full text-left py-2 px-3 rounded text-sm border border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-600"
              >
                <i className="fas fa-times mr-2"></i>
                Clear Category Selection
              </button>
            )}
            {getVehicleCategories().map(category => (
              <label 
                key={category.value}
                className={`block py-2 px-3 rounded cursor-pointer hover:bg-blue-50 text-sm border ${
                  selectedVehicleCategory === category.value ? 'bg-yellow-50 font-semibold text-yellow-700 border-yellow-300' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="vehicleCategory"
                  checked={selectedVehicleCategory === category.value}
                  onChange={() => setSelectedVehicleCategory(category.value)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <i className={category.icon}></i>
                  <div>
                    <div>{category.label}</div>
                    <div className="text-xs text-gray-500">{category.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Show message when no category is selected */}
      {!selectedVehicleCategory && (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-arrow-up text-2xl mb-2"></i>
          <p className="text-sm">Please select a vehicle category above to see relevant filters</p>
        </div>
      )}

      {/* Category-specific filters - Only show when category is selected */}
      {selectedVehicleCategory && (
        <>
          {/* Sort By */}
          <div className="mb-6 border-b pb-4">
            <label htmlFor="sort-filter" className="block font-semibold text-gray-700 text-sm mb-2">
              Sort by
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
              <option value="mileage-low">Mileage: Lowest First</option>
            </select>
          </div>

          {/* Urgent Filter */}
          <div className="mb-6 border-b pb-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={urgentOnly}
                onChange={(e) => setUrgentOnly(e.target.checked)}
                className="w-4 h-4 text-orange-500 bg-gray-100 border-gray-300 rounded focus:ring-orange-400 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-orange-600">
                <i className="fas fa-star mr-1"></i>
                Urgent listings only
              </span>
            </label>
          </div>

          {/* Location Filter */}
          <LocationFilter
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            expanded={expandedFilters.location}
            onToggleExpand={() => toggleFilterExpand('location')}
            variant="listings"
          />

          {/* Make Filter */}
          <div className="mb-6">
            <div 
              onClick={() => toggleFilterExpand('make')}
              className="flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
            >
              <span className="font-semibold text-gray-700">Make</span>
              <span className={`text-gray-400 text-sm transition-transform ${expandedFilters.make ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
            <div className={`mt-3 space-y-2 overflow-hidden transition-all ${expandedFilters.make ? 'max-h-64' : 'max-h-0'}`}>
              <input 
                type="text" 
                placeholder="Search makes..."
                className="w-full px-3 py-2 border rounded-md text-sm mb-2"
              />
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {getAvailableMakes().map(make => (
                  <label 
                    key={make}
                    className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                      selectedMakes.includes(make) ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMakes.includes(make)}
                      onChange={() => handleMakeToggle(make)}
                      className="sr-only"
                    />
                    {make}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Model Filter */}
          <div className="mb-4">
              <div 
                onClick={() => toggleFilterExpand('model')}
                className="flex justify-between items-center cursor-pointer py-1.5 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <span className="font-semibold text-gray-700 text-sm">Model</span>
                <span className={`text-gray-400 text-xs transition-transform ${expandedFilters.model ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`mt-2 space-y-1.5 overflow-hidden transition-all ${expandedFilters.model ? 'max-h-48' : 'max-h-0'}`}>
                <input 
                  type="text" 
                  placeholder="Search models..."
                  className="w-full px-2 py-1.5 border rounded-md text-xs mb-2"
                />
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {getAvailableModels().map(model => (
                    <label 
                      key={model}
                      className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                        selectedModels.includes(model) ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model)}
                        onChange={() => handleModelToggle(model)}
                        className="sr-only"
                      />
                      {model}
                    </label>
                  ))}
                </div>
              </div>
            </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Price Range (LKR)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min (LKR)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
              <input
                type="number"
                placeholder="Max (LKR)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
            </div>
          </div>

          {/* Year Range */}
          <div className="mb-4">
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Year Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="From year"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
              <input
                type="number"
                placeholder="To year"
                value={maxYear}
                onChange={(e) => setMaxYear(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
            </div>
          </div>

          {/* Fuel Type - Only show for vehicles that have fuel type */}
          {!['bicycle'].includes(selectedVehicleCategory) && (
            <div className="mb-4">
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Fuel Type</label>
              <div className="space-y-1.5">
                {['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG'].map(fuel => (
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
                      className="mr-2"
                    />
                    <span className="text-xs">{fuel}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Transmission - Only show for vehicles that have transmission */}
          {!['bicycle'].includes(selectedVehicleCategory) && (
            <div>
              <label className="font-semibold text-gray-700 block mb-2 text-sm">Transmission</label>
              <div className="space-y-1.5">
                {['Automatic', 'Manual', 'CVT', 'Tiptronic'].map(trans => (
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
                      className="mr-2"
                    />
                    <span className="text-xs">{trans}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mb-4">
            <div className="flex gap-2">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, mobile: true }))}
                className="lg:hidden px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm relative"
              >
                <i className="fas fa-filter"></i>
                <span>Filters</span>
                {(() => {
                  const filterCount = [selectedLocation, ...selectedMakes, ...selectedModels, minPrice && 'Min Price', maxPrice && 'Max Price', minYear && 'Min Year', maxYear && 'Max Year', ...fuelTypes, ...transmissionTypes].filter(Boolean).length;
                  return filterCount > 0 ? (
                    <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                      {filterCount}
                    </span>
                  ) : null;
                })()}
              </button>
              
              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  placeholder={placeholderText}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-1 top-1 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <i className="fas fa-search text-sm"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-gray-600 text-sm">
            {filteredListings.length} vehicles found
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-3 sticky top-20">
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <button 
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                >
                  Clear all
                </button>
              </div>

              {renderFilterContent()}
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {/* AI Buying Guide */}
            {showAIGuide && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <i className="fas fa-magic text-xl mr-2 text-blue-600"></i>
                  <h2 className="text-xl font-semibold text-blue-900">AI Buying Guide</h2>
                </div>
                
                {/* Disclaimer */}
                <p className="text-xs italic text-gray-500 mb-4 leading-relaxed">
                  Disclaimer: This is AI-generated content and may contain inaccuracies. Always verify information independently. 
                  Details may not apply to all grades, generations, or model variants. By using this information, you agree to our 
                  terms and conditions and acknowledge that all purchasing decisions are your responsibility.
                </p>
                
                {loadingAIGuide ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-blue-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <div>
                    {/* Brief Overview - Always Shown */}
                    <div 
                      className="text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: aiGuideContent }}
                    />
                    
                    {/* See More/See Less Button - Only show if we have detailed content */}
                    {aiGuideDetailed && aiGuideDetailed !== aiGuideContent && (
                      <>
                        <div className="mt-4">
                          <button
                            onClick={() => setAIGuideExpanded(!aiGuideExpanded)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                          >
                            {aiGuideExpanded ? (
                              <>
                                <i className="fas fa-chevron-up"></i>
                                See Less
                              </>
                            ) : (
                              <>
                                <i className="fas fa-chevron-down"></i>
                                See More
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Detailed Content - Shown when expanded */}
                        {aiGuideExpanded && (
                          <>
                            <div 
                              className="mt-4 text-gray-700 prose prose-sm max-w-none border-t border-blue-200 pt-4"
                              dangerouslySetInnerHTML={{ 
                                __html: aiGuideDetailed.replace(aiGuideContent, '').trim() || aiGuideDetailed 
                              }}
                            />
                            
                            {/* See Less Button at Bottom */}
                            <div className="mt-4 pt-4 border-t border-blue-100">
                              <button
                                onClick={() => setAIGuideExpanded(false)}
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm bg-white px-3 py-2 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                              >
                                <i className="fas fa-chevron-up"></i>
                                See Less
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Featured Ads Section */}
            {selectedVehicleCategory && featuredAds.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Featured</h2>
                  <PromotionBadges.Featured />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredAds.map((ad) => (
                    <FeaturedAdCard
                      key={ad.id}
                      listing={ad}
                      promotionType="featured"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Top Spot Ads Section */}
            {selectedVehicleCategory && topSpotAds.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Top Spot</h2>
                  <PromotionBadges.TopSpot />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {topSpotAds.map((ad) => (
                    <FeaturedAdCard
                      key={ad.id}
                      listing={ad}
                      promotionType="top_spot"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Listings Section */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedVehicleCategory ? 'All Listings' : 'Recent Listings'}
              </h2>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading vehicles...</p>
              </div>
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Mix promoted ads (urgent/boosted) with regular ads */}
                {[
                  ...urgentAds.map(ad => ({ ...ad, isPromoted: true, promotionType: 'urgent' })),
                  ...boostedAds.map(ad => ({ ...ad, isPromoted: true, promotionType: 'boost' })),
                  ...filteredListings.map(ad => ({ ...ad, isPromoted: false }))
                ].map((listing) => {
                  const images = listing.image_urls || []
                  const currentImageIndex = activeImageIndex[listing.id] || 0
                  const isSaved = savedListings.includes(listing.id)
                  
                  // Use RegularAdCard for promoted and regular listings
                  return (
                    <RegularAdCard
                      key={listing.id}
                      listing={listing}
                      showPromotionBadge={true}
                      activeImageIndex={currentImageIndex}
                      onImageNavigate={(direction) => navigateImage(listing.id, direction, images.length)}
                      isSaved={isSaved}
                      onToggleSaved={() => toggleSavedListing(listing.id)}
                      imageLoading={imageLoading[listing.id]}
                      imageError={imageError[listing.id]}
                      onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                      onImageError={() => setImageError(prev => ({ ...prev, [listing.id]: true }))}
                    />
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

      {/* Mobile Filter Panel */}
      {expandedFilters.mobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  {(() => {
                    const filterCount = [selectedLocation, ...selectedMakes, ...selectedModels, minPrice && 'Min Price', maxPrice && 'Max Price', minYear && 'Min Year', maxYear && 'Max Year', ...fuelTypes, ...transmissionTypes].filter(Boolean).length;
                    return filterCount > 0 ? (
                      <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full border border-blue-200">
                        {filterCount} applied
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm font-medium">
                        None applied
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setExpandedFilters(prev => ({ ...prev, mobile: false }))}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50"
                >
                  <i className="fas fa-trash-alt mr-1"></i>
                  Clear all filters
                </button>
              </div>
            </div>
            <div className="p-4">
              {renderFilterContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}