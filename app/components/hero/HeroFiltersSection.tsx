'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuickFilters from './QuickFilters'

export default function HeroFiltersSection() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMake, setSelectedMake] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState('')

  const handleBrowse = () => {
    const params = new URLSearchParams()

    if (selectedMake) params.append('make', selectedMake)
    if (selectedModel) params.append('model', selectedModel)
    if (selectedLocation) params.append('location', selectedLocation)
    if (selectedYear) params.append('year', selectedYear)
    if (selectedCategory) params.append('category', selectedCategory)

    const url = params.toString() ? `/listings?${params.toString()}` : '/listings'
    router.push(url)
  }

  const handleClearFilters = () => {
    setSelectedCategory('')
    setSelectedMake('')
    setSelectedModel('')
    setSelectedLocation(null)
    setSelectedYear('')
  }

  const hasFilters = !!(selectedMake || selectedModel || selectedLocation || selectedYear || selectedCategory)

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 md:mb-6">
      {/* Quick Filters */}
      <QuickFilters
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedMake={selectedMake}
        setSelectedMake={setSelectedMake}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Browse Button - Integrated with Filters */}
      <div className="mt-4">
        <button
          onClick={handleBrowse}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          {hasFilters ? 'Browse Filtered Vehicles' : 'Browse Vehicles'}
        </button>
      </div>
    </div>
  )
}
