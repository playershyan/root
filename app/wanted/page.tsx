'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useInView } from 'react-intersection-observer'
import debounce from 'lodash/debounce'

interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  location: string
  phone: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number
  urgency?: 'high' | 'medium' | 'low'
  created_at: string
  user_name?: string
  user_avatar?: string
  is_active: boolean
  saved?: boolean
}

interface FilterState {
  locations: string[]
  makes: string[]
  models: string[]
  minBudget: string
  maxBudget: string
  yearFrom: string
  yearTo: string
  fuelTypes: string[]
  transmissions: string[]
  urgencyLevels: string[]
}

const LOCATIONS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Galle', 
  'Matara', 'Negombo', 'Kurunegala', 'Anuradhapura', 'Jaffna'
]

const MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 
  'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz'
]

const MAKE_MODEL_MAP: Record<string, string[]> = {
  toyota: ['Prius', 'Camry', 'Corolla', 'Vitz', 'Aqua', 'CHR', 'Highlander', 'Land Cruiser', 'Hiace', 'Hilux'],
  honda: ['Civic', 'Accord', 'Fit', 'Vezel', 'CR-V', 'Insight', 'City', 'Jazz', 'Pilot', 'Ridgeline'],
  nissan: ['March', 'Tiida', 'Sylphy', 'Teana', 'X-Trail', 'Murano', 'Navara', 'Juke', 'Qashqai', 'Leaf'],
  mazda: ['Demio', 'Axela', 'Atenza', 'CX-3', 'CX-5', 'CX-9', 'BT-50', 'Premacy', 'Biante', 'Roadster'],
  suzuki: ['Alto', 'Swift', 'Wagon R', 'Baleno', 'Vitara', 'Jimny', 'Ertiga', 'S-Cross', 'Ignis', 'Ciaz'],
  mitsubishi: ['Lancer', 'Outlander', 'Pajero', 'Montero', 'ASX', 'Mirage', 'Triton', 'Galant', 'Colt', 'Eclipse'],
  hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'i30', 'Accent', 'Genesis', 'Kona'],
  kia: ['Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto', 'Rio', 'Soul', 'Stinger', 'Carnival', 'Seltos'],
  bmw: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8'],
  'mercedes-benz': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS']
}

export default function WantedRequestsPage() {
  const [requests, setRequests] = useState<WantedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<WantedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [filters, setFilters] = useState<FilterState>({
    locations: [],
    makes: [],
    models: [],
    minBudget: '',
    maxBudget: '',
    yearFrom: '',
    yearTo: '',
    fuelTypes: [],
    transmissions: [],
    urgencyLevels: []
  })
  const [expandedFilters, setExpandedFilters] = useState({
    location: false,
    make: false,
    model: false
  })
  const [savedRequests, setSavedRequests] = useState<Set<string>>(new Set())
  const [displayCount, setDisplayCount] = useState(6)
  const [hasMore, setHasMore] = useState(true)
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  })

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
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Add mock urgency levels and user info for demo
      const enhancedRequests = (data || []).map((req, index) => ({
        ...req,
        urgency: ['high', 'medium', 'low'][index % 3] as 'high' | 'medium' | 'low',
        user_name: req.user_name || `User ${req.id.slice(0, 4)}`,
        user_avatar: req.user_name?.slice(0, 2).toUpperCase() || 'U'
      }))

      setRequests(enhancedRequests)
      setFilteredRequests(enhancedRequests.slice(0, displayCount))
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedRequests = () => {
    const saved = localStorage.getItem('savedWantedRequests')
    if (saved) {
      setSavedRequests(new Set(JSON.parse(saved)))
    }
  }

  const toggleSave = (requestId: string) => {
    const newSaved = new Set(savedRequests)
    if (newSaved.has(requestId)) {
      newSaved.delete(requestId)
    } else {
      newSaved.add(requestId)
    }
    setSavedRequests(newSaved)
    localStorage.setItem('savedWantedRequests', JSON.stringify(Array.from(newSaved)))
  }

  const applyFilters = useCallback(() => {
    let filtered = [...requests]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.title.toLowerCase().includes(searchLower) ||
          req.description?.toLowerCase().includes(searchLower) ||
          req.user_name?.toLowerCase().includes(searchLower) ||
          req.make?.toLowerCase().includes(searchLower) ||
          req.model?.toLowerCase().includes(searchLower) ||
          req.location.toLowerCase().includes(searchLower)
        )
      })
    }

    // Location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(req => 
        filters.locations.some(loc => 
          req.location.toLowerCase().includes(loc.toLowerCase())
        )
      )
    }

    // Make filter
    if (filters.makes.length > 0) {
      filtered = filtered.filter(req => 
        req.make && filters.makes.includes(req.make)
      )
    }

    // Model filter
    if (filters.models.length > 0) {
      filtered = filtered.filter(req => 
        req.model && filters.models.includes(req.model)
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

    // Fuel type filter
    if (filters.fuelTypes.length > 0) {
      filtered = filtered.filter(req => 
        req.fuel_type && filters.fuelTypes.includes(req.fuel_type)
      )
    }

    // Transmission filter
    if (filters.transmissions.length > 0) {
      filtered = filtered.filter(req => 
        req.transmission && filters.transmissions.includes(req.transmission)
      )
    }

    // Urgency filter
    if (filters.urgencyLevels.length > 0) {
      filtered = filtered.filter(req => 
        req.urgency && filters.urgencyLevels.includes(req.urgency)
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
          const urgencyOrder = { high: 0, medium: 1, low: 2 }
          return urgencyOrder[a.urgency || 'low'] - urgencyOrder[b.urgency || 'low']
        case 'location':
          return a.location.localeCompare(b.location)
        default: // recent
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredRequests(filtered.slice(0, displayCount))
    setHasMore(filtered.length > displayCount)
  }, [requests, searchTerm, filters, sortBy, displayCount])

  const loadMore = () => {
    setDisplayCount(prev => prev + 6)
  }

  const clearFilters = () => {
    setFilters({
      locations: [],
      makes: [],
      models: [],
      minBudget: '',
      maxBudget: '',
      yearFrom: '',
      yearTo: '',
      fuelTypes: [],
      transmissions: [],
      urgencyLevels: []
    })
    setSearchTerm('')
  }

  const toggleFilterExpand = (filterType: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }))
  }

  const handleLocationToggle = (location: string) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }))
  }

  const handleMakeToggle = (make: string) => {
    setFilters(prev => ({
      ...prev,
      makes: prev.makes.includes(make)
        ? prev.makes.filter(m => m !== make)
        : [...prev.makes, make],
      models: [] // Clear models when make changes
    }))
  }

  const handleModelToggle = (model: string) => {
    setFilters(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }))
  }

  const getAvailableModels = () => {
    if (filters.makes.length === 1) {
      const makeKey = filters.makes[0].toLowerCase().replace('-', '')
      return MAKE_MODEL_MAP[makeKey] || []
    }
    return []
  }

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

  const getUrgencyClass = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-orange-100 text-orange-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const debouncedSearch = useCallback(
    debounce((value: string) => setSearchTerm(value), 300),
    []
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {filters.locations.length > 0 
                  ? `Wanted Requests in ${filters.locations.join(', ')}`
                  : 'Wanted Requests'
                }
              </h1>
              <p className="text-gray-600 mt-2">
                Browse active requests from buyers looking for specific vehicles. Contact them directly if you have what they're looking for.
              </p>
            </div>
            <Link 
              href="/wanted/post" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Publish a Wanted Request
            </Link>
          </div>

          {/* Quick Search */}
          <div className="max-w-2xl mb-6">
            <div className="flex">
              <input
                type="text"
                placeholder="Search wanted requests..."
                className="flex-1 px-4 py-3 border-2 border-r-0 border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
              <button className="bg-blue-600 text-white px-6 py-3 rounded-r-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2">
                <span>🔍</span>
                Search
              </button>
            </div>
          </div>

          {/* Results Info & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-gray-600">
              {filteredRequests.length} wanted requests found
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-gray-700">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
                <option value="urgency">Most Urgent</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <div 
                  onClick={() => toggleFilterExpand('location')}
                  className="flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
                >
                  <span className="font-semibold text-gray-700">Location</span>
                  <span className={`text-gray-400 text-sm transition-transform ${expandedFilters.location ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                <div className={`mt-3 space-y-2 overflow-hidden transition-all ${expandedFilters.location ? 'max-h-64' : 'max-h-0'}`}>
                  <input 
                    type="text" 
                    placeholder="Search districts and cities..."
                    className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {LOCATIONS.map(location => (
                      <label 
                        key={location}
                        className={`block py-1.5 px-2 rounded cursor-pointer hover:bg-blue-50 ${
                          filters.locations.includes(location) ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.locations.includes(location)}
                          onChange={() => handleLocationToggle(location)}
                          className="sr-only"
                        />
                        {location}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

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
                    {MAKES.map(make => (
                      <label 
                        key={make}
                        className={`block py-1.5 px-2 rounded cursor-pointer hover:bg-blue-50 ${
                          filters.makes.includes(make) ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={filters.makes.includes(make)}
                          onChange={() => handleMakeToggle(make)}
                          className="sr-only"
                        />
                        {make}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Filter (conditional) */}
              {filters.makes.length === 1 && (
                <div className="mb-6">
                  <div 
                    onClick={() => toggleFilterExpand('model')}
                    className="flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <span className="font-semibold text-gray-700">Model</span>
                    <span className={`text-gray-400 text-sm transition-transform ${expandedFilters.model ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                  <div className={`mt-3 space-y-2 overflow-hidden transition-all ${expandedFilters.model ? 'max-h-64' : 'max-h-0'}`}>
                    <input 
                      type="text" 
                      placeholder="Search models..."
                      className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                      {getAvailableModels().map(model => (
                        <label 
                          key={model}
                          className={`block py-1.5 px-2 rounded cursor-pointer hover:bg-blue-50 ${
                            filters.models.includes(model) ? 'bg-yellow-50 font-semibold text-yellow-700' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={filters.models.includes(model)}
                            onChange={() => handleModelToggle(model)}
                            className="sr-only"
                          />
                          {model}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Range */}
              <div className="mb-6">
                <label className="font-semibold text-gray-700 block mb-3">Budget Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min (LKR)"
                    value={filters.minBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBudget: e.target.value }))}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max (LKR)"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBudget: e.target.value }))}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div className="mb-6">
                <label className="font-semibold text-gray-700 block mb-3">Year Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="From year"
                    value={filters.yearFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearFrom: e.target.value }))}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="number"
                    placeholder="To year"
                    value={filters.yearTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, yearTo: e.target.value }))}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>

              {/* Fuel Type */}
              <div className="mb-6">
                <label className="font-semibold text-gray-700 block mb-3">Fuel Type</label>
                <div className="space-y-2">
                  {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(fuel => (
                    <label key={fuel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.fuelTypes.includes(fuel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, fuelTypes: [...prev.fuelTypes, fuel] }))
                          } else {
                            setFilters(prev => ({ ...prev, fuelTypes: prev.fuelTypes.filter(f => f !== fuel) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{fuel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transmission */}
              <div className="mb-6">
                <label className="font-semibold text-gray-700 block mb-3">Transmission</label>
                <div className="space-y-2">
                  {['Automatic', 'Manual'].map(trans => (
                    <label key={trans} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.transmissions.includes(trans)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, transmissions: [...prev.transmissions, trans] }))
                          } else {
                            setFilters(prev => ({ ...prev, transmissions: prev.transmissions.filter(t => t !== trans) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{trans}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className="font-semibold text-gray-700 block mb-3">Urgency</label>
                <div className="space-y-2">
                  {[
                    { value: 'high', label: 'High Priority' },
                    { value: 'medium', label: 'Medium Priority' },
                    { value: 'low', label: 'Low Priority' }
                  ].map(urgency => (
                    <label key={urgency.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.urgencyLevels.includes(urgency.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, urgencyLevels: [...prev.urgencyLevels, urgency.value] }))
                          } else {
                            setFilters(prev => ({ ...prev, urgencyLevels: prev.urgencyLevels.filter(u => u !== urgency.value) }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{urgency.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading wanted requests...</p>
              </div>
            ) : filteredRequests.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                      <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-t-lg border-b">
                        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getUrgencyClass(request.urgency)}`}>
                          {request.urgency === 'high' ? 'High Priority' : 
                           request.urgency === 'medium' ? 'Medium Priority' : 'Low Priority'}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900 pr-24 mb-2">{request.title}</h3>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {request.user_avatar}
                          </div>
                          <div>
                            <div className="font-medium text-gray-700">{request.user_name}</div>
                            <div className="text-xs text-gray-500">{formatTimeAgo(request.created_at)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="text-xs font-semibold text-blue-700 mb-1">Budget Range</div>
                          <div className="text-lg font-bold text-blue-900">
                            Rs. {request.min_budget?.toLocaleString() || '0'} - {request.max_budget?.toLocaleString() || 'Any'}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Preferred Location:</span>
                            <span className="font-medium text-gray-900">{request.location}</span>
                          </div>
                          {request.fuel_type && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fuel Type:</span>
                              <span className="font-medium text-gray-900">{request.fuel_type}</span>
                            </div>
                          )}
                          {request.transmission && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Transmission:</span>
                              <span className="font-medium text-gray-900">{request.transmission}</span>
                            </div>
                          )}
                          {request.max_mileage && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Max Mileage:</span>
                              <span className="font-medium text-gray-900">{request.max_mileage.toLocaleString()} km</span>
                            </div>
                          )}
                          {(request.min_year || request.max_year) && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Year Range:</span>
                              <span className="font-medium text-gray-900">
                                {request.min_year || 'Any'} - {request.max_year || 'Any'}
                              </span>
                            </div>
                          )}
                        </div>

                        {request.description && (
                          <div className="bg-gray-50 rounded-md p-3 mb-5 border-l-4 border-blue-600">
                            <p className="text-sm text-gray-700 leading-relaxed">{request.description}</p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t">
                          <a 
                            href={`tel:${request.phone}`}
                            className="flex-1 bg-blue-600 text-white text-center py-2.5 rounded-md hover:bg-blue-700 transition font-semibold"
                          >
                            Contact Buyer
                          </a>
                          <button
                            onClick={() => toggleSave(request.id)}
                            className={`px-4 py-2.5 rounded-md border transition ${
                              savedRequests.has(request.id)
                                ? 'bg-yellow-400 border-yellow-500 text-gray-900'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {savedRequests.has(request.id) ? '⭐' : '💾'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More / Infinite Scroll */}
                <div ref={loadMoreRef} className="text-center mt-8">
                  {hasMore && (
                    <div className="text-gray-600">
                      {loading ? 'Loading more wanted requests...' : 'Scroll for more'}
                    </div>
                  )}
                  {!hasMore && filteredRequests.length > 6 && (
                    <div className="text-gray-500">No more wanted requests to load</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg mb-4">
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
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters and try again
                  </button>
                )}
                {!searchTerm && !Object.values(filters).some(f => 
                  (Array.isArray(f) && f.length > 0) || (typeof f === 'string' && f)
                ) && (
                  <Link href="/wanted/post" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
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