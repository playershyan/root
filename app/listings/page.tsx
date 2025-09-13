'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'

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
  is_urgent?: boolean
  urgent_until?: string
  created_at: string
  pricing_type?: 'cash' | 'finance'
  monthly_payment?: number
  asking_price?: number
  negotiable?: boolean
  vehicle_type?: string
}




// Animated placeholder texts
const PLACEHOLDER_TEXTS = [
  "Toyota Prius 2019",
  "Honda Civic Kandy",
  "Suzuki Alto 2015"
]

export default function AdvancedListingsPage() {
  // Hooks
  const { getAIToken } = useRecaptcha()
  const searchParams = useSearchParams()
  
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
  const [selectedMake, setSelectedMake] = useState<string>('All Makes')
  const [selectedModel, setSelectedModel] = useState<string>('All Models')
  const [minYear, setMinYear] = useState('')
  const [maxYear, setMaxYear] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  // Temporary states for price and year inputs
  const [tempMinPrice, setTempMinPrice] = useState('')
  const [tempMaxPrice, setTempMaxPrice] = useState('')
  const [tempMinYear, setTempMinYear] = useState('')
  const [tempMaxYear, setTempMaxYear] = useState('')
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
  const [makeSearchTerm, setMakeSearchTerm] = useState('')
  const [modelSearchTerm, setModelSearchTerm] = useState('')
  
  const [savedListings, setSavedListings] = useState<string[]>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoriteListings')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
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
  const initializedFromQueryRef = useRef(false)

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

  // Initialize from URL query param q
  useEffect(() => {
    if (initializedFromQueryRef.current) return
    const q = searchParams?.get('q')
    if (q && typeof q === 'string' && q.trim()) {
      setSearchInput(q)
      setSearchTerm(q)
      initializedFromQueryRef.current = true
    }
  }, [searchParams])

  // Fetch listings
  useEffect(() => {
    fetchListings()
  }, [])

  // Initialize temporary values
  useEffect(() => {
    setTempMinPrice(minPrice)
    setTempMaxPrice(maxPrice)
    setTempMinYear(minYear)
    setTempMaxYear(maxYear)
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
  }, [listings, searchTerm, selectedVehicleCategory, selectedLocation, selectedMake, selectedModel, 
      minYear, maxYear, minPrice, maxPrice, fuelTypes, transmissionTypes, sortBy, urgentOnly])
  
  // Clear make/model filters when vehicle category changes and auto-collapse category filter
  useEffect(() => {
    setSelectedMake('All Makes')
    setSelectedModel('All Models')
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

  // Generate AI guide when search changes with debouncing
  useEffect(() => {
    // Debounce the AI guide generation to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      if (searchTerm && (selectedMake !== 'All Makes' || searchTerm.length > 3)) {
        generateAIGuide()
      } else {
        setShowAIGuide(false)
      }
    }, 500) // Wait 500ms after user stops typing
    
    // Cleanup function to cancel the timer if dependencies change
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, selectedMake])

  const loadPromotedAds = async () => {
    try {
      // Get rotated promoted ads for the selected category
      const [featuredRes, topSpotRes, boostedRes, urgentRes] = await Promise.all([
        RotationService.getRotatedFeaturedAds(selectedVehicleCategory, 2),
        RotationService.getRotatedTopSpotAds(selectedVehicleCategory, 3),
        PromotionService.getBoostedListings(selectedVehicleCategory, 10),
        PromotionService.getUrgentListings(selectedVehicleCategory, 10)
      ])

      // Robust data extraction with type checking
      const extractArrayFromResponse = (response: any): PromotedListing[] => {
        if (!response) return []
        if (Array.isArray(response)) return response
        if (response.data && Array.isArray(response.data)) return response.data
        if (response.error) {
          console.error('Service error:', response.error)
          return []
        }
        return []
      }

      const featured = extractArrayFromResponse(featuredRes)
      const topSpot = extractArrayFromResponse(topSpotRes)
      const boosted = extractArrayFromResponse(boostedRes)
      const urgent = extractArrayFromResponse(urgentRes)

      // Additional safety check before setting state
      setFeaturedAds(Array.isArray(featured) ? featured : [])
      setTopSpotAds(Array.isArray(topSpot) ? topSpot : [])
      setBoostedAds(Array.isArray(boosted) ? boosted : [])
      setUrgentAds(Array.isArray(urgent) ? urgent : [])

      // Debug logging (remove in production)
      console.log('Promoted ads loaded:', {
        featured: featured.length,
        topSpot: topSpot.length,
        boosted: boosted.length,
        urgent: urgent.length
      })

      // Note: Impression tracking will be implemented later
      // For now, we just load the promoted ads without tracking impressions

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
        .eq('status', 'active')
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

    // Urgent filter - check for paid urgent promotion
    if (urgentOnly) {
      filtered = filtered.filter(listing => 
        listing.is_urgent === true
      )
    }

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.year.toString().includes(searchTerm.toLowerCase())
      )
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(listing => 
        listing.location.toLowerCase().includes(selectedLocation.toLowerCase())
      )
    }

    // Make filter
    if (selectedMake && selectedMake !== 'All Makes') {
      filtered = filtered.filter(listing => 
        listing.make === selectedMake
      )
    }

    // Model filter
    if (selectedModel && selectedModel !== 'All Models') {
      filtered = filtered.filter(listing => 
        listing.model === selectedModel
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
        selectedMake !== 'All Makes' ? selectedMake : '',
        selectedModel !== 'All Models' ? selectedModel : '',
        selectedLocation && `in ${selectedLocation}`
      ].filter(Boolean).join(' ') || 'vehicles'

      // Get reCAPTCHA token before making the request
      const recaptchaToken = await getAIToken()

      const response = await fetch('/api/generate-ai-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchContext: searchContext,
          recaptchaToken
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
        <h3>General Buying Tips for ${selectedMake !== 'All Makes' ? selectedMake : (searchTerm || 'Vehicles')}</h3>
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
    setSelectedMake(prev => {
      const newMake = prev === make ? 'All Makes' : make
      // Reset model when make changes
      if (newMake !== prev) {
        setSelectedModel('All Models')
      }
      return newMake
    })
  }

  const handleModelToggle = (model: string) => {
    setSelectedModel(prev =>
      prev === model ? 'All Models' : model
    )
  }

  const getAvailableModels = () => {
    if (!selectedVehicleCategory) return []
    
    // If a specific make is selected, get models from that make only
    if (selectedMake && selectedMake !== 'All Makes') {
      const makes = getMakesByCategory(selectedVehicleCategory)
      const make = makes.find(m => m.name === selectedMake)
      if (make) {
        return make.models.sort()
      }
      return []
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

  const getFilteredMakes = () => {
    const availableMakes = getAvailableMakes()
    if (!makeSearchTerm) return availableMakes
    return availableMakes.filter(make => 
      make.toLowerCase().includes(makeSearchTerm.toLowerCase())
    )
  }

  const getFilteredModels = () => {
    const availableModels = getAvailableModels()
    if (!modelSearchTerm) return availableModels
    return availableModels.filter(model => 
      model.toLowerCase().includes(modelSearchTerm.toLowerCase())
    )
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
    setSelectedMake('All Makes')
    setSelectedModel('All Models')
    setMinYear('')
    setMaxYear('')
    setMinPrice('')
    setMaxPrice('')
    setTempMinYear('')
    setTempMaxYear('')
    setTempMinPrice('')
    setTempMaxPrice('')
    setFuelTypes([])
    setTransmissionTypes([])
    setSortBy('recent')
  }

  const toggleSavedListing = (listingId: string) => {
    setSavedListings(prev => {
      const newSaved = prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
      
      // Save to localStorage
      localStorage.setItem('favoriteListings', JSON.stringify(newSaved))
      
      // Also save full listing data for the profile page
      if (newSaved.includes(listingId) && !prev.includes(listingId)) {
        // Adding to favorites - save full listing data
        const listing = [...listings, ...filteredListings, ...topSpotAds, ...boostedAds, ...urgentAds]
          .find(l => l.id === listingId)
        
        if (listing) {
          const favoriteListingsData = JSON.parse(localStorage.getItem('favoriteListingsData') || '[]')
          const favoriteData = {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            location: listing.location,
            image: listing.image_urls?.[0] || listing.image || '',
            postedDate: listing.posted_at || new Date().toISOString(),
            make: listing.make,
            model: listing.model,
            year: listing.year,
            mileage: listing.mileage,
            description: listing.description || ''
          }
          
          // Add if not already present
          if (!favoriteListingsData.find((f: any) => f.id === listingId)) {
            favoriteListingsData.push(favoriteData)
            localStorage.setItem('favoriteListingsData', JSON.stringify(favoriteListingsData))
          }
        }
      } else if (!newSaved.includes(listingId) && prev.includes(listingId)) {
        // Removing from favorites - remove full listing data
        const favoriteListingsData = JSON.parse(localStorage.getItem('favoriteListingsData') || '[]')
        const filtered = favoriteListingsData.filter((f: any) => f.id !== listingId)
        localStorage.setItem('favoriteListingsData', JSON.stringify(filtered))
      }
      
      return newSaved
    })
  }

  const applyPriceRange = () => {
    setMinPrice(tempMinPrice)
    setMaxPrice(tempMaxPrice)
  }

  const applyYearRange = () => {
    setMinYear(tempMinYear)
    setMaxYear(tempMaxYear)
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
              <div className="relative mb-2">
                <input 
                  type="text" 
                  placeholder="Search makes..."
                  value={makeSearchTerm}
                  onChange={(e) => setMakeSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border rounded-md text-sm"
                />
                {makeSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setMakeSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {/* All Makes Option */}
                <label 
                  className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs border-b border-gray-200 mb-1 ${
                    selectedMake === 'All Makes' ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                  }`}
                >
                  <input
                    type="radio"
                    checked={selectedMake === 'All Makes'}
                    onChange={() => handleMakeToggle('All Makes')}
                    className="sr-only"
                  />
                  🚗 All Makes
                </label>
                
                {getFilteredMakes().map(make => (
                  <label 
                    key={make}
                    className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                      selectedMake === make ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selectedMake === make}
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
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    placeholder="Search models..."
                    value={modelSearchTerm}
                    onChange={(e) => setModelSearchTerm(e.target.value)}
                    className="w-full px-2 py-1.5 pr-8 border rounded-md text-xs"
                  />
                  {modelSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setModelSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {/* All Models Option */}
                  <label 
                    className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs border-b border-gray-200 mb-1 ${
                      selectedModel === 'All Models' ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selectedModel === 'All Models'}
                      onChange={() => handleModelToggle('All Models')}
                      className="sr-only"
                    />
                    🚗 All Models
                  </label>
                  
                  {getFilteredModels().map(model => (
                    <label 
                      key={model}
                      className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                        selectedModel === model ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        checked={selectedModel === model}
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
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                placeholder="Min (LKR)"
                value={tempMinPrice}
                onChange={(e) => setTempMinPrice(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
              <input
                type="number"
                placeholder="Max (LKR)"
                value={tempMaxPrice}
                onChange={(e) => setTempMaxPrice(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
            </div>
            <button
              onClick={applyPriceRange}
              className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-400 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Apply Price Range
            </button>
            {(minPrice || maxPrice) && (
              <div className="mt-2 text-xs text-gray-600">
                Active: {minPrice && `Min: Rs. ${parseInt(minPrice).toLocaleString()}`} 
                {minPrice && maxPrice && ' - '}
                {maxPrice && `Max: Rs. ${parseInt(maxPrice).toLocaleString()}`}
              </div>
            )}
          </div>

          {/* Year Range */}
          <div className="mb-4">
            <label className="font-semibold text-gray-700 block mb-2 text-sm">Year Range</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                placeholder="From year"
                value={tempMinYear}
                onChange={(e) => setTempMinYear(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
              <input
                type="number"
                placeholder="To year"
                value={tempMaxYear}
                onChange={(e) => setTempMaxYear(e.target.value)}
                className="px-2 py-1.5 border rounded-md text-xs"
              />
            </div>
            <button
              onClick={applyYearRange}
              className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-400 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Apply Year Range
            </button>
            {(minYear || maxYear) && (
              <div className="mt-2 text-xs text-gray-600">
                Active: {minYear && `From: ${minYear}`} 
                {minYear && maxYear && ' - '}
                {maxYear && `To: ${maxYear}`}
              </div>
            )}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Found {filteredListings.length} vehicles
                {selectedVehicleCategory && ` in ${getCategoryInfo(selectedVehicleCategory)?.label}`}
                {selectedLocation && ` in ${selectedLocation}`}
              </p>
            </div>
            
            {/* Quick search section */}
            <div className="w-full lg:w-96">
              <div className="flex gap-2">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setExpandedFilters(prev => ({ ...prev, mobile: true }))}
                  className="lg:hidden px-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                  aria-label="Open filters"
                >
                  <i className="fas fa-filter"></i>
                </button>
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholderText}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <i className="fas fa-search text-sm"></i>
                  </button>
                </div>
              </div>
              
              {/* Quick clear filters button */}
              {(searchTerm || selectedMake !== 'All Makes' || selectedModel !== 'All Models' || selectedLocation || minPrice || maxPrice || minYear || maxYear) && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <i className="fas fa-times mr-1"></i>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              {renderFilterContent()}
            </div>
          </div>
          
          {/* Listings Content */}
          <div className="col-span-1 lg:col-span-3">
            {/* AI Guide Section */}
            {showAIGuide && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    {loadingAIGuide ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <i className="fas fa-robot text-white text-sm"></i>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">
                        🤖 AI Buying Guide
                        {searchTerm && <span className="text-blue-600"> for "{searchTerm}"</span>}
                      </h3>
                      <button
                        onClick={() => setShowAIGuide(false)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    {loadingAIGuide ? (
                      <div className="text-sm text-gray-600">
                        Generating personalized buying guide...
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div 
                          dangerouslySetInnerHTML={{ 
                            __html: aiGuideExpanded ? aiGuideDetailed : aiGuideContent 
                          }} 
                        />
                        
                        {aiGuideDetailed && aiGuideDetailed !== aiGuideContent && (
                          <div className="mt-3">
                            <button
                              onClick={() => setAIGuideExpanded(!aiGuideExpanded)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
                            >
                              {aiGuideExpanded ? (
                                <>
                                  <i className="fas fa-chevron-up"></i>
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-chevron-down"></i>
                                  Show More Details
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Promoted Listings Section */}
            {selectedVehicleCategory && (
              <>
                {/* Featured Ads */}
                {featuredAds.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-star text-yellow-500"></i>
                        Featured Listings
                      </h2>
                      {/* PromotionBadges component props need to be verified */}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {featuredAds.map(listing => (
                        <FeaturedAdCard
                          key={listing.id}
                          listing={listing}
                          promotionType="featured"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Spot Ads */}
                {topSpotAds.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-trophy text-orange-500"></i>
                        Top Spot
                      </h2>
                      {/* PromotionBadges component props need to be verified */}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {topSpotAds.map(listing => (
                        <RegularAdCard
                          key={listing.id}
                          listing={listing}
                          isSaved={savedListings.includes(listing.id)}
                          onToggleSaved={() => toggleSavedListing(listing.id)}
                          activeImageIndex={activeImageIndex[listing.id] || 0}
                          onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                          imageLoading={imageLoading[listing.id] || false}
                          imageError={imageError[listing.id] || false}
                          onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                          onImageError={() => {
                            setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                            setImageError(prev => ({ ...prev, [listing.id]: true }))
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Vehicle Listings</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  {filteredListings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-xl mb-2">No vehicles found</p>
                      <p>Try adjusting your search filters</p>
                      <button
                        onClick={clearAllFilters}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 text-sm text-gray-600">
                        Showing {filteredListings.length} vehicles
                      </div>
                      
                      {/* Mix in boosted and urgent ads with regular listings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Show first few regular listings */}
                        {filteredListings.slice(0, 4).map((listing) => (
                          <RegularAdCard
                            key={listing.id}
                            listing={listing}
                            isSaved={savedListings.includes(listing.id)}
                            onToggleSaved={() => toggleSavedListing(listing.id)}
                            activeImageIndex={activeImageIndex[listing.id] || 0}
                            onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                            imageLoading={imageLoading[listing.id] || false}
                            imageError={imageError[listing.id] || false}
                            onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                            onImageError={() => {
                              setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                              setImageError(prev => ({ ...prev, [listing.id]: true }))
                            }}
                          />
                        ))}

                        {/* Mix in boosted ads */}
                        {boostedAds.slice(0, 2).map(listing => (
                          <RegularAdCard
                            key={`boosted-${listing.id}`}
                            listing={listing}
                            isSaved={savedListings.includes(listing.id)}
                            onToggleSaved={() => toggleSavedListing(listing.id)}
                            activeImageIndex={activeImageIndex[listing.id] || 0}
                            onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                            imageLoading={imageLoading[listing.id] || false}
                            imageError={imageError[listing.id] || false}
                            onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                            onImageError={() => {
                              setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                              setImageError(prev => ({ ...prev, [listing.id]: true }))
                            }}
                          />
                        ))}

                        {/* Continue with more regular listings */}
                        {filteredListings.slice(4, 8).map((listing) => (
                          <RegularAdCard
                            key={listing.id}
                            listing={listing}
                            isSaved={savedListings.includes(listing.id)}
                            onToggleSaved={() => toggleSavedListing(listing.id)}
                            activeImageIndex={activeImageIndex[listing.id] || 0}
                            onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                            imageLoading={imageLoading[listing.id] || false}
                            imageError={imageError[listing.id] || false}
                            onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                            onImageError={() => {
                              setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                              setImageError(prev => ({ ...prev, [listing.id]: true }))
                            }}
                          />
                        ))}

                        {/* Mix in urgent ads */}
                        {urgentAds.slice(0, 2).map(listing => (
                          <RegularAdCard
                            key={`urgent-${listing.id}`}
                            listing={listing}
                            isSaved={savedListings.includes(listing.id)}
                            onToggleSaved={() => toggleSavedListing(listing.id)}
                            activeImageIndex={activeImageIndex[listing.id] || 0}
                            onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                            imageLoading={imageLoading[listing.id] || false}
                            imageError={imageError[listing.id] || false}
                            onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                            onImageError={() => {
                              setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                              setImageError(prev => ({ ...prev, [listing.id]: true }))
                            }}
                          />
                        ))}

                        {/* Rest of the regular listings */}
                        {filteredListings.slice(8).map((listing) => (
                          <RegularAdCard
                            key={listing.id}
                            listing={listing}
                            isSaved={savedListings.includes(listing.id)}
                            onToggleSaved={() => toggleSavedListing(listing.id)}
                            activeImageIndex={activeImageIndex[listing.id] || 0}
                            onImageNavigate={(direction: 'prev' | 'next') => navigateImage(listing.id, direction, listing.image_urls?.length || 1)}
                            imageLoading={imageLoading[listing.id] || false}
                            imageError={imageError[listing.id] || false}
                            onImageLoad={() => setImageLoading(prev => ({ ...prev, [listing.id]: false }))}
                            onImageError={() => {
                              setImageLoading(prev => ({ ...prev, [listing.id]: false }))
                              setImageError(prev => ({ ...prev, [listing.id]: true }))
                            }}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      {expandedFilters.mobile && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, mobile: false }))}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600">
                  {(() => {
                    const activeFilters = [
                      selectedVehicleCategory,
                      selectedLocation,
                      selectedMake !== 'All Makes' ? selectedMake : '',
                      selectedModel !== 'All Models' ? selectedModel : '',
                      minPrice,
                      maxPrice,
                      minYear,
                      maxYear,
                      fuelTypes.length > 0 ? 'fuel' : '',
                      transmissionTypes.length > 0 ? 'transmission' : '',
                      urgentOnly ? 'urgent' : ''
                    ].filter(f => f && f !== '').length;
                    return `${activeFilters} filters applied`;
                  })()}
                </span>
                <button 
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear all
                </button>
              </div>
              {renderFilterContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
