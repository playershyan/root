/**
 * Favorites Hook
 * Centralized favorites state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/services/apiClient'
import { logger } from '@/lib/utils/logger'

export interface Favorite {
  id: string
  title: string
  description?: string
  price: number
  location: string
  image?: string
  postedDate?: string
  seller?: string
}

interface UseFavoritesReturn {
  favoritedAds: Favorite[]
  favoritedWantedRequests: Favorite[]
  loading: boolean

  // Operations
  fetchFavorites: () => Promise<void>
  toggleFavorite: (itemId: string, type: 'listing' | 'wanted') => Promise<{ success: boolean; error?: string }>
  isFavorited: (itemId: string) => boolean
}

export function useFavorites(userId?: string): UseFavoritesReturn {
  const [favoritedAds, setFavoritedAds] = useState<Favorite[]>([])
  const [favoritedWantedRequests, setFavoritedWantedRequests] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavoritedAds([])
      setFavoritedWantedRequests([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const response = await api.get<{ listings: any[] }>('/api/favorites/listings')

      if (response.success && response.data) {
        const formattedAds: Favorite[] = response.data.listings.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          description: '',
          price: listing.price,
          image: listing.image_urls?.[0] || listing.image_url || '/api/placeholder/400/300',
          location: listing.location,
          postedDate: new Date(listing.created_at).toLocaleDateString(),
          seller: listing.seller_name
        }))

        setFavoritedAds(formattedAds)
      }

      // TODO: Fetch favorited wanted requests when API is available
      setFavoritedWantedRequests([])
    } catch (error) {
      logger.error('Error loading favorites', error as Error)
      setFavoritedAds([])
      setFavoritedWantedRequests([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Toggle favorite
  const toggleFavorite = useCallback(async (itemId: string, type: 'listing' | 'wanted') => {
    const isFav = isFavorited(itemId)

    const response = await api.post('/api/favorites', {
      item_id: itemId,
      item_type: type,
      action: isFav ? 'remove' : 'add'
    })

    if (response.success) {
      // Refresh favorites after toggle
      await fetchFavorites()
      return { success: true }
    }

    return {
      success: false,
      error: response.error || `Failed to ${isFav ? 'remove' : 'add'} favorite`
    }
  }, [fetchFavorites])

  // Check if item is favorited
  const isFavorited = useCallback((itemId: string): boolean => {
    return (
      favoritedAds.some(ad => ad.id === itemId) ||
      favoritedWantedRequests.some(req => req.id === itemId)
    )
  }, [favoritedAds, favoritedWantedRequests])

  // Auto-fetch on mount
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favoritedAds,
    favoritedWantedRequests,
    loading,
    fetchFavorites,
    toggleFavorite,
    isFavorited
  }
}
