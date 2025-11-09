'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { logger } from '@/lib/utils/logger'

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch favorites from database
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      // Guests don't have favorites
      setFavorites([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites || [])
      } else {
        logger.error('Failed to fetch favorites', new Error(`HTTP ${response.status}`))
        setFavorites([])
      }
    } catch (error) {
      logger.error('Error fetching favorites', error as Error)
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (listingId: string) => {
    if (!user) {
      // Guests cannot toggle favorites
      throw new Error('User must be logged in to manage favorites')
    }

    const isFavorite = favorites.includes(listingId)
    const newFavorites = isFavorite
      ? favorites.filter(id => id !== listingId)
      : [...favorites, listingId]

    // Store previous state for potential revert
    const previousFavorites = [...favorites]

    // Update local state immediately for responsiveness
    setFavorites(newFavorites)

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          action: isFavorite ? 'remove' : 'add'
        })
      })

      if (!response.ok) {
        // Revert on error
        setFavorites(previousFavorites)
        const errorData = await response.json().catch(() => ({}))
        logger.error('Failed to update favorite', new Error(errorData.error || 'Failed to update favorite'))
        throw new Error(errorData.error || 'Failed to update favorite')
      }

      // Verify the response
      const result = await response.json()
      logger.debug('Favorite updated', { result })

    } catch (error) {
      // Revert on error
      setFavorites(previousFavorites)
      logger.error('Error updating favorite', error as Error)
      throw error
    }

    return !isFavorite
  }, [favorites, user])

  // Check if a listing is favorited
  const isFavorited = useCallback((listingId: string) => {
    return favorites.includes(listingId)
  }, [favorites])

  // Load favorites on mount and when user changes
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites
  }
}