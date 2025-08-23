'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { countries, Country, getSavedCountry, saveCountry } from '@/lib/data/countries'

interface CountrySelectorProps {
  selectedCountry: Country
  onCountrySelect: (country: Country) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export default function CountrySelector({
  selectedCountry,
  onCountrySelect,
  disabled = false,
  className = '',
  placeholder = 'Select country'
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter countries based on search term
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleCountrySelect = (country: Country) => {
    onCountrySelect(country)
    saveCountry(country) // Save selection to localStorage
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Country Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-3 py-3 h-[50px]
          border border-gray-300 rounded-l-lg bg-white
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-lg flex-shrink-0">{selectedCountry.flag}</span>
          <span className="text-sm text-gray-700 truncate">+{selectedCountry.dialCode}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl min-w-[320px] max-w-[400px] overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none
                    flex items-center space-x-3 transition-all duration-150 border-b border-gray-50 last:border-b-0
                    ${selectedCountry.code === country.code ? 'bg-blue-100 text-blue-700' : 'text-gray-800 hover:text-blue-600'}
                  `}
                >
                  <span className="text-xl flex-shrink-0 w-8 text-center">{country.flag}</span>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="font-medium text-sm leading-5 pr-2">{country.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                      +{country.dialCode}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for managing country state with localStorage persistence
export const useCountrySelector = (fallbackCountryCode?: string) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    // During SSR, return Sri Lanka as default
    if (typeof window === 'undefined') {
      if (fallbackCountryCode) {
        const country = countries.find(c => c.code === fallbackCountryCode)
        if (country) return country
      }
      return countries.find(c => c.code === 'LK') || countries[0]
    }
    
    // On client side, try to get saved country from localStorage
    return getSavedCountry()
  })

  // Hydrate with saved country after component mounts (only once)
  useEffect(() => {
    const savedCountry = getSavedCountry()
    if (savedCountry.code !== selectedCountry.code) {
      setSelectedCountry(savedCountry)
    }
  }, [])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    saveCountry(country) // Automatically save to localStorage
  }

  return {
    selectedCountry,
    setSelectedCountry: handleCountrySelect,
    dialCode: selectedCountry.dialCode,
    countryCode: selectedCountry.code,
    flag: selectedCountry.flag,
    name: selectedCountry.name
  }
}