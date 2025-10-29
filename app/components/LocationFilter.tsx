'use client'

import { useState, useEffect } from 'react'
import {
  DISTRICTS,
  getCitiesByDistrictId,
  searchLocations,
  formatLocationDisplay,
  getPopularLocations,
  getUserLocation,
  sortDistrictsByProximity,
  sortCitiesByProximity
} from '@/lib/constants/locations'

interface LocationFilterProps {
  selectedLocation: string | null  // Single selection instead of array
  onLocationChange: (location: string | null) => void  // Single location or null
  expanded: boolean
  onToggleExpand: () => void
  variant?: 'wanted' | 'listings' | 'compact'
  disableMaxHeight?: boolean  // For mobile filter sheets
}

export default function LocationFilter({
  selectedLocation,
  onLocationChange,
  expanded,
  onToggleExpand,
  variant = 'wanted',
  disableMaxHeight = false
}: LocationFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set())
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null)

  // Get user location on component mount (optional, with permission)
  useEffect(() => {
    if (expanded) {
      getUserLocation().then(location => {
        if (location) {
          setUserLocation(location)
        }
      })
    }
  }, [expanded])

  const handleDistrictClick = (districtName: string, districtId: number) => {
    // Select district (deselects previous selection)
    onLocationChange(selectedLocation === districtName ? null : districtName)
    
    // Toggle district expansion - expand if collapsed, collapse if expanded
    setExpandedDistricts(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(districtId)) {
        newExpanded.delete(districtId)
      } else {
        newExpanded.add(districtId)
      }
      return newExpanded
    })
  }

  const handleLocationSelect = (locationName: string) => {
    // Single selection - deselects previous selection
    onLocationChange(selectedLocation === locationName ? null : locationName)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // If search is empty, set to "All of Sri Lanka" to show all results
      if (searchQuery.trim() === '') {
        onLocationChange('All of Sri Lanka')
      }
    }
  }

  const handleAllSriLankaSelect = () => {
    onLocationChange(selectedLocation === 'All of Sri Lanka' ? null : 'All of Sri Lanka')
  }

  const filteredResults = searchQuery ? searchLocations(searchQuery) : null

  // Sort districts and cities by proximity if user location is available
  const sortedDistricts = userLocation
    ? sortDistrictsByProximity(DISTRICTS, userLocation.latitude, userLocation.longitude)
    : DISTRICTS

  const containerClass = variant === 'listings' ? 'mb-4 border-b pb-4' : 'mb-6'
  const headerClass = variant === 'listings'
    ? 'flex justify-between items-center w-full py-2 text-left font-medium cursor-pointer'
    : 'flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-2 px-2 rounded'

  // For compact variant, use simpler styling
  const isCompact = variant === 'compact'

  return (
    <div className={isCompact ? '' : containerClass}>
      {/* Filter Header - Hidden for compact variant */}
      {!isCompact && (
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
      )}

      {/* Filter Content */}
      {(expanded || isCompact) && (
        <div className={isCompact ? 'pl-1 pr-3 py-3' : (variant === 'listings' ? 'mt-2' : 'mt-3 space-y-2')}>
          {/* Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search districts and cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-left"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className={
            disableMaxHeight
              ? "overflow-y-auto"
              : (isCompact
                ? "max-h-64 overflow-y-auto"
                : (variant === 'listings'
                  ? "space-y-2 max-h-64 overflow-y-auto"
                  : "max-h-64 overflow-y-auto border rounded-md p-2 bg-gray-50"))
          }>
            {!searchQuery ? (
              /* Default view - Popular Locations + All Districts */
              <div>
                {/* All of Sri Lanka Option */}
                <div
                  onClick={handleAllSriLankaSelect}
                  className={`flex items-center justify-between cursor-pointer py-2.5 pr-2 rounded hover:bg-gray-50 transition-colors mb-4 pb-3 w-full border-b-2 border-gray-200 ${
                    isCompact ? 'pl-3' : 'pl-0'
                  } ${
                    selectedLocation === 'All of Sri Lanka' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <span className="text-sm flex-1 text-left">🇱🇰 All of Sri Lanka</span>
                  {selectedLocation === 'All of Sri Lanka' && (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Popular Locations Section */}
                {(() => {
                  const popularLocations = getPopularLocations()
                  const hasPopular = popularLocations.districts.length > 0 || popularLocations.cities.length > 0

                  return hasPopular ? (
                    <div className="mb-4 pb-3 border-b-2 border-gray-200">
                      <div className={`flex items-center gap-2 mb-3 pb-1.5 ${isCompact ? 'pl-3' : 'pl-0'}`}>
                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Popular Locations</p>
                      </div>
                      {/* Popular Districts */}
                      {popularLocations.districts.map(district => (
                        <div
                          key={`popular-district-${district.id}`}
                          onClick={() => handleLocationSelect(district.name)}
                          className={`py-2 pr-2 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                            isCompact ? 'pl-3' : 'pl-0'
                          } ${
                            selectedLocation === district.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-sm">{district.name}</span>
                            {(district.name_si || district.name_ta) && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {[district.name_si, district.name_ta].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Popular Cities */}
                      {popularLocations.cities.map(city => (
                        <div
                          key={`popular-city-${city.id}`}
                          onClick={() => handleLocationSelect(city.name)}
                          className={`py-2 pr-2 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                            isCompact ? 'pl-3' : 'pl-0'
                          } ${
                            selectedLocation === city.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-sm">{city.name}</span>
                            {(city.name_si || city.name_ta) && (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {[city.name_si, city.name_ta].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null
                })()}

                {/* All Districts Header */}
                <div className={`flex items-center justify-between mb-3 pb-1.5 ${isCompact ? 'pl-3' : 'pl-0'}`}>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">All Districts</p>
                  {userLocation && (
                    <p className="text-xs text-blue-600 font-medium">📍 Sorted by distance</p>
                  )}
                </div>

                {sortedDistricts.map(district => {
                  const districtCities = getCitiesByDistrictId(district.id)
                  const sortedCities = userLocation
                    ? sortCitiesByProximity(districtCities, userLocation.latitude, userLocation.longitude)
                    : districtCities

                  return (
                    <div key={district.id} className="mb-1">
                      {/* District Row */}
                      <div
                        onClick={() => handleDistrictClick(district.name, district.id)}
                        className={`flex items-center justify-between cursor-pointer py-2 pr-2 rounded hover:bg-gray-50 transition-colors mb-1 w-full ${
                          isCompact ? 'pl-3' : 'pl-0'
                        } ${
                          selectedLocation === district.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex flex-col flex-1 text-left">
                          <span className="text-sm">{district.name}</span>
                          {(district.name_si || district.name_ta) && (
                            <span className="text-xs text-gray-500 mt-0.5">
                              {[district.name_si, district.name_ta].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${expandedDistricts.has(district.id) ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>

                      {/* Cities under district */}
                      {expandedDistricts.has(district.id) && (
                        <div className={isCompact ? 'ml-4 mb-1' : 'ml-3 mb-1'}>
                          {sortedCities.map(city => (
                            <div
                              key={city.id}
                              onClick={() => handleLocationSelect(city.name)}
                              className={`py-1.5 pr-2 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                isCompact ? 'pl-3' : 'pl-0'
                              } ${
                                selectedLocation === city.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'
                              }`}
                            >
                              <div className="flex flex-col text-left">
                                <span className="text-xs">{city.name}</span>
                                {(city.name_si || city.name_ta) && (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {[city.name_si, city.name_ta].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Search Results */
              <div>
                {(() => {
                  const { districts, cities } = filteredResults!

                  // Apply proximity sorting to search results if user location available
                  const sortedSearchDistricts = userLocation
                    ? sortDistrictsByProximity(districts, userLocation.latitude, userLocation.longitude)
                    : districts
                  const sortedSearchCities = userLocation
                    ? sortCitiesByProximity(cities, userLocation.latitude, userLocation.longitude)
                    : cities

                  return (
                    <>
                      {sortedSearchDistricts.length > 0 && (
                        <div className="mb-4">
                          <div className={`flex items-center justify-between mb-3 pb-1.5 ${isCompact ? 'pl-3' : 'pl-0'}`}>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Districts</p>
                            {userLocation && (
                              <p className="text-xs text-blue-600 font-medium">📍 Sorted by distance</p>
                            )}
                          </div>
                          {sortedSearchDistricts.map(district => (
                            <div
                              key={district.id}
                              onClick={() => handleLocationSelect(district.name)}
                              className={`py-2 pr-2 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                                isCompact ? 'pl-3' : 'pl-0'
                              } ${
                                selectedLocation === district.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'
                              }`}
                            >
                              <div className="flex flex-col text-left">
                                <span className="text-sm">{district.name}</span>
                                {(district.name_si || district.name_ta) && (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {[district.name_si, district.name_ta].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sortedSearchCities.length > 0 && (
                        <div>
                          <div className={`flex items-center justify-between mb-3 pb-1.5 ${isCompact ? 'pl-3' : 'pl-0'}`}>
                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cities</p>
                            {userLocation && (
                              <p className="text-xs text-blue-600 font-medium">📍 Sorted by distance</p>
                            )}
                          </div>
                          {sortedSearchCities.map(city => (
                            <div
                              key={city.id}
                              onClick={() => handleLocationSelect(city.name)}
                              className={`py-2 pr-2 rounded cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                                isCompact ? 'pl-3' : 'pl-0'
                              } ${
                                selectedLocation === city.name ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'
                              }`}
                            >
                              <div className="flex flex-col text-left">
                                <span className="text-sm">{formatLocationDisplay(city.name)}</span>
                                {(city.name_si || city.name_ta) && (
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {[city.name_si, city.name_ta].filter(Boolean).join(' • ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sortedSearchDistricts.length === 0 && sortedSearchCities.length === 0 && (
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