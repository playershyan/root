'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFavorites } from '@/app/hooks/useFavorites'
import { useCallback } from 'react'
import FavoritesTab from '@/app/components/favorites/FavoritesTab'
import { FavoriteAdData, FavoriteWantedData } from '@/lib/utils/favoritesUtils'
import { Button } from '@/components/ui/button'

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { favoritedAds, favoritedWantedRequests, loading, toggleFavorite, fetchFavorites } = useFavorites(user?.id)

  // Remove ad from favorites
  const handleRemoveAdFromFavorites = useCallback(async (itemId: string) => {
    if (confirm('Remove this item from your favorites?')) {
      const result = await toggleFavorite(itemId, 'listing')
      if (result.success) {
        // Refresh favorites list
        await fetchFavorites()
      } else {
        alert(result.error || 'Failed to remove from favorites')
      }
    }
  }, [toggleFavorite, fetchFavorites])

  // Remove wanted request from favorites
  const handleRemoveWantedFromFavorites = useCallback(async (itemId: string) => {
    if (confirm('Remove this item from your favorites?')) {
      const result = await toggleFavorite(itemId, 'wanted')
      if (result.success) {
        // Refresh favorites list
        await fetchFavorites()
      } else {
        alert(result.error || 'Failed to remove from favorites')
      }
    }
  }, [toggleFavorite, fetchFavorites])

  // Share ad
  const handleShareAd = useCallback((itemId: string) => {
    const url = `/listings/${itemId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this vehicle',
        url
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      alert('Link copied to clipboard!')
    }
  }, [])

  // Share wanted request
  const handleShareWanted = useCallback((itemId: string) => {
    const url = `/wanted/${itemId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this wanted request',
        url
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      alert('Link copied to clipboard!')
    }
  }, [])

  // Transform hook data to component format
  const favoriteAdsData: FavoriteAdData[] = favoritedAds.map(ad => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    location: ad.location,
    image: ad.image,
    postedDate: ad.postedDate,
    seller: ad.seller
  }))

  const favoriteWantedData: FavoriteWantedData[] = favoritedWantedRequests.map(request => ({
    id: request.id,
    title: request.title,
    description: request.description || '',
    budget: request.price,
    location: request.location,
    postedDate: request.postedDate || new Date().toISOString()
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <FavoritesTab
          favoriteAds={favoriteAdsData}
          favoriteWanted={favoriteWantedData}
          onRemoveAdFromFavorites={handleRemoveAdFromFavorites}
          onRemoveWantedFromFavorites={handleRemoveWantedFromFavorites}
          onShareAd={handleShareAd}
          onShareWanted={handleShareWanted}
          loading={loading}
        />
      </div>
    </div>
  )
}
