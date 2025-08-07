'use client'

import { useState } from 'react'
import { 
  DISTRICTS, 
  getCitiesByDistrictId, 
  searchLocations,
  formatLocationDisplay 
} from '@/lib/constants/locations'

interface LocationFilterProps {
  selectedLocation: string | null  // Single selection instead of array
  onLocationChange: (location: string | null) => void  // Single location or null
  expanded: boolean
  onToggleExpand: () => void
  variant?: 'wanted' | 'listings'
}

export default function LocationFilter({
  selectedLocation,
  onLocationChange,
  expanded,
  onToggleExpand,
  variant = 'wanted'
}: LocationFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set())

  const handleDistrictClick = (districtName: string, districtId: number) => {
    // Select district (deselects previous selection)
    onLocationChange(selectedLocation === districtName ? null : districtName)
    
    // Always expand district to show cities when clicked
    setExpandedDistricts(prev => {
      const newExpanded = new Set(prev)
      newExpanded.add(districtId)
      return newExpanded
    })
  }

  const handleLocationSelect = (locationName: string) => {
    // Single selection - deselects previous selection
    onLocationChange(selectedLocation === locationName ? null : locationName)
  }

  const filteredResults = searchQuery ? searchLocations(searchQuery) : null

  const containerClass = variant === 'listings' ? 'mb-4 border-b pb-4' : 'mb-6'
  const headerClass = variant === 'listings' 
    ? 'flex justify-between items-center w-full py-2 text-left font-medium cursor-pointer'
    : 'flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded'

  return (
    <div className={containerClass}>
      {/* Filter Header */}
      <div 
        onClick={onToggleExpand}
        className={headerClass}
      >
        <span className={variant === 'listings' ? '' : 'font-semibold text-gray-700'}>
          {selectedLocation ? `Location: ${selectedLocation}` : 'Select Location'}
        </span>
        {variant === 'listings' ? (
          <span>{expanded ? '▲' : '▼'}</span>
        ) : (
          <span className={`text-gray-400 text-sm transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        )}
      </div>

      {/* Filter Content */}
      {expanded && (
        <div className={variant === 'listings' ? 'mt-2' : 'mt-3 space-y-2'}>
          {/* Search Input */}
          <input 
            type="text" 
            placeholder="Search districts and cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={variant === 'listings' 
              ? "w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm"
              : "w-full px-3 py-2 border rounded-md text-sm mb-2"
            }
          />
          
          <div className={variant === 'listings' 
            ? "space-y-2 max-h-64 overflow-y-auto"
            : "max-h-64 overflow-y-auto border rounded-md p-2 bg-gray-50"
          }>
            {!searchQuery ? (
              /* Default view - All Districts */
              <div>
                {DISTRICTS.map(district => (
                  <div key={district.id} className="mb-1">
                    {/* District Row */}
                    <div
                      onClick={() => handleDistrictClick(district.name, district.id)}
                      className={`flex items-center justify-between cursor-pointer py-2 px-3 rounded hover:bg-gray-50 transition-colors mb-1 w-full ${
                        selectedLocation === district.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-sm flex-1">{district.name}</span>
                      <svg 
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedDistricts.has(district.id) ? 'rotate-90' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Cities under district */}
                    {expandedDistricts.has(district.id) && (
                      <div className="ml-6 mb-1">
                        {getCitiesByDistrictId(district.id).map(city => (
                          <div
                            key={city.id}
                            onClick={() => handleLocationSelect(city.name)}
                            className={`py-1.5 px-3 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedLocation === city.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            <span className="text-xs">{city.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Search Results */
              <div>
                {(() => {
                  const { districts, cities } = filteredResults!
                  return (
                    <>
                      {districts.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">DISTRICTS</p>
                          {districts.map(district => (
                            <div
                              key={district.id}
                              onClick={() => handleLocationSelect(district.name)}
                              className={`py-2 px-3 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                                selectedLocation === district.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                              }`}
                            >
                              <span className="text-sm">{district.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {cities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">CITIES</p>
                          {cities.map(city => (
                            <div
                              key={city.id}
                              onClick={() => handleLocationSelect(city.name)}
                              className={`py-2 px-3 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                                selectedLocation === city.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'
                              }`}
                            >
                              <span className="text-sm">{formatLocationDisplay(city.name)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {districts.length === 0 && cities.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No locations found</p>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}