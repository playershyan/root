'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { DISTRICTS, CITIES, POPULAR_LOCATIONS } from '@/lib/constants/locations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SmartLocationSearchProps {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
}

interface SearchResult {
  id: string
  name: string
  name_si?: string | null
  name_ta?: string | null
  type: 'district' | 'city' | 'popular'
  context?: string
  score: number
}

// Helper function to format multilingual names
const formatMultilingualName = (name: string, name_si?: string | null, name_ta?: string | null): string => {
  const parts = [name]
  
  if (name_si && name_si.trim()) {
    parts.push(name_si.trim())
  }
  
  if (name_ta && name_ta.trim()) {
    parts.push(name_ta.trim())
  }
  
  return parts.join(' • ')
}

// Fuzzy matching algorithm (Levenshtein distance)
const calculateFuzzyScore = (str: string, query: string): number => {
  const s1 = str.toLowerCase()
  const s2 = query.toLowerCase()
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null))
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }
  
  const distance = matrix[s2.length][s1.length]
  return 1 - (distance / Math.max(s1.length, s2.length))
}

const SmartLocationSearch = ({ selectedLocation, onLocationChange }: SmartLocationSearchProps) => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Enhanced search algorithm with fuzzy matching
  const searchResults = useMemo(() => {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()

    // 1. Exact matches (highest priority)
    DISTRICTS.forEach(district => {
      if (district.name.toLowerCase() === lowerQuery) {
        results.push({
          id: `district-${district.id}`,
          name: district.name,
          name_si: district.name_si,
          name_ta: district.name_ta,
          type: 'district',
          context: district.province,
          score: 100
        })
      }
    })

    CITIES.forEach(city => {
      if (city.name.toLowerCase() === lowerQuery) {
        const district = DISTRICTS.find(d => d.id === city.district_id)
        results.push({
          id: `city-${city.id}`,
          name: city.name,
          name_si: city.name_si,
          name_ta: city.name_ta,
          type: 'city',
          context: district?.name,
          score: 95
        })
      }
    })

    // 2. Starts with query
    DISTRICTS.forEach(district => {
      if (district.name.toLowerCase().startsWith(lowerQuery) && !results.find(r => r.id === `district-${district.id}`)) {
        results.push({
          id: `district-${district.id}`,
          name: district.name,
          name_si: district.name_si,
          name_ta: district.name_ta,
          type: 'district',
          context: district.province,
          score: 90
        })
      }
    })

    CITIES.forEach(city => {
      if (city.name.toLowerCase().startsWith(lowerQuery) && !results.find(r => r.id === `city-${city.id}`)) {
        const district = DISTRICTS.find(d => d.id === city.district_id)
        results.push({
          id: `city-${city.id}`,
          name: city.name,
          name_si: city.name_si,
          name_ta: city.name_ta,
          type: 'city',
          context: district?.name,
          score: 85
        })
      }
    })

    // 3. Contains query (with fuzzy matching)
    DISTRICTS.forEach(district => {
      if (district.name.toLowerCase().includes(lowerQuery) && !results.find(r => r.id === `district-${district.id}`)) {
        const fuzzyScore = calculateFuzzyScore(district.name, query)
        if (fuzzyScore > 0.6) {
          results.push({
            id: `district-${district.id}`,
            name: district.name,
            name_si: district.name_si,
            name_ta: district.name_ta,
            type: 'district',
            context: district.province,
            score: Math.round(fuzzyScore * 70)
          })
        }
      }
    })

    CITIES.forEach(city => {
      if (city.name.toLowerCase().includes(lowerQuery) && !results.find(r => r.id === `city-${city.id}`)) {
        const fuzzyScore = calculateFuzzyScore(city.name, query)
        if (fuzzyScore > 0.6) {
          const district = DISTRICTS.find(d => d.id === city.district_id)
          results.push({
            id: `city-${city.id}`,
            name: city.name,
            name_si: city.name_si,
            name_ta: city.name_ta,
            type: 'city',
            context: district?.name,
            score: Math.round(fuzzyScore * 65)
          })
        }
      }
    })

    // 4. Popular locations boost
    results.forEach(result => {
      if (POPULAR_LOCATIONS.includes(result.name)) {
        result.score += 10
      }
    })

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [query])

  // Handle location selection
  const handleSelectLocation = (location: string) => {
    onLocationChange(selectedLocation === location ? null : location)
    setQuery('')
    setIsOpen(false)
    
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== location)
      return [location, ...filtered].slice(0, 5)
    })
  }

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-location-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recent-location-searches', JSON.stringify(recentSearches))
  }, [recentSearches])

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search location..."
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            className="w-full pr-10"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {query.length > 0 ? (
              searchResults.length > 0 ? (
                <div className="p-2">
                  {searchResults.map((result) => (
                    <Button
                      key={result.id}
                      onClick={() => handleSelectLocation(result.name)}
                      variant="ghost"
                      size="default"
                      className="w-full justify-start h-auto min-h-touch p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{result.name}</div>
                          {(result.name_si || result.name_ta) && (
                            <div className="text-sm text-gray-600 mt-1">
                              {formatMultilingualName(result.name, result.name_si, result.name_ta)}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            {result.type === 'district' ? 'District' : 'City'}
                            {result.context && ` • ${result.context}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.type === 'district' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              District
                            </span>
                          )}
                          {result.type === 'city' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              City
                            </span>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No locations found for "{query}"
                </div>
              )
            ) : (
              <div className="p-2">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-3">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500">RECENT SEARCHES</div>
                    {recentSearches.map((location) => (
                      <Button
                        key={location}
                        onClick={() => handleSelectLocation(location)}
                        variant="ghost"
                        size="default"
                        className="w-full justify-start min-h-touch"
                      >
                        {location}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Popular Locations */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500">POPULAR LOCATIONS</div>
                  {POPULAR_LOCATIONS.slice(0, 6).map((location) => (
                    <Button
                      key={location}
                      onClick={() => handleSelectLocation(location)}
                      variant="ghost"
                      size="default"
                      className="w-full justify-start min-h-touch"
                    >
                      {location}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Access Chips */}
      <div>
        <div className="text-xs font-semibold text-gray-500 mb-2">QUICK ACCESS</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {POPULAR_LOCATIONS.slice(0, 8).map((location) => {
            // Find multilingual data for this location
            const district = DISTRICTS.find(d => d.name.toLowerCase() === location.toLowerCase())
            const city = CITIES.find(c => c.name.toLowerCase() === location.toLowerCase())
            const locationData = district || city
            
            return (
              <Button
                key={location}
                onClick={() => handleSelectLocation(location)}
                variant={selectedLocation === location ? 'default' : 'outline'}
                size="default"
                className={`
                  min-h-touch h-auto justify-start
                  ${selectedLocation === location
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                <div>
                  <div className="font-medium">{location}</div>
                  {locationData && (locationData.name_si || locationData.name_ta) && (
                    <div className="text-xs opacity-75 mt-0.5">
                      {formatMultilingualName(location, locationData.name_si, locationData.name_ta).split(' • ').slice(1).join(' • ')}
                    </div>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-700">{selectedLocation}</span>
          </div>
          <Button
            onClick={() => onLocationChange(null)}
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-blue-600 hover:text-blue-800"
            aria-label="Clear location"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}

export default SmartLocationSearch
