'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (searchInput.trim()) {
      params.set('search', searchInput.trim())
    } else {
      params.delete('search')
    }
    
    // Reset to page 1 when searching
    params.delete('page')
    
    router.push(`/wanted?${params.toString()}`)
  }, [searchInput, searchParams, router])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }, [handleSearch])

  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Search by make, model, year, or location"
        className="w-full px-6 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        onClick={handleSearch}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors focus:outline-none"
        aria-label="Search"
      >
        <Search size={16} />
      </button>
    </div>
  )
}

