'use client'

import { useState } from 'react'
import { ArrowLeft, Trash2, Camera, MapPin, Car, Search, RotateCcw, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import BinLoadMoreButton from './components/BinLoadMoreButton'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Helper to format date
function formatDeletedDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

interface BinItem {
  id: string
  item_type: 'listing' | 'wanted_request'
  deleted_at: string
  listing?: {
    id: string
    title: string
    price: number
    location: string
    primary_image_url?: string
    image_url?: string
    image_urls?: string[]
  }
  wanted_request?: {
    id: string
    title: string
    min_budget?: number
    max_budget?: number
    location: string
  }
}

interface BinPageClientProps {
  items: BinItem[]
  totalCount: number
  hasMore: boolean
  currentPage: number
}

export default function BinPageClient({
  items: initialItems,
  totalCount,
  hasMore,
  currentPage
}: BinPageClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [items, setItems] = useState(initialItems)
  const [restoring, setRestoring] = useState<string | null>(null)

  // Handle restore item
  const handleRestore = async (itemId: string, itemType: string) => {
    if (!confirm('Restore this item?')) return

    setRestoring(itemId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/bin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'restore',
          item_type: itemType,
          item_id: itemId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore item')
      }

      const data = await response.json()
      toast.success(data.message || 'Item restored successfully')
      
      if (data.next_steps) {
        toast.info(data.next_steps, { duration: 5000 })
      }

      router.refresh()
    } catch (error) {
      logger.error('Error restoring item', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to restore item')
    } finally {
      setRestoring(null)
    }
  }

  // Handle delete permanently
  const handleDeletePermanently = async (itemId: string, itemType: string) => {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/bin', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete item')
      }

      toast.success('Item permanently deleted')
      router.refresh()
    } catch (error) {
      logger.error('Error deleting item permanently', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete item')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">Bin</h1>
            </div>
            <p className="text-gray-600">
              {totalCount} deleted item{totalCount !== 1 ? 's' : ''} • Items are permanently deleted after 30 days
            </p>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">Bin is empty</p>
                <p className="text-sm text-gray-600">
                  Deleted items will appear here for 30 days
                </p>
              </div>
            ) : (
              <>
                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const isListing = item.item_type === 'listing' && item.listing
                    const isWanted = item.item_type === 'wanted_request' && item.wanted_request
                    const listing = item.listing
                    const wanted = item.wanted_request
                    const imageUrl = listing ? (listing.primary_image_url || listing.image_url || listing.image_urls?.[0]) : null
                    const budget = wanted ? (wanted.max_budget || wanted.min_budget || 0) : 0

                    return (
                      <div
                        key={item.id}
                        className="bg-white border rounded-lg shadow-sm p-4 relative"
                      >
                        {/* Item Type Badge */}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded">
                          {isListing ? 'Listing' : 'Wanted Request'}
                        </div>

                        {isListing && listing ? (
                          /* Listing Item */
                          <>
                            <div className="aspect-video bg-gray-200 rounded mb-3 overflow-hidden flex items-center justify-center">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                              {listing.title}
                            </h3>
                            <p className="text-lg font-bold text-blue-600 mb-2">
                              Rs. {listing.price.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                              <MapPin className="w-3.5 h-3.5" />
                              {listing.location}
                            </p>
                          </>
                        ) : isWanted && wanted ? (
                          /* Wanted Request Item */
                          <>
                            <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                              <Search className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                              {wanted.title}
                            </h3>
                            <p className="text-lg font-bold text-green-600 mb-2">
                              Budget: Rs. {budget.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                              <MapPin className="w-3.5 h-3.5" />
                              {wanted.location}
                            </p>
                          </>
                        ) : null}

                        {/* Deleted date */}
                        <p className="text-xs text-gray-500 mb-3">
                          Deleted {formatDeletedDate(item.deleted_at)}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleRestore(
                              isListing ? listing!.id : wanted!.id,
                              item.item_type
                            )}
                            disabled={restoring === item.id}
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {restoring === item.id ? 'Restoring...' : 'Restore'}
                          </Button>
                          <Button
                            onClick={() => handleDeletePermanently(
                              isListing ? listing!.id : wanted!.id,
                              item.item_type
                            )}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Load More Button */}
                <BinLoadMoreButton currentPage={currentPage} hasMore={hasMore} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

