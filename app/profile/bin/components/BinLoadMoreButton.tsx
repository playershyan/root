'use client'

/**
 * Load More Button for Bin Items
 * 
 * Interactive button for pagination
 * Uses URL-based state and optimistic navigation
 */

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

interface BinLoadMoreButtonProps {
  currentPage: number
  hasMore: boolean
}

export default function BinLoadMoreButton({ currentPage, hasMore }: BinLoadMoreButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleLoadMore = () => {
    setLoading(true)
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', (currentPage + 1).toString())
      
      router.push(`/profile/bin?${params.toString()}`, { scroll: false })
      setLoading(false)
    })
  }

  if (!hasMore) {
    return (
      <div className="text-center mt-6">
        <p className="text-gray-500 text-sm">No more items to load</p>
      </div>
    )
  }

  return (
    <div className="text-center mt-6">
      <button
        onClick={handleLoadMore}
        disabled={loading || isPending}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading || isPending ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Loading...
          </span>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  )
}

