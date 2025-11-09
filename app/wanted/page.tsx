'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useInView } from 'react-intersection-observer'
import debounce from 'lodash/debounce'
import LocationFilter from '@/app/components/LocationFilter'
import UrgentWantedCard from '@/app/components/wantedRequests/UrgentWantedCard'
import RegularWantedCard from '@/app/components/wantedRequests/RegularWantedCard'
import MatchNotificationBanner, { MultiMatchNotificationBanner } from './components/MatchNotificationBanner'
import { useWantedNotifications } from '@/lib/hooks/useWantedNotifications'
import { logger } from '@/lib/utils/logger'

// Lazy load large components (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const MobileWantedFilterSheet = dynamic(() => import('@/app/components/filters/MobileWantedFilterSheet'), {
  ssr: false
})

interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  budget?: number // For card components compatibility
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
  // Promotion fields
  is_high_priority?: boolean
  high_priority_until?: string
  views?: number
  clicks?: number
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
  
  // For values under 1M, round to nearest 50K
  if (value < 1000000) {
    const rounded = Math.round(value / 50000) * 50000
    const thousands = rounded / 1000
    return `${thousands}K`
  }
  
  // For values 1M and above, round to nearest 0.5M
  const rounded = Math.round(value / 500000) * 500000
  const millions = rounded / 1000000
  
  // Display with one decimal place if not a whole number
  return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
}

// Helper function to render the appropriate card component
const renderWantedCard = (request: WantedRequest) => {
  // Prepare request data with budget field for card compatibility
  const requestWithBudget = {
    ...request,
    budget: request.max_budget || request.min_budget || 0
  }

  // Determine which card component to use based on high priority promotion
  if (request.is_high_priority) {
    return <UrgentWantedCard key={request.id} request={requestWithBudget} />
  }

  // Default to regular card
  return <RegularWantedCard key={request.id} request={requestWithBudget} />
}

export default function WantedRequestsPage() {
  const [requests, setRequests] = useState<WantedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<WantedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wantedSearchTerm') || ''
    }
    return ''
  })
  const [searchInput, setSearchInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wantedSearchTerm') || ''
    }
    return ''
  })
  const [sortBy, setSortBy] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wantedSortBy') || 'recent'
    }
    return 'recent'
  })
  const [highPriorityOnly, setHighPriorityOnly] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('wantedHighPriorityOnly') === 'true'
    }
    return false
  })

  // Wanted notifications hook
  const {
    notifications,
    isLoading: notificationsLoading,
    dismissNotification
  } = useWantedNotifications()

  // Dismiss all notifications
  const handleDismissAll = async () => {
    try {
      await Promise.all(notifications.map(n => dismissNotification(n.id)))
    } catch (error) {
      logger.error('Error dismissing all notifications', error as Error)
    }
  }
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('wantedFilters')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          logger.error('Failed to parse saved filters', e as Error)
        }
      }
    }
    return {
      locations: ['All of Sri Lanka'],
      make: 'All Makes',
      model: 'All Models',
      minBudget: '',
      maxBudget: '',
      yearFrom: '',
      yearTo: ''
    }
  })
  const [expandedFilters, setExpandedFilters] = useState({
    location: true,
    make: true,
    model: true,
    mobile: false
  })
  const [makeSearchTerm, setMakeSearchTerm] = useState('')
  const [modelSearchTerm, setModelSearchTerm] = useState('')
  // Temporary states for budget and year inputs
  const [tempMinBudget, setTempMinBudget] = useState('')
  const [tempMaxBudget, setTempMaxBudget] = useState('')
  const [tempYearFrom, setTempYearFrom] = useState('')
  const [tempYearTo, setTempYearTo] = useState('')
  const [savedRequests, setSavedRequests] = useState<Set<string>>(new Set())
  const [displayCount, setDisplayCount] = useState(6)
  const [hasMore, setHasMore] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<WantedRequest | null>(null)
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

  // Load initial data
  useEffect(() => {
    fetchRequests()
    loadSavedRequests()
  }, [])

  // Initialize temporary values
  useEffect(() => {
    setTempMinBudget(filters.minBudget)
    setTempMaxBudget(filters.maxBudget)
    setTempYearFrom(filters.yearFrom)
    setTempYearTo(filters.yearTo)
  }, [])

  // Persist filter states to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('wantedSearchTerm', searchTerm)
  }, [searchTerm])

  useEffect(() => {
    sessionStorage.setItem('wantedSortBy', sortBy)
  }, [sortBy])

  useEffect(() => {
    sessionStorage.setItem('wantedHighPriorityOnly', String(highPriorityOnly))
  }, [highPriorityOnly])

  useEffect(() => {
    sessionStorage.setItem('wantedFilters', JSON.stringify(filters))
  }, [filters])

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters()
  }, [requests, searchTerm, filters, sortBy, highPriorityOnly])

  // Load more when scrolling
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore()
    }
  }, [inView, hasMore, loading])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const target = event.target as Element
        // Don't close if clicking on the menu button or the dropdown menu
        const menuButton = target.closest('button[data-menu-button]')
        const dropdown = target.closest('[data-menu-dropdown]')
        
        if (!menuButton && !dropdown) {
          setOpenMenuId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('wanted_requests')
        .select(`
          *,
          profiles (
            id,
            name,
            phone,
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
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process requests with proper contact logic, handling both profile and non-profile cases
      const enhancedRequests = (data || []).map((req) => {
        const profile = req.profiles

        // Determine contact info based on business profile status
        let contactInfo = {
          phone: req.phone,
          whatsapp: req.whatsapp,
          email: req.email,
          location: req.location
        }

        if (profile) {
          // Check if user has active business profile
          if (profile.business_profiles && profile.business_profiles.is_active) {
            const businessProfile = profile.business_profiles
            contactInfo = {
              phone: businessProfile.phone || profile.phone || req.phone,
              whatsapp: businessProfile.whatsapp || businessProfile.phone || profile.whatsapp || profile.phone || req.whatsapp,
              email: profile.email || req.email,
              location: businessProfile.address || profile.location || req.location
            }
          } else {
            // Use individual profile contact info
            contactInfo = {
              phone: profile.phone || req.phone,
              whatsapp: profile.whatsapp || profile.phone || req.whatsapp,
              email: profile.email || req.email,
              location: profile.location || req.location
            }
          }
        }

        // Fallback for missing data
        return {
          ...req,
          phone: contactInfo.phone || req.phone || 'Contact via platform',
          whatsapp: contactInfo.whatsapp || req.whatsapp || contactInfo.phone,
          email: contactInfo.email || req.email || '',
          location: contactInfo.location || req.location || 'Location not specified',
          user_name: profile?.name || req.user_name || `User ${req.id?.slice(0, 4) || 'Unknown'}`,
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

  const toggleSave = (requestId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    const newSaved = new Set(savedRequests)
    if (newSaved.has(requestId)) {
      newSaved.delete(requestId)
    } else {
      newSaved.add(requestId)
    }
    setSavedRequests(newSaved)
    localStorage.setItem('savedWantedRequests', JSON.stringify(Array.from(newSaved)))
    
    // Save full request data for profile page (similar to listings page)
    if (newSaved.has(requestId) && !savedRequests.has(requestId)) {
      const request = [...requests, ...filteredRequests].find(r => r.id === requestId)
      if (request) {
        const existingData = localStorage.getItem('favoriteWantedRequestsData')
        const currentData = existingData ? JSON.parse(existingData) : []
        const newData = [...currentData, {
          id: request.id,
          title: request.title,
          description: request.description,
          price: request.max_budget || request.min_budget || 0, // Use max budget as main price
          location: request.location,
          postedDate: request.created_at,
          minBudget: request.min_budget,
          maxBudget: request.max_budget,
          make: request.make,
          model: request.model,
          user_name: request.user_name
        }]
        localStorage.setItem('favoriteWantedRequestsData', JSON.stringify(newData))
      }
    } else if (!newSaved.has(requestId)) {
      // Remove from full data when unsaved
      const existingData = localStorage.getItem('favoriteWantedRequestsData')
      if (existingData) {
        const currentData = JSON.parse(existingData)
        const updatedData = currentData.filter((item: any) => item.id !== requestId)
        localStorage.setItem('favoriteWantedRequestsData', JSON.stringify(updatedData))
      }
    }
    
    // Don't close menu immediately - let user see the result
  }

  const handleShare = (request: WantedRequest, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    if (navigator.share) {
      navigator.share({
        title: request.title,
        text: `${request.title} - Budget: Rs. ${formatBudget(request.min_budget)} - ${formatBudget(request.max_budget)}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
    // Close menu after share action
    setOpenMenuId(null)
  }

  const handleReport = (requestId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    // TODO: Implement report functionality
    alert('Report functionality coming soon!')
    // Close menu after report action
    setOpenMenuId(null)
  }

  const toggleMenu = (requestId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setOpenMenuId(openMenuId === requestId ? null : requestId)
  }

  const handleContactBuyer = (request: WantedRequest, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
    }
    setSelectedRequest(request)
    setShowContactModal(true)
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

    // High priority filter
    if (highPriorityOnly) {
      filtered = filtered.filter(req => req.is_high_priority === true)
    }


    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'budget-high':
          return (b.max_budget || 0) - (a.max_budget || 0)
        case 'budget-low':
          return (a.min_budget || 0) - (b.min_budget || 0)
        case 'urgency':
          // High priority first, then others
          const aUrgency = a.is_high_priority ? 0 : 1
          const bUrgency = b.is_high_priority ? 0 : 1
          return aUrgency - bUrgency
        default: // recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    const slicedResults = filtered.slice(0, displayCount)
    setFilteredRequests(slicedResults)
    setHasMore(filtered.length > displayCount)
    
  }, [requests, searchTerm, filters, sortBy, displayCount, highPriorityOnly])

  const loadMore = () => {
    setDisplayCount(prev => prev + 6)
  }

  // Calculate active filter count
  const activeFilterCount =
    (filters.locations.length > 0 && !filters.locations.includes('All of Sri Lanka') ? 1 : 0) +
    (filters.make !== 'All Makes' ? 1 : 0) +
    (filters.model !== 'All Models' ? 1 : 0) +
    (filters.minBudget || filters.maxBudget ? 1 : 0) +
    (filters.yearFrom || filters.yearTo ? 1 : 0) +
    (highPriorityOnly ? 1 : 0) +
    (sortBy !== 'recent' ? 1 : 0)

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
    setTempMinBudget('')
    setTempMaxBudget('')
    setTempYearFrom('')
    setTempYearTo('')
    setSearchTerm('')
    setSearchInput('')
    setHighPriorityOnly(false)
    setSortBy('recent')
  }

  // Clear individual filter handlers
  const clearLocation = () => setFilters(prev => ({ ...prev, locations: ['All of Sri Lanka'] }))
  const clearMake = () => {
    setFilters(prev => ({
      ...prev,
      make: 'All Makes',
      model: 'All Models'
    }))
  }
  const clearModel = () => setFilters(prev => ({ ...prev, model: 'All Models' }))
  const clearBudget = () => {
    setFilters(prev => ({
      ...prev,
      minBudget: '',
      maxBudget: ''
    }))
    setTempMinBudget('')
    setTempMaxBudget('')
  }
  const clearYear = () => {
    setFilters(prev => ({
      ...prev,
      yearFrom: '',
      yearTo: ''
    }))
    setTempYearFrom('')
    setTempYearTo('')
  }
  const clearHighPriority = () => setHighPriorityOnly(false)
  const clearSort = () => setSortBy('recent')

  const applyBudgetRange = () => {
    setFilters(prev => ({
      ...prev,
      minBudget: tempMinBudget,
      maxBudget: tempMaxBudget
    }))
  }

  const applyYearRange = () => {
    setFilters(prev => ({
      ...prev,
      yearFrom: tempYearFrom,
      yearTo: tempYearTo
    }))
  }

  const toggleFilterExpand = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const handleLocationChange = (locations: string[]) => {
    setFilters(prev => ({
      ...prev,
      locations
    }))
  }

  const handleMakeToggle = (make: string) => {
    setFilters(prev => {
      const newMake = prev.make === make ? 'All Makes' : make
      const availableModels = newMake === 'All Makes' ? ALL_MODELS : (MAKE_MODELS[newMake as keyof typeof MAKE_MODELS] || [])
      const currentModelStillAvailable = prev.model === 'All Models' || availableModels.includes(prev.model)
      
      return {
        ...prev,
        make: newMake,
        model: currentModelStillAvailable ? prev.model : 'All Models'
      }
    })
  }

  const handleModelToggle = (model: string) => {
    setFilters(prev => ({
      ...prev,
      model: prev.model === model ? 'All Models' : model
    }))
  }

  const getAvailableModels = () => {
    if (filters.make === 'All Makes' || !filters.make) {
      return ALL_MODELS
    }
    return MAKE_MODELS[filters.make as keyof typeof MAKE_MODELS] || []
  }

  const getFilteredMakes = () => {
    if (!makeSearchTerm) return MAKES
    return MAKES.filter(make => 
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


  const renderFilterContent = () => (
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
          <option value="budget-high">Budget: High to Low</option>
          <option value="budget-low">Budget: Low to High</option>
          <option value="urgency">Most Urgent</option>
        </select>
      </div>

      {/* High Priority Filter */}
      <div className="mb-6 border-b pb-4">
        <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
          highPriorityOnly ? 'bg-orange-50 border-2 border-orange-200' : 'hover:bg-orange-25'
        }`}>
          <input
            type="checkbox"
            checked={highPriorityOnly}
            onChange={(e) => setHighPriorityOnly(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
            highPriorityOnly ? 'bg-orange-500 border-orange-500' : 'border-orange-300 hover:border-orange-400'
          }`}>
            {highPriorityOnly && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-sm ${
              highPriorityOnly ? 'text-orange-700' : 'text-orange-600'
            }`}>
              High Priority Only
            </span>
          </div>
        </label>
      </div>

      {/* Location Filter */}
      <LocationFilter
        selectedLocation={filters.locations.length > 0 ? filters.locations[0] : null}
        onLocationChange={(location) => handleLocationChange(location ? [location] : [])}
        expanded={expandedFilters.location}
        onToggleExpand={() => toggleFilterExpand('location')}
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
                filters.make === 'All Makes' ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
              }`}
            >
              <input
                type="radio"
                checked={filters.make === 'All Makes'}
                onChange={() => handleMakeToggle('All Makes')}
                className="sr-only"
              />
              🚗 All Makes
            </label>
            
            {getFilteredMakes().map(make => (
              <label 
                key={make}
                className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                  filters.make === make ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                }`}
              >
                <input
                  type="radio"
                  checked={filters.make === make}
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
                  filters.model === 'All Models' ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                }`}
              >
                <input
                  type="radio"
                  checked={filters.model === 'All Models'}
                  onChange={() => handleModelToggle('All Models')}
                  className="sr-only"
                />
                🚗 All Models
              </label>
              
              {getFilteredModels().map(model => (
                <label 
                  key={model}
                  className={`block py-1 px-2 rounded cursor-pointer hover:bg-blue-50 text-xs ${
                    filters.model === model ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                  }`}
                >
                  <input
                    type="radio"
                    checked={filters.model === model}
                    onChange={() => handleModelToggle(model)}
                    className="sr-only"
                  />
                  {model}
                </label>
              ))}
            </div>
          </div>
        </div>

      {/* Budget Range */}
      <div className="mb-4">
        <label className="font-semibold text-gray-700 block mb-2 text-sm">Budget Range</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="number"
            placeholder="Min (LKR)"
            value={tempMinBudget}
            onChange={(e) => setTempMinBudget(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
          <input
            type="number"
            placeholder="Max (LKR)"
            value={tempMaxBudget}
            onChange={(e) => setTempMaxBudget(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
        </div>
        <button
          onClick={applyBudgetRange}
          className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-400 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
        >
          Apply Budget Range
        </button>
        {(filters.minBudget || filters.maxBudget) && (
          <div className="mt-2 text-xs text-gray-600">
            Active: {filters.minBudget && `Min: Rs. ${parseInt(filters.minBudget).toLocaleString()}`} 
            {filters.minBudget && filters.maxBudget && ' - '}
            {filters.maxBudget && `Max: Rs. ${parseInt(filters.maxBudget).toLocaleString()}`}
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
            value={tempYearFrom}
            onChange={(e) => setTempYearFrom(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
          <input
            type="number"
            placeholder="To year"
            value={tempYearTo}
            onChange={(e) => setTempYearTo(e.target.value)}
            className="px-2 py-1.5 border rounded-md text-xs"
          />
        </div>
        <button
          onClick={applyYearRange}
          className="w-full px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-400 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
        >
          Apply Year Range
        </button>
        {(filters.yearFrom || filters.yearTo) && (
          <div className="mt-2 text-xs text-gray-600">
            Active: {filters.yearFrom && `From: ${filters.yearFrom}`} 
            {filters.yearFrom && filters.yearTo && ' - '}
            {filters.yearTo && `To: ${filters.yearTo}`}
          </div>
        )}
      </div>

    </>
  )

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Posted today'
    if (diffInDays === 1) return 'Posted 1 day ago'
    if (diffInDays < 7) return `Posted ${diffInDays} days ago`
    if (diffInDays < 30) return `Posted ${Math.floor(diffInDays / 7)} weeks ago`
    return `Posted ${Math.floor(diffInDays / 30)} months ago`
  }

  const getUrgencyClass = (isHighPriority?: boolean) => {
    if (isHighPriority) {
      return 'bg-red-100 text-red-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const handleSearch = useCallback(() => {
    setSearchTerm(searchInput.trim())
  }, [searchInput])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                {filters.locations.length > 0 && !filters.locations.includes('All of Sri Lanka')
                  ? filters.locations.join(', ')
                  : 'All of Sri Lanka'
                }
              </h1>
            </div>
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
              {/* Mobile Filter Button */}
              <button
                onClick={() => setExpandedFilters(prev => ({ ...prev, mobile: true }))}
                className="lg:hidden px-3 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                aria-label="Open filters"
              >
                <i className="fas fa-filter"></i>
              </button>

              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by make, model, year, or location"
                  className="w-full px-6 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
                  aria-label="Search"
                >
                  <i className="fas fa-search text-base"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="text-gray-600 text-xs sm:text-sm">
            {filteredRequests.length} wanted requests found
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Match Notification Banners */}
        {notifications.length > 0 && (
          <div className="mb-6">
            {notifications.length === 1 ? (
              <MatchNotificationBanner
                notification={notifications[0]}
                onDismiss={dismissNotification}
              />
            ) : (
              <MultiMatchNotificationBanner
                notifications={notifications}
                onDismissAll={handleDismissAll}
                onDismiss={dismissNotification}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 lg:p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h3 className="text-base font-bold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
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
            {/* Active Filter Summary Bar */}
            {activeFilterCount > 0 && (
              <div className="bg-white p-3 sm:p-4 lg:rounded-lg shadow-sm mb-2 lg:mb-4 border-b lg:border border-gray-200">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                    Active Filters ({activeFilterCount})
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 whitespace-nowrap"
                  >
                    <i className="fas fa-times"></i>
                    <span className="hidden xs:inline">Clear All</span>
                    <span className="xs:hidden">Clear</span>
                  </button>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {filters.locations.length > 0 && !filters.locations.includes('All of Sri Lanka') && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-green-50 text-green-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-green-200">
                      <i className="fas fa-map-marker-alt text-xs"></i>
                      <span className="truncate max-w-[100px] sm:max-w-none">{filters.locations[0]}</span>
                      <button
                        onClick={clearLocation}
                        className="ml-0.5 sm:ml-1 hover:text-green-900 flex-shrink-0"
                        aria-label="Remove location filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {filters.make !== 'All Makes' && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-purple-50 text-purple-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-purple-200">
                      <i className="fas fa-car text-xs"></i>
                      <span className="truncate max-w-[80px] sm:max-w-none">{filters.make}</span>
                      <button
                        onClick={clearMake}
                        className="ml-0.5 sm:ml-1 hover:text-purple-900 flex-shrink-0"
                        aria-label="Remove make filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {filters.model !== 'All Models' && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-indigo-50 text-indigo-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-indigo-200">
                      <i className="fas fa-car-side text-xs"></i>
                      <span className="truncate max-w-[80px] sm:max-w-none">{filters.model}</span>
                      <button
                        onClick={clearModel}
                        className="ml-0.5 sm:ml-1 hover:text-indigo-900 flex-shrink-0"
                        aria-label="Remove model filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {(filters.minBudget || filters.maxBudget) && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-yellow-50 text-yellow-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-yellow-200">
                      <i className="fas fa-tag text-xs"></i>
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {filters.minBudget && `Rs. ${parseInt(filters.minBudget).toLocaleString()}`}
                        {filters.minBudget && filters.maxBudget && ' - '}
                        {filters.maxBudget && `Rs. ${parseInt(filters.maxBudget).toLocaleString()}`}
                      </span>
                      <button
                        onClick={clearBudget}
                        className="ml-0.5 sm:ml-1 hover:text-yellow-900 flex-shrink-0"
                        aria-label="Remove budget filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {(filters.yearFrom || filters.yearTo) && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-orange-50 text-orange-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-orange-200">
                      <i className="fas fa-calendar text-xs"></i>
                      <span className="whitespace-nowrap">
                        {filters.yearFrom && filters.yearFrom}
                        {filters.yearFrom && filters.yearTo && ' - '}
                        {filters.yearTo && filters.yearTo}
                      </span>
                      <button
                        onClick={clearYear}
                        className="ml-0.5 sm:ml-1 hover:text-orange-900 flex-shrink-0"
                        aria-label="Remove year filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {highPriorityOnly && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-red-50 text-red-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-red-200">
                      <i className="fas fa-star text-xs"></i>
                      <span className="whitespace-nowrap">High Priority Only</span>
                      <button
                        onClick={clearHighPriority}
                        className="ml-0.5 sm:ml-1 hover:text-red-900 flex-shrink-0"
                        aria-label="Remove high priority filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                  {sortBy !== 'recent' && (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border border-blue-200">
                      <i className="fas fa-sort text-xs"></i>
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {sortBy === 'budget-high' && 'Budget: High to Low'}
                        {sortBy === 'budget-low' && 'Budget: Low to High'}
                        {sortBy === 'urgency' && 'Most Urgent'}
                      </span>
                      <button
                        onClick={clearSort}
                        className="ml-0.5 sm:ml-1 hover:text-blue-900 flex-shrink-0"
                        aria-label="Remove sort filter"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600 text-sm">Loading wanted requests...</p>
              </div>
            ) : filteredRequests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => renderWantedCard(request))}
                </div>

                {/* Load More / Infinite Scroll */}
                <div ref={loadMoreRef} className="text-center mt-6">
                  {hasMore && (
                    <div className="text-gray-600 text-sm">
                      {loading ? 'Loading more wanted requests...' : 'Scroll for more'}
                    </div>
                  )}
                  {!hasMore && filteredRequests.length > 6 && (
                    <div className="text-gray-500 text-sm">No more wanted requests to load</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-3">
                  {searchTerm || Object.values(filters).some(f => 
                    (Array.isArray(f) && f.length > 0) || (typeof f === 'string' && f)
                  ) 
                    ? 'No wanted requests match your filters.'
                    : 'No wanted requests yet.'
                  }
                </p>
                {(searchTerm || Object.values(filters).some(f => 
                  (Array.isArray(f) && f.length > 0) || (typeof f === 'string' && f)
                )) && (
                  <button 
                    onClick={clearFilters}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Clear filters and try again
                  </button>
                )}
                {!searchTerm && !Object.values(filters).some(f => 
                  (Array.isArray(f) && f.length > 0) || (typeof f === 'string' && f)
                ) && (
                  <Link href="/wanted/post" className="inline-block mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    Post the first wanted request
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      <MobileWantedFilterSheet
        isOpen={expandedFilters.mobile}
        onClose={() => setExpandedFilters(prev => ({ ...prev, mobile: false }))}
        location={filters.locations[0] || null}
        make={filters.make}
        model={filters.model}
        minBudget={filters.minBudget}
        maxBudget={filters.maxBudget}
        yearFrom={filters.yearFrom}
        yearTo={filters.yearTo}
        sortBy={sortBy}
        highPriorityOnly={highPriorityOnly}
        onLocationChange={(location) => handleLocationChange(location ? [location] : ['All of Sri Lanka'])}
        onMakeChange={(make) => setFilters(prev => {
          const availableModels = make === 'All Makes' ? ALL_MODELS : (MAKE_MODELS[make as keyof typeof MAKE_MODELS] || [])
          const currentModelStillAvailable = prev.model === 'All Models' || availableModels.includes(prev.model)
          return {
            ...prev,
            make,
            model: currentModelStillAvailable ? prev.model : 'All Models'
          }
        })}
        onModelChange={(model) => setFilters(prev => ({ ...prev, model }))}
        onMinBudgetChange={(budget) => setFilters(prev => ({ ...prev, minBudget: budget }))}
        onMaxBudgetChange={(budget) => setFilters(prev => ({ ...prev, maxBudget: budget }))}
        onYearFromChange={(year) => setFilters(prev => ({ ...prev, yearFrom: year }))}
        onYearToChange={(year) => setFilters(prev => ({ ...prev, yearTo: year }))}
        onSortByChange={setSortBy}
        onHighPriorityToggle={setHighPriorityOnly}
        onClearAll={clearFilters}
        makes={MAKES}
        getAvailableModels={getAvailableModels}
      />

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