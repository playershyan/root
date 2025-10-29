'use client'

import { useState, useEffect } from 'react'
import LocationFilter from '@/app/components/LocationFilter'

interface MobileWantedFilterSheetProps {
  isOpen: boolean
  onClose: () => void

  // Filter states
  location: string | null
  make: string
  model: string
  minBudget: string
  maxBudget: string
  yearFrom: string
  yearTo: string
  sortBy: string
  highPriorityOnly: boolean

  // Filter setters
  onLocationChange: (location: string | null) => void
  onMakeChange: (make: string) => void
  onModelChange: (model: string) => void
  onMinBudgetChange: (budget: string) => void
  onMaxBudgetChange: (budget: string) => void
  onYearFromChange: (year: string) => void
  onYearToChange: (year: string) => void
  onSortByChange: (sort: string) => void
  onHighPriorityToggle: (value: boolean) => void

  // Clear function
  onClearAll: () => void

  // Make/Model data
  makes: string[]
  getAvailableModels: () => string[]
}

type FilterPage = 'main' | 'location' | 'make' | 'model' | 'budget' | 'year' | 'sort'

export default function MobileWantedFilterSheet({
  isOpen,
  onClose,
  location,
  make,
  model,
  minBudget,
  maxBudget,
  yearFrom,
  yearTo,
  sortBy,
  highPriorityOnly,
  onLocationChange,
  onMakeChange,
  onModelChange,
  onMinBudgetChange,
  onMaxBudgetChange,
  onYearFromChange,
  onYearToChange,
  onSortByChange,
  onHighPriorityToggle,
  onClearAll,
  makes,
  getAvailableModels
}: MobileWantedFilterSheetProps) {
  const [currentPage, setCurrentPage] = useState<FilterPage>('main')
  const [makeSearchTerm, setMakeSearchTerm] = useState('')
  const [modelSearchTerm, setModelSearchTerm] = useState('')

  // Temporary states for budget and year
  const [tempMinBudget, setTempMinBudget] = useState(minBudget)
  const [tempMaxBudget, setTempMaxBudget] = useState(maxBudget)
  const [tempYearFrom, setTempYearFrom] = useState(yearFrom)
  const [tempYearTo, setTempYearTo] = useState(yearTo)

  // Sync temp states with props
  useEffect(() => {
    setTempMinBudget(minBudget)
    setTempMaxBudget(maxBudget)
    setTempYearFrom(yearFrom)
    setTempYearTo(yearTo)
  }, [minBudget, maxBudget, yearFrom, yearTo])

  // Reset to main page when closing
  useEffect(() => {
    if (!isOpen) {
      setCurrentPage('main')
      setMakeSearchTerm('')
      setModelSearchTerm('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const showPage = (page: FilterPage) => {
    setCurrentPage(page)
  }

  const showMain = () => {
    setCurrentPage('main')
  }

  const getFilterValue = (filterType: string): { text: string; active: boolean } => {
    switch (filterType) {
      case 'location':
        return {
          text: location && location !== 'All of Sri Lanka' ? location : '',
          active: !!location && location !== 'All of Sri Lanka'
        }
      case 'make':
        return {
          text: make !== 'All Makes' ? make : '',
          active: make !== 'All Makes'
        }
      case 'model':
        return {
          text: model !== 'All Models' ? model : '',
          active: model !== 'All Models'
        }
      case 'budget':
        const budgetText = minBudget || maxBudget
          ? `${minBudget ? `Rs. ${parseInt(minBudget).toLocaleString()}` : 'Any'} - ${maxBudget ? `Rs. ${parseInt(maxBudget).toLocaleString()}` : 'Any'}`
          : ''
        return {
          text: budgetText,
          active: !!(minBudget || maxBudget)
        }
      case 'year':
        const yearText = yearFrom || yearTo
          ? `${yearFrom || 'Any'} - ${yearTo || 'Any'}`
          : ''
        return {
          text: yearText,
          active: !!(yearFrom || yearTo)
        }
      case 'sort':
        const sortLabels: Record<string, string> = {
          'recent': 'Most Recent',
          'budget-high': 'Budget: High to Low',
          'budget-low': 'Budget: Low to High',
          'urgency': 'Most Urgent'
        }
        return {
          text: sortLabels[sortBy] || 'Most Recent',
          active: sortBy !== 'recent'
        }
      default:
        return { text: '', active: false }
    }
  }

  // Count active filters
  const activeCount = [
    location && location !== 'All of Sri Lanka',
    make !== 'All Makes',
    model !== 'All Models',
    minBudget || maxBudget,
    yearFrom || yearTo,
    highPriorityOnly,
    sortBy !== 'recent'
  ].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Filter Sheet */}
      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col">
        {/* Main Filter List */}
        {currentPage === 'main' && (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <span className="bg-white border border-blue-300 text-blue-600 text-xs font-medium px-2.5 py-1 rounded">
                    {activeCount} {activeCount === 1 ? 'filter' : 'filters'} applied
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="text-blue-600 text-sm font-semibold hover:text-blue-700"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <div className="mb-4">
                  <button
                    onClick={onClearAll}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Clear all filters
                  </button>
                </div>

                {/* High Priority Toggle */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                    highPriorityOnly ? 'bg-red-50 border-2 border-red-200' : 'hover:bg-gray-50'
                  }`}>
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                      highPriorityOnly ? 'bg-red-600 border-red-600' : 'border-gray-300'
                    }`}>
                      {highPriorityOnly && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${
                      highPriorityOnly ? 'text-red-700' : 'text-red-600'
                    }`}>
                      High Priority Only
                    </span>
                  </label>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={highPriorityOnly}
                    onChange={(e) => onHighPriorityToggle(e.target.checked)}
                  />
                </div>

                {/* Filter Items */}
                <div className="space-y-2">
                  {/* Sort */}
                  <FilterItem
                    label="Sort by"
                    value={getFilterValue('sort').text}
                    isActive={getFilterValue('sort').active}
                    onClick={() => showPage('sort')}
                  />

                  {/* Location */}
                  <FilterItem
                    label="Location"
                    value={getFilterValue('location').text || 'All of Sri Lanka'}
                    isActive={getFilterValue('location').active}
                    onClick={() => showPage('location')}
                  />

                  {/* Make */}
                  <FilterItem
                    label="Make"
                    value={getFilterValue('make').text || 'All Makes'}
                    isActive={getFilterValue('make').active}
                    onClick={() => showPage('make')}
                  />

                  {/* Model */}
                  <FilterItem
                    label="Model"
                    value={getFilterValue('model').text || 'All Models'}
                    isActive={getFilterValue('model').active}
                    onClick={() => showPage('model')}
                  />

                  {/* Budget Range */}
                  <FilterItem
                    label="Budget Range"
                    value={getFilterValue('budget').text || 'Any budget'}
                    isActive={getFilterValue('budget').active}
                    onClick={() => showPage('budget')}
                  />

                  {/* Year Range */}
                  <FilterItem
                    label="Year Range"
                    value={getFilterValue('year').text || 'Any year'}
                    isActive={getFilterValue('year').active}
                    onClick={() => showPage('year')}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Location Filter Page */}
        {currentPage === 'location' && (
          <LocationFilterPage
            selectedLocation={location}
            onLocationChange={onLocationChange}
            onBack={showMain}
          />
        )}

        {/* Make Filter Page */}
        {currentPage === 'make' && (
          <MakeFilterPage
            selectedMake={make}
            onSelect={onMakeChange}
            onBack={showMain}
            searchTerm={makeSearchTerm}
            onSearchChange={setMakeSearchTerm}
            makes={makes}
          />
        )}

        {/* Model Filter Page */}
        {currentPage === 'model' && (
          <ModelFilterPage
            selectedModel={model}
            onSelect={onModelChange}
            onBack={showMain}
            searchTerm={modelSearchTerm}
            onSearchChange={setModelSearchTerm}
            models={getAvailableModels()}
          />
        )}

        {/* Budget Filter Page */}
        {currentPage === 'budget' && (
          <BudgetFilterPage
            minBudget={tempMinBudget}
            maxBudget={tempMaxBudget}
            onMinChange={setTempMinBudget}
            onMaxChange={setTempMaxBudget}
            onApply={() => {
              onMinBudgetChange(tempMinBudget)
              onMaxBudgetChange(tempMaxBudget)
              showMain()
            }}
            onBack={showMain}
            onClear={() => {
              setTempMinBudget('')
              setTempMaxBudget('')
              onMinBudgetChange('')
              onMaxBudgetChange('')
            }}
          />
        )}

        {/* Year Filter Page */}
        {currentPage === 'year' && (
          <YearFilterPage
            yearFrom={tempYearFrom}
            yearTo={tempYearTo}
            onFromChange={setTempYearFrom}
            onToChange={setTempYearTo}
            onApply={() => {
              onYearFromChange(tempYearFrom)
              onYearToChange(tempYearTo)
              showMain()
            }}
            onBack={showMain}
            onClear={() => {
              setTempYearFrom('')
              setTempYearTo('')
              onYearFromChange('')
              onYearToChange('')
            }}
          />
        )}

        {/* Sort Filter Page */}
        {currentPage === 'sort' && (
          <SortFilterPage
            selectedSort={sortBy}
            onSelect={(sort) => {
              onSortByChange(sort)
              showMain()
            }}
            onBack={showMain}
          />
        )}
      </div>
    </div>
  )
}

// Helper component for filter items
function FilterItem({
  label,
  value,
  isActive,
  onClick
}: {
  label: string
  value: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <div className="flex-1 text-left">
        <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
        <div className={`text-sm ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}>
          {value}
        </div>
      </div>
      <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
    </button>
  )
}

// Sub-components for each filter page

function LocationFilterPage({
  selectedLocation,
  onLocationChange,
  onBack
}: {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
  onBack: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Location</h2>
        {selectedLocation && selectedLocation !== 'All of Sri Lanka' && (
          <button
            onClick={() => onLocationChange(null)}
            className="text-red-600 text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <LocationFilter
          selectedLocation={selectedLocation}
          onLocationChange={onLocationChange}
          expanded={true}
          onToggleExpand={() => {}}
        />
      </div>
    </>
  )
}

function MakeFilterPage({
  selectedMake,
  onSelect,
  onBack,
  searchTerm,
  onSearchChange,
  makes
}: {
  selectedMake: string
  onSelect: (make: string) => void
  onBack: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  makes: string[]
}) {
  const filteredMakes = searchTerm
    ? makes.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
    : makes

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Make</h2>
        {selectedMake !== 'All Makes' && (
          <button
            onClick={() => onSelect('All Makes')}
            className="text-red-600 text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search makes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <ul className="space-y-2">
          <li>
            <button
              onClick={() => {
                onSelect('All Makes')
                onBack()
              }}
              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                selectedMake === 'All Makes'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-gray-50'
              }`}
            >
              All Makes
            </button>
          </li>
          {filteredMakes.map((make) => (
            <li key={make}>
              <button
                onClick={() => {
                  onSelect(make)
                  onBack()
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedMake === make
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{make}</span>
                {selectedMake === make && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function ModelFilterPage({
  selectedModel,
  onSelect,
  onBack,
  searchTerm,
  onSearchChange,
  models
}: {
  selectedModel: string
  onSelect: (model: string) => void
  onBack: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  models: string[]
}) {
  const filteredModels = searchTerm
    ? models.filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
    : models

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Model</h2>
        {selectedModel !== 'All Models' && (
          <button
            onClick={() => onSelect('All Models')}
            className="text-red-600 text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <ul className="space-y-2">
          <li>
            <button
              onClick={() => {
                onSelect('All Models')
                onBack()
              }}
              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors ${
                selectedModel === 'All Models'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'hover:bg-gray-50'
              }`}
            >
              All Models
            </button>
          </li>
          {filteredModels.map((model) => (
            <li key={model}>
              <button
                onClick={() => {
                  onSelect(model)
                  onBack()
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedModel === model
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{model}</span>
                {selectedModel === model && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function BudgetFilterPage({
  minBudget,
  maxBudget,
  onMinChange,
  onMaxChange,
  onApply,
  onBack,
  onClear
}: {
  minBudget: string
  maxBudget: string
  onMinChange: (val: string) => void
  onMaxChange: (val: string) => void
  onApply: () => void
  onBack: () => void
  onClear: () => void
}) {
  const presets = [
    { label: 'Under 1M', min: '', max: '1000000' },
    { label: '1M - 3M', min: '1000000', max: '3000000' },
    { label: '3M - 5M', min: '3000000', max: '5000000' },
    { label: '5M - 10M', min: '5000000', max: '10000000' },
    { label: '10M - 20M', min: '10000000', max: '20000000' },
    { label: '20M+', min: '20000000', max: '' }
  ]

  const currentPreset = presets.find(p => p.min === minBudget && p.max === maxBudget)

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Budget Range</h2>
        {(minBudget || maxBudget) && (
          <button onClick={onClear} className="text-red-600 text-sm font-medium">
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Presets</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onMinChange(preset.min)
                  onMaxChange(preset.max)
                }}
                className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all ${
                  currentPreset?.label === preset.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              Minimum (LKR)
            </label>
            <input
              type="number"
              placeholder="0"
              value={minBudget}
              onChange={(e) => onMinChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              Maximum (LKR)
            </label>
            <input
              type="number"
              placeholder="Any"
              value={maxBudget}
              onChange={(e) => onMaxChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <button
          onClick={onApply}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Budget Range
        </button>
      </div>
    </>
  )
}

function YearFilterPage({
  yearFrom,
  yearTo,
  onFromChange,
  onToChange,
  onApply,
  onBack,
  onClear
}: {
  yearFrom: string
  yearTo: string
  onFromChange: (val: string) => void
  onToChange: (val: string) => void
  onApply: () => void
  onBack: () => void
  onClear: () => void
}) {
  const currentYear = new Date().getFullYear()
  const presets = [
    { label: `${currentYear}+`, from: String(currentYear), to: '' },
    { label: `${currentYear - 3}+`, from: String(currentYear - 3), to: '' },
    { label: `${currentYear - 5}+`, from: String(currentYear - 5), to: '' },
    { label: `${currentYear - 10}+`, from: String(currentYear - 10), to: '' },
    { label: `${currentYear - 20}+`, from: String(currentYear - 20), to: '' },
    { label: 'Any', from: '', to: '' }
  ]

  const currentPreset = presets.find(p => p.from === yearFrom && p.to === yearTo)

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Year Range</h2>
        {(yearFrom || yearTo) && (
          <button onClick={onClear} className="text-red-600 text-sm font-medium">
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Presets</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onFromChange(preset.from)
                  onToChange(preset.to)
                }}
                className={`py-2 px-3 border rounded-lg text-xs font-medium transition-all ${
                  currentPreset?.label === preset.label
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              From Year
            </label>
            <input
              type="number"
              placeholder="Any"
              value={yearFrom}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
              To Year
            </label>
            <input
              type="number"
              placeholder="Any"
              value={yearTo}
              onChange={(e) => onToChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <button
          onClick={onApply}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Year Range
        </button>
      </div>
    </>
  )
}

function SortFilterPage({
  selectedSort,
  onSelect,
  onBack
}: {
  selectedSort: string
  onSelect: (sort: string) => void
  onBack: () => void
}) {
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'budget-high', label: 'Budget: High to Low' },
    { value: 'budget-low', label: 'Budget: Low to High' },
    { value: 'urgency', label: 'Most Urgent' }
  ]

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Sort By</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {sortOptions.map((option) => (
            <li key={option.value}>
              <button
                onClick={() => onSelect(option.value)}
                className={`w-full text-left py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedSort === option.value
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{option.label}</span>
                {selectedSort === option.value && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
