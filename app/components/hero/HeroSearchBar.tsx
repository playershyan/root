'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PLACEHOLDER_TEXTS = [
  "Toyota Prius 2019",
  "Honda Civic Kandy",
  "Suzuki Alto 2015"
]

export default function HeroSearchBar() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const [placeholderText, setPlaceholderText] = useState(PLACEHOLDER_TEXTS[0])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Animated placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_TEXTS.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setPlaceholderText(PLACEHOLDER_TEXTS[placeholderIndex])
  }, [placeholderIndex])

  // Handle search
  const handleSearch = useCallback(() => {
    const trimmedSearch = searchInput.trim()
    if (trimmedSearch) {
      router.push(`/listings?q=${encodeURIComponent(trimmedSearch)}`)
    } else {
      router.push('/listings')
    }
  }, [searchInput, router])

  // Handle search on Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholderText}
          className="w-full px-6 py-5 pr-14 border-2 border-blue-400 rounded-full text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 shadow-lg"
        />
        <button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 p-3 rounded-full hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
