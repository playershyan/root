'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import LocationFilter from '@/app/components/LocationFilter'

interface FilterPanelProps {
  makes: string[]
  getAvailableModels: (make: string) => string[]
}

export default function FilterPanel({ makes, getAvailableModels }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Parse current filters from URL
  const currentLocation = searchParams.get('location') || 'All of Sri Lanka'
  const currentMake = searchParams.get('make') || 'All Makes'
  const currentModel = searchParams.get('model') || 'All Models'
  const currentSortBy = searchParams.get('sortBy') || 'recent'
  const currentHighPriority = searchParams.get('highPriorityOnly') === 'true'
  
  const [tempMinBudget, setTempMinBudget] = useState(searchParams.get('minBudget') || '')
  const [tempMaxBudget, setTempMaxBudget] = useState(searchParams.get('maxBudget') || '')
  const [tempYearFrom, setTempYearFrom] = useState(searchParams.get('yearFrom') || '')
  const [tempYearTo, setTempYearTo] = useState(searchParams.get('yearTo') || '')

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'All Makes' && value !== 'All Models' && value !== 'All of Sri Lanka') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filtering
    params.delete('page')
    
    router.push(`/wanted?${params.toString()}`)
  }, [searchParams, router])

  const applyBudgetRange = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (tempMinBudget) params.set('minBudget', tempMinBudget)
    else params.delete('minBudget')
    
    if (tempMaxBudget) params.set('maxBudget', tempMaxBudget)
    else params.delete('maxBudget')
    
    params.delete('page')
    router.push(`/wanted?${params.toString()}`)
  }, [tempMinBudget, tempMaxBudget, searchParams, router])

  const applyYearRange = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (tempYearFrom) params.set('yearFrom', tempYearFrom)
    else params.delete('yearFrom')
    
    if (tempYearTo) params.set('yearTo', tempYearTo)
    else params.delete('yearTo')
    
    params.delete('page')
    router.push(`/wanted?${params.toString()}`)
  }, [tempYearFrom, tempYearTo, searchParams, router])

  const clearAllFilters = useCallback(() => {
    router.push('/wanted')
    setTempMinBudget('')
    setTempMaxBudget('')
    setTempYearFrom('')
    setTempYearTo('')
  }, [router])

  return (
    <div className="bg-white rounded-lg shadow p-4 lg:p-6 sticky top-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b">
        <h3 className="text-base font-bold text-gray-900">Filters</h3>
        <button
          onClick={clearAllFilters}
          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Sort By */}
      <div className="mb-6 border-b pb-4">
        <label htmlFor="sort-filter" className="block font-semibold text-gray-700 text-sm mb-2">
          Sort by
        </label>
        <select
          id="sort-filter"
          value={currentSortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
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
          currentHighPriority ? 'bg-orange-50 border-2 border-orange-200' : 'hover:bg-orange-25'
        }`}>
          <input
            type="checkbox"
            checked={currentHighPriority}
            onChange={(e) => updateFilter('highPriorityOnly', e.target.checked ? 'true' : null)}
            className="sr-only"
          />
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
            currentHighPriority ? 'bg-orange-500 border-orange-500' : 'border-orange-300 hover:border-orange-400'
          }`}>
            {currentHighPriority && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className={`font-semibold text-sm ${
            currentHighPriority ? 'text-orange-700' : 'text-orange-600'
          }`}>
            High Priority Only
          </span>
        </label>
      </div>

      {/* Location Filter */}
      <LocationFilter
        selectedLocation={currentLocation !== 'All of Sri Lanka' ? currentLocation : null}
        onLocationChange={(location) => updateFilter('location', location)}
        expanded={true}
        onToggleExpand={() => {}}
      />

      {/* Make Filter */}
      <div className="mb-6">
        <label className="font-semibold text-gray-700 block mb-2 text-sm">Make</label>
        <select
          value={currentMake}
          onChange={(e) => {
            updateFilter('make', e.target.value)
            // Reset model when make changes
            if (e.target.value === 'All Makes') {
              updateFilter('model', null)
            }
          }}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
        >
          <option value="All Makes">All Makes</option>
          {makes.map(make => (
            <option key={make} value={make}>{make}</option>
          ))}
        </select>
      </div>

      {/* Model Filter */}
      <div className="mb-6">
        <label className="font-semibold text-gray-700 block mb-2 text-sm">Model</label>
        <select
          value={currentModel}
          onChange={(e) => updateFilter('model', e.target.value)}
          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
          disabled={currentMake === 'All Makes'}
        >
          <option value="All Models">All Models</option>
          {getAvailableModels(currentMake).map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
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
      </div>
    </div>
  )
}

