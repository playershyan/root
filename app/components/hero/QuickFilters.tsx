'use client'

import { useState } from 'react'
import SmartLocationSearch from './SmartLocationSearch'
import { getVehicleCategories, getMakesByCategory } from '@/lib/constants/vehicleData'

interface QuickFiltersProps {
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  selectedMake: string
  setSelectedMake: (value: string) => void
  selectedModel: string
  setSelectedModel: (value: string) => void
  selectedLocation: string | null
  setSelectedLocation: (value: string | null) => void
  selectedYear: string
  setSelectedYear: (value: string) => void
  hasFilters: boolean
  onClearFilters: () => void
}

export default function QuickFilters({
  selectedCategory,
  setSelectedCategory,
  selectedMake,
  setSelectedMake,
  selectedModel,
  setSelectedModel,
  selectedLocation,
  setSelectedLocation,
  selectedYear,
  setSelectedYear,
  hasFilters,
  onClearFilters
}: QuickFiltersProps) {
  const categories = getVehicleCategories()
  const makes = selectedCategory ? getMakesByCategory(selectedCategory) : []
  const models = selectedMake
    ? makes.find(m => m.name === selectedMake)?.models || []
    : []

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  return (
    <div className="w-full">
      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {/* Vehicle Category */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setSelectedMake('')
            setSelectedModel('')
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        {/* Make */}
        <select
          value={selectedMake}
          onChange={(e) => {
            setSelectedMake(e.target.value)
            setSelectedModel('')
          }}
          disabled={!selectedCategory}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">All Makes</option>
          {makes.map(make => (
            <option key={make.name} value={make.name}>{make.name}</option>
          ))}
        </select>

        {/* Model */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedMake}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">All Models</option>
          {models.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        {/* Year */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

      </div>

      {/* Location Filter */}
      <div className="mt-4">
        <SmartLocationSearch
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />
      </div>

      {/* Clear Button */}
      {hasFilters && (
        <div className="flex justify-end mt-3">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}
