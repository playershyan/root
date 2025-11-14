'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface LoadMoreButtonProps {
  currentPage: number
  hasMore: boolean
}

export default function LoadMoreButton({ currentPage, hasMore }: LoadMoreButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleLoadMore = async () => {
    setLoading(true)
    
    startTransition(() => {
      const nextPage = currentPage + 1
      const params = new URLSearchParams(window.location.search)
      params.set('page', nextPage.toString())
      
      router.push(`/wanted?${params.toString()}`, { scroll: false })
      setLoading(false)
    })
  }

  if (!hasMore) {
    return (
      <div className="text-center mt-6">
        <p className="text-gray-500 text-sm">No more wanted requests to load</p>
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

