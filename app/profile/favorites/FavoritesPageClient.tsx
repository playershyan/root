'use client'

import { useState } from 'react'
import { ArrowLeft, Heart, Camera, MapPin, Trash2, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import FavoritesLoadMoreButton from './components/FavoritesLoadMoreButton'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'

interface Favorite {
  id: string
  item_type: 'listing' | 'wanted_request'
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

interface FavoritesPageClientProps {
  favorites: Favorite[]
  totalCount: number
  hasMore: boolean
  currentPage: number
}

export default function FavoritesPageClient({
  favorites: initialFavorites,
  totalCount,
  hasMore,
  currentPage
}: FavoritesPageClientProps) {
  const router = useRouter()
  const [favorites, setFavorites] = useState(initialFavorites)

  // Separate listings and wanted requests
  const favoriteListings = favorites.filter(f => f.item_type === 'listing' && f.listing)
  const favoriteWantedRequests = favorites.filter(f => f.item_type === 'wanted_request' && f.wanted_request)

  // Handle remove from favorites
  const handleRemoveFavorite = async (favoriteId: string, itemType: string) => {
    if (!confirm('Remove this item from your favorites?')) {
      return
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove from favorites')
      }

      toast.success('Removed from favorites')
      router.refresh()
    } catch (error) {
      logger.error('Error removing from favorites', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove from favorites')
    }
  }

  // Handle share listing
  const handleShareListing = (listingId: string) => {
    const url = `/listings/${listingId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this vehicle',
        url: `${window.location.origin}${url}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      toast.success('Link copied to clipboard!')
    }
  }

  // Handle share wanted request
  const handleShareWanted = (wantedId: string) => {
    const url = `/wanted/${wantedId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this wanted request',
        url: `${window.location.origin}${url}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      toast.success('Link copied to clipboard!')
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
            <h1 className="text-2xl font-semibold">Favorites</h1>
            <p className="text-gray-600 mt-2">
              {totalCount} favorite{totalCount !== 1 ? 's' : ''} saved
            </p>
          </div>

          <div className="p-6">
            {favorites.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No favorites yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Save listings and wanted requests to find them easily later
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="primary" size="default">
                    <Link href="/">Browse Listings</Link>
                  </Button>
                  <Button asChild variant="outline" size="default">
                    <Link href="/wanted">Browse Wanted Requests</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Favorite Listings */}
                {favoriteListings.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      Saved Listings ({favoriteListings.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteListings.map((fav) => {
                        const listing = fav.listing!
                        const imageUrl = listing.primary_image_url || listing.image_url || listing.image_urls?.[0]
                        
                        return (
                          <div key={fav.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden relative group">
                            <Link href={`/listings/${listing.id}`}>
                              <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
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
                              <div className="p-4">
                                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                                  {listing.title}
                                </h3>
                                <p className="text-lg font-bold text-blue-600 mb-2">
                                  Rs. {listing.price.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {listing.location}
                                </p>
                              </div>
                            </Link>
                            
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleShareListing(listing.id)}
                                className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-md transition-colors"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => handleRemoveFavorite(fav.id, 'listing')}
                                className="bg-white hover:bg-red-50 p-2 rounded-lg shadow-md transition-colors"
                                title="Remove from favorites"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Favorite Wanted Requests */}
                {favoriteWantedRequests.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      Saved Wanted Requests ({favoriteWantedRequests.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteWantedRequests.map((fav) => {
                        const wanted = fav.wanted_request!
                        const budget = wanted.max_budget || wanted.min_budget || 0
                        
                        return (
                          <div key={fav.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 relative group">
                            <Link href={`/wanted/${wanted.id}`}>
                              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                                {wanted.title}
                              </h3>
                              <p className="text-lg font-bold text-green-600 mb-2">
                                Budget: Rs. {budget.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {wanted.location}
                              </p>
                            </Link>
                            
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleShareWanted(wanted.id)}
                                className="bg-white hover:bg-gray-100 p-2 rounded-lg shadow-md transition-colors border"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => handleRemoveFavorite(fav.id, 'wanted_request')}
                                className="bg-white hover:bg-red-50 p-2 rounded-lg shadow-md transition-colors border"
                                title="Remove from favorites"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Load More Button */}
                <FavoritesLoadMoreButton currentPage={currentPage} hasMore={hasMore} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

