'use client'

import { useState } from 'react'
import LocationFilter from '@/app/components/LocationFilter'
import { getVehicleCategories, getMakesByCategory, getModelsByMake, getCategoryInfo } from '@/lib/constants/vehicleData'

interface MobileFilterSheetProps {
  // Filter states
  category: string
  selectedLocation: string | null
  make: string
  model: string
  minYear: string
  maxYear: string
  minPrice: string
  maxPrice: string
  fuelTypes: string[]
  transmissionTypes: string[]
  urgentOnly: boolean
  sortBy: string

  // Filter setters
  onCategoryChange: (category: string) => void
  onLocationChange: (location: string | null) => void
  onMakeChange: (make: string) => void
  onModelChange: (model: string) => void
  onMinYearChange: (year: string) => void
  onMaxYearChange: (year: string) => void
  onMinPriceChange: (price: string) => void
  onMaxPriceChange: (price: string) => void
  onFuelTypesChange: (fuels: string[]) => void
  onTransmissionTypesChange: (transmissions: string[]) => void
  onUrgentOnlyChange: (urgent: boolean) => void
  onSortByChange: (sort: string) => void

  // UI state
  isOpen: boolean
  onClose: () => void
}

type FilterPage = 'main' | 'category' | 'location' | 'make' | 'model' | 'price' | 'year' | 'fuel' | 'transmission' | 'sort'

export default function MobileFilterSheet({
  category,
  selectedLocation,
  make,
  model,
  minYear,
  maxYear,
  minPrice,
  maxPrice,
  fuelTypes,
  transmissionTypes,
  urgentOnly,
  sortBy,
  onCategoryChange,
  onLocationChange,
  onMakeChange,
  onModelChange,
  onMinYearChange,
  onMaxYearChange,
  onMinPriceChange,
  onMaxPriceChange,
  onFuelTypesChange,
  onTransmissionTypesChange,
  onUrgentOnlyChange,
  onSortByChange,
  isOpen,
  onClose
}: MobileFilterSheetProps) {
  const selectedVehicleCategory = category
  const selectedMake = make
  const selectedModel = model
  const [currentPage, setCurrentPage] = useState<FilterPage>('main')
  const [makeSearchTerm, setMakeSearchTerm] = useState('')
  const [modelSearchTerm, setModelSearchTerm] = useState('')
  const [tempMinPrice, setTempMinPrice] = useState(minPrice)
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice)
  const [tempMinYear, setTempMinYear] = useState(minYear)
  const [tempMaxYear, setTempMaxYear] = useState(maxYear)
  const [locationExpanded, setLocationExpanded] = useState(true)

  if (!isOpen) return null

  // Calculate active filter count
  const activeCount = [
    selectedVehicleCategory,
    selectedLocation && selectedLocation !== 'All of Sri Lanka',
    selectedMake !== 'All Makes',
    selectedModel !== 'All Models',
    minYear || maxYear,
    minPrice || maxPrice,
    fuelTypes.length > 0,
    transmissionTypes.length > 0,
    urgentOnly
  ].filter(Boolean).length

  const showPage = (page: FilterPage) => {
    setCurrentPage(page)
  }

  const showMain = () => {
    setCurrentPage('main')
  }

  const getFilterValue = (filterType: string): { text: string; active: boolean } => {
    switch (filterType) {
      case 'category':
        return {
          text: selectedVehicleCategory ? getCategoryInfo(selectedVehicleCategory)?.label || '' : '',
          active: !!selectedVehicleCategory
        }
      case 'location':
        return {
          text: selectedLocation || 'All Sri Lanka',
          active: !!selectedLocation && selectedLocation !== 'All of Sri Lanka'
        }
      case 'make':
        return {
          text: selectedMake,
          active: selectedMake !== 'All Makes'
        }
      case 'model':
        return {
          text: selectedModel,
          active: selectedModel !== 'All Models'
        }
      case 'price':
        if (minPrice || maxPrice) {
          const min = minPrice ? `Rs. ${parseInt(minPrice).toLocaleString()}` : 'Any'
          const max = maxPrice ? `Rs. ${parseInt(maxPrice).toLocaleString()}` : 'Any'
          return { text: `${min} - ${max}`, active: true }
        }
        return { text: 'Any', active: false }
      case 'year':
        if (minYear || maxYear) {
          return { text: `${minYear || 'Any'} - ${maxYear || 'Any'}`, active: true }
        }
        return { text: 'Any', active: false }
      case 'fuel':
        return {
          text: fuelTypes.length > 0 ? `${fuelTypes.length} selected` : 'Any',
          active: fuelTypes.length > 0
        }
      case 'transmission':
        return {
          text: transmissionTypes.length > 0 ? `${transmissionTypes.length} selected` : 'Any',
          active: transmissionTypes.length > 0
        }
      case 'sort':
        const sortLabels: Record<string, string> = {
          'recent': 'Most Recent',
          'price-low': 'Price: Low to High',
          'price-high': 'Price: High to Low',
          'year-new': 'Year: Newest First',
          'year-old': 'Year: Oldest First',
          'mileage-low': 'Mileage: Lowest First'
        }
        return { text: sortLabels[sortBy] || 'Most Recent', active: sortBy !== 'recent' }
      default:
        return { text: '', active: false }
    }
  }

  const FilterRow = ({ label, filterType, onClick }: { label: string; filterType: string; onClick: () => void }) => {
    const { text, active } = getFilterValue(filterType)

    return (
      <li className="border-b border-gray-100 last:border-b-0">
        <button
          onClick={onClick}
          className="flex justify-between items-center w-full py-3 px-4 text-left text-sm active:bg-gray-50 transition-colors"
        >
          <span className="font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-2">
            {active && text ? (
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded max-w-[120px] truncate">
                {text}
              </span>
            ) : (
              <span className="text-sm text-gray-500">{text || 'Any'}</span>
            )}
            <span className="text-gray-400 text-xs">›</span>
          </div>
        </button>
      </li>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col lg:hidden">
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
            {!selectedVehicleCategory ? (
              <div className="p-4">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <i className="fas fa-hand-point-down text-4xl text-blue-600 mb-3 animate-bounce"></i>
                    <h3 className="text-lg font-bold text-blue-900 mb-2">Start Here!</h3>
                    <p className="text-sm text-blue-700 mb-4">Select a vehicle category first to see all available filters</p>
                    <button
                      onClick={() => showPage('category')}
                      className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-base hover:bg-blue-700 active:bg-blue-800 transition-colors"
                    >
                      Choose Vehicle Category
                    </button>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-400">
                  Other filters will appear after selecting a category
                </div>
              </div>
            ) : (
              <ul>
                <FilterRow label="Category" filterType="category" onClick={() => showPage('category')} />
                <FilterRow label="Sort by" filterType="sort" onClick={() => showPage('sort')} />
                <FilterRow label="Location" filterType="location" onClick={() => showPage('location')} />
                <FilterRow label="Make" filterType="make" onClick={() => showPage('make')} />
                <FilterRow label="Model" filterType="model" onClick={() => showPage('model')} />
                <FilterRow label="Price" filterType="price" onClick={() => showPage('price')} />
                <FilterRow label="Year" filterType="year" onClick={() => showPage('year')} />
                {!['bicycle'].includes(selectedVehicleCategory) && (
                  <>
                    <FilterRow label="Fuel Type" filterType="fuel" onClick={() => showPage('fuel')} />
                    <FilterRow label="Transmission" filterType="transmission" onClick={() => showPage('transmission')} />
                  </>
                )}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Category Filter Page */}
      {currentPage === 'category' && (
        <CategoryFilterPage
          selectedCategory={selectedVehicleCategory}
          onSelect={onCategoryChange}
          onBack={showMain}
        />
      )}

      {/* Location Filter Page */}
      {currentPage === 'location' && (
        <LocationFilterPage
          selectedLocation={selectedLocation}
          onLocationChange={onLocationChange}
          onBack={showMain}
        />
      )}

      {/* Make Filter Page */}
      {currentPage === 'make' && (
        <MakeFilterPage
          selectedCategory={selectedVehicleCategory}
          selectedMake={selectedMake}
          onSelect={onMakeChange}
          onBack={showMain}
          searchTerm={makeSearchTerm}
          onSearchChange={setMakeSearchTerm}
        />
      )}

      {/* Model Filter Page */}
      {currentPage === 'model' && (
        <ModelFilterPage
          selectedCategory={selectedVehicleCategory}
          selectedMake={selectedMake}
          selectedModel={selectedModel}
          onSelect={onModelChange}
          onBack={showMain}
          searchTerm={modelSearchTerm}
          onSearchChange={setModelSearchTerm}
        />
      )}

      {/* Price Filter Page */}
      {currentPage === 'price' && (
        <PriceFilterPage
          minPrice={tempMinPrice}
          maxPrice={tempMaxPrice}
          onMinChange={setTempMinPrice}
          onMaxChange={setTempMaxPrice}
          onApply={() => {
            onMinPriceChange(tempMinPrice)
            onMaxPriceChange(tempMaxPrice)
            showMain()
          }}
          onBack={showMain}
          onClear={() => {
            setTempMinPrice('')
            setTempMaxPrice('')
            onMinPriceChange('')
            onMaxPriceChange('')
          }}
        />
      )}

      {/* Year Filter Page */}
      {currentPage === 'year' && (
        <YearFilterPage
          minYear={tempMinYear}
          maxYear={tempMaxYear}
          onMinChange={setTempMinYear}
          onMaxChange={setTempMaxYear}
          onApply={() => {
            onMinYearChange(tempMinYear)
            onMaxYearChange(tempMaxYear)
            showMain()
          }}
          onBack={showMain}
          onClear={() => {
            setTempMinYear('')
            setTempMaxYear('')
            onMinYearChange('')
            onMaxYearChange('')
          }}
        />
      )}

      {/* Fuel Type Filter Page */}
      {currentPage === 'fuel' && (
        <FuelFilterPage
          selectedFuels={fuelTypes}
          onToggle={(fuel) => {
            if (fuelTypes.includes(fuel)) {
              onFuelTypesChange(fuelTypes.filter(f => f !== fuel))
            } else {
              onFuelTypesChange([...fuelTypes, fuel])
            }
          }}
          onBack={showMain}
          onClear={() => onFuelTypesChange([])}
        />
      )}

      {/* Transmission Filter Page */}
      {currentPage === 'transmission' && (
        <TransmissionFilterPage
          selectedTransmissions={transmissionTypes}
          onToggle={(trans) => {
            if (transmissionTypes.includes(trans)) {
              onTransmissionTypesChange(transmissionTypes.filter(t => t !== trans))
            } else {
              onTransmissionTypesChange([...transmissionTypes, trans])
            }
          }}
          onBack={showMain}
          onClear={() => onTransmissionTypesChange([])}
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
  )
}

// Sub-components for each filter page

function CategoryFilterPage({
  selectedCategory,
  onSelect,
  onBack
}: {
  selectedCategory: string
  onSelect: (category: string) => void
  onBack: () => void
}) {
  const categories = getVehicleCategories()

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Vehicle Category</h2>
        {selectedCategory && (
          <button
            onClick={() => onSelect('')}
            className="text-red-600 text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs text-gray-600 mb-4 text-center bg-gray-50 py-3 px-4 rounded-lg">
          Select the type of vehicle you're looking for
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => {
                onSelect(category.value)
                onBack()
              }}
              className={`w-full p-4 border-2 rounded-lg transition-all flex items-center gap-4 ${
                selectedCategory === category.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white active:bg-gray-50'
              }`}
            >
              <i className={`${category.icon} text-2xl ${selectedCategory === category.value ? 'text-blue-600' : 'text-gray-600'}`}></i>
              <div className="flex-1 text-left">
                <div className={`text-sm font-semibold mb-0.5 ${selectedCategory === category.value ? 'text-blue-700' : 'text-gray-700'}`}>
                  {category.label}
                </div>
                <div className="text-xs text-gray-500">{category.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

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
          variant="compact"
        />
      </div>
    </>
  )
}

function MakeFilterPage({
  selectedCategory,
  selectedMake,
  onSelect,
  onBack,
  searchTerm,
  onSearchChange
}: {
  selectedCategory: string
  selectedMake: string
  onSelect: (make: string) => void
  onBack: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
}) {
  const makes = getMakesByCategory(selectedCategory)
  const filteredMakes = searchTerm
    ? makes.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <li key={make.id}>
              <button
                onClick={() => {
                  onSelect(make.name)
                  onBack()
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                  selectedMake === make.name
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{make.name}</span>
                {selectedMake === make.name && (
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
  selectedCategory,
  selectedMake,
  selectedModel,
  onSelect,
  onBack,
  searchTerm,
  onSearchChange
}: {
  selectedCategory: string
  selectedMake: string
  selectedModel: string
  onSelect: (model: string) => void
  onBack: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
}) {
  const makes = getMakesByCategory(selectedCategory)
  const make = makes.find(m => m.name === selectedMake)
  const models = make?.models || []
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

function PriceFilterPage({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onApply,
  onBack,
  onClear
}: {
  minPrice: string
  maxPrice: string
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

  const currentPreset = presets.find(p => p.min === minPrice && p.max === maxPrice)

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Price Range</h2>
        {(minPrice || maxPrice) && (
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
              value={minPrice}
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
              value={maxPrice}
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
          Apply Price Range
        </button>
      </div>
    </>
  )
}

function YearFilterPage({
  minYear,
  maxYear,
  onMinChange,
  onMaxChange,
  onApply,
  onBack,
  onClear
}: {
  minYear: string
  maxYear: string
  onMinChange: (val: string) => void
  onMaxChange: (val: string) => void
  onApply: () => void
  onBack: () => void
  onClear: () => void
}) {
  const currentYear = new Date().getFullYear()
  const presets = [
    { label: `${currentYear}+`, min: String(currentYear), max: '' },
    { label: `${currentYear - 3}+`, min: String(currentYear - 3), max: '' },
    { label: `${currentYear - 5}+`, min: String(currentYear - 5), max: '' },
    { label: `${currentYear - 10}+`, min: String(currentYear - 10), max: '' },
    { label: `${currentYear - 20}+`, min: String(currentYear - 20), max: '' },
    { label: 'Any', min: '', max: '' }
  ]

  const currentPreset = presets.find(p => p.min === minYear && p.max === maxYear)

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Year Range</h2>
        {(minYear || maxYear) && (
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
              From Year
            </label>
            <input
              type="number"
              placeholder="Any"
              value={minYear}
              onChange={(e) => onMinChange(e.target.value)}
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
              value={maxYear}
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
          Apply Year Range
        </button>
      </div>
    </>
  )
}

function FuelFilterPage({
  selectedFuels,
  onToggle,
  onBack,
  onClear
}: {
  selectedFuels: string[]
  onToggle: (fuel: string) => void
  onBack: () => void
  onClear: () => void
}) {
  const fuels = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG']

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Fuel Type</h2>
        {selectedFuels.length > 0 && (
          <button onClick={onClear} className="text-red-600 text-sm font-medium">
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {fuels.map((fuel) => {
            const isSelected = selectedFuels.includes(fuel)
            return (
              <button
                key={fuel}
                onClick={() => onToggle(fuel)}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700">{fuel}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <button
          onClick={onBack}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Fuel Types {selectedFuels.length > 0 && `(${selectedFuels.length})`}
        </button>
      </div>
    </>
  )
}

function TransmissionFilterPage({
  selectedTransmissions,
  onToggle,
  onBack,
  onClear
}: {
  selectedTransmissions: string[]
  onToggle: (transmission: string) => void
  onBack: () => void
  onClear: () => void
}) {
  const transmissions = ['Manual', 'Automatic', 'Semi-Automatic', 'CVT']

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="text-blue-600 text-2xl leading-none">‹</button>
        <h2 className="text-base font-semibold text-gray-900 flex-1">Transmission</h2>
        {selectedTransmissions.length > 0 && (
          <button onClick={onClear} className="text-red-600 text-sm font-medium">
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {transmissions.map((transmission) => {
            const isSelected = selectedTransmissions.includes(transmission)
            return (
              <button
                key={transmission}
                onClick={() => onToggle(transmission)}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700">{transmission}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <button
          onClick={onBack}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          Apply Transmissions {selectedTransmissions.length > 0 && `(${selectedTransmissions.length})`}
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
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'year-new', label: 'Year: Newest First' },
    { value: 'year-old', label: 'Year: Oldest First' },
    { value: 'mileage-low', label: 'Mileage: Lowest First' }
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
