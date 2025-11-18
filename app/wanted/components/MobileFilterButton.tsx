'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import MobileWantedFilterSheet to reduce initial bundle size
const MobileWantedFilterSheet = dynamic(
  () => import('@/app/components/filters/MobileWantedFilterSheet'),
  { ssr: false }
)

interface MobileFilterButtonProps {
  makes: string[]
  makeModels: Record<string, string[]>
  allModels: string[]
}

export default function MobileFilterButton({ makes, makeModels, allModels }: MobileFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current filter values from URL
  const location = searchParams.get('location') || null
  const make = searchParams.get('make') || 'All Makes'
  const model = searchParams.get('model') || 'All Models'
  const minBudget = searchParams.get('minBudget') || ''
  const maxBudget = searchParams.get('maxBudget') || ''
  const yearFrom = searchParams.get('yearFrom') || ''
  const yearTo = searchParams.get('yearTo') || ''
  const sortBy = searchParams.get('sortBy') || 'recent'
  const highPriorityOnly = searchParams.get('highPriorityOnly') === 'true'

  // Helper function to get available models based on selected make
  const getAvailableModels = (): string[] => {
    if (make === 'All Makes' || !make) {
      return allModels
    }
    return makeModels[make] || []
  }

  // Update URL with filter changes
  const updateFilter = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'All Makes' && value !== 'All Models' && value !== 'All of Sri Lanka') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filtering
    params.delete('page')
    router.push(`/wanted?${params.toString()}`)
  }

  const handleLocationChange = (newLocation: string | null) => {
    updateFilter({ location: newLocation })
  }

  const handleMakeChange = (newMake: string) => {
    const availableModels = newMake === 'All Makes' ? allModels : (makeModels[newMake] || [])
    const currentModelStillAvailable = model === 'All Models' || availableModels.includes(model)
    
    updateFilter({ 
      make: newMake,
      model: currentModelStillAvailable ? model : 'All Models'
    })
  }

  const handleModelChange = (newModel: string) => {
    updateFilter({ model: newModel })
  }

  const handleMinBudgetChange = (budget: string) => {
    updateFilter({ minBudget: budget || null })
  }

  const handleMaxBudgetChange = (budget: string) => {
    updateFilter({ maxBudget: budget || null })
  }

  const handleYearFromChange = (year: string) => {
    updateFilter({ yearFrom: year || null })
  }

  const handleYearToChange = (year: string) => {
    updateFilter({ yearTo: year || null })
  }

  // Combined handler to update both year values atomically
  const handleYearRangeChange = (yearFrom: string, yearTo: string) => {
    updateFilter({ 
      yearFrom: yearFrom || null,
      yearTo: yearTo || null
    })
  }

  const handleSortByChange = (sort: string) => {
    updateFilter({ sortBy: sort })
  }

  const handleHighPriorityToggle = (value: boolean) => {
    updateFilter({ highPriorityOnly: value ? 'true' : null })
  }

  const handleClearAll = () => {
    const params = new URLSearchParams()
    // Keep search if it exists
    const search = searchParams.get('search')
    if (search) {
      params.set('search', search)
    }
    router.push(`/wanted?${params.toString()}`)
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden px-3 py-3 bg-white border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 flex items-center justify-center"
        aria-label="Open filters"
      >
        <Filter size={16} />
      </button>

      {/* Mobile Filter Sheet */}
      <MobileWantedFilterSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        location={location}
        make={make}
        model={model}
        minBudget={minBudget}
        maxBudget={maxBudget}
        yearFrom={yearFrom}
        yearTo={yearTo}
        sortBy={sortBy}
        highPriorityOnly={highPriorityOnly}
        onLocationChange={handleLocationChange}
        onMakeChange={handleMakeChange}
        onModelChange={handleModelChange}
        onMinBudgetChange={handleMinBudgetChange}
        onMaxBudgetChange={handleMaxBudgetChange}
        onYearFromChange={handleYearFromChange}
        onYearToChange={handleYearToChange}
        onYearRangeChange={handleYearRangeChange}
        onSortByChange={handleSortByChange}
        onHighPriorityToggle={handleHighPriorityToggle}
        onClearAll={handleClearAll}
        makes={makes}
        getAvailableModels={getAvailableModels}
      />
    </>
  )
}

