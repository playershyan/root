'use client'

/**
 * Filter Dropdown Client Component
 * 
 * Interactive dropdown for filtering listings by status
 * Uses URL-based state for shareable/bookmarkable filters
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function FilterDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'

  const handleFilterChange = useCallback((newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newStatus !== 'all') {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    
    // Reset to page 1 when changing filter
    params.delete('page')
    
    router.push(`/profile/listings?${params.toString()}`)
  }, [router, searchParams])

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleFilterChange(e.target.value)}
      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="all">All Listings</option>
      <option value="active">Active</option>
      <option value="sold">Sold</option>
      <option value="pending">Under Review</option>
      <option value="paused">Paused</option>
      <option value="reported">Reported</option>
    </select>
  )
}

