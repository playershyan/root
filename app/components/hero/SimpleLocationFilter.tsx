'use client'

import { useState, useEffect, useRef } from 'react'
import {
  searchLocations,
  POPULAR_LOCATIONS,
  DISTRICTS,
  CITIES
} from '@/lib/constants/locations'

interface SimpleLocationFilterProps {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
}

interface LocationChipProps {
  label: string
  active: boolean
  onClick: () => void
}

const LocationChip = ({ label, active, onClick }: LocationChipProps) => (
  <button
    onClick={onClick}
    className={`
      px-3 py-2 rounded-lg border transition-all text-sm font-medium
      ${active
        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }
    `}
  >
    {label}
  </button>
)

export default function SimpleLocationFilter({
  selectedLocation,
  onLocationChange
}: SimpleLocationFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<{ districts: any[], cities: any[] }>({ districts: [], cities: [] })
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        const results = searchLocations(searchQuery)
        setSuggestions(results)
        setShowSuggestions(true)
      } else {
        setSuggestions({ districts: [], cities: [] })
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showSuggestions])

  const handleSelectLocation = (location: string) => {
    onLocationChange(selectedLocation === location ? null : location)
    setSearchQuery('')
    setShowSuggestions(false)
  }

  const quickLocations = ['All of Sri Lanka', ...POPULAR_LOCATIONS]
  const hasSearchResults = suggestions.districts.length > 0 || suggestions.cities.length > 0

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search districts and cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
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

        {/* Search Suggestions Dropdown */}
        {showSuggestions && (searchQuery.length > 0) && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {hasSearchResults ? (
              <div className="p-3 space-y-3">
                {/* District Results */}
                {suggestions.districts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">DISTRICTS</p>
                    <div className="space-y-1">
                      {suggestions.districts.slice(0, 5).map(district => (
                        <button
                          key={district.id}
                          onClick={() => handleSelectLocation(district.name)}
                          className="w-full text-left py-2 px-3 rounded hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          {district.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* City Results */}
                {suggestions.cities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">CITIES</p>
                    <div className="space-y-1">
                      {suggestions.cities.slice(0, 8).map(city => (
                        <button
                          key={city.id}
                          onClick={() => handleSelectLocation(city.name)}
                          className="w-full text-left py-2 px-3 rounded hover:bg-gray-50 text-sm text-gray-600 transition-colors"
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No locations found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Access Chips */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">QUICK ACCESS</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickLocations.map(location => (
            <LocationChip
              key={location}
              label={location}
              active={selectedLocation === location}
              onClick={() => handleSelectLocation(location)}
            />
          ))}
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
          <button
            onClick={() => onLocationChange(null)}
            className="text-blue-600 hover:text-blue-800"
            aria-label="Clear location"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
