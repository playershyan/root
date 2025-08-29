'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

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
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
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
        setFavorites(favorites)
        console.error('Failed to update favorite')
        throw new Error('Failed to update favorite')
      }
    } catch (error) {
      // Revert on error
      setFavorites(favorites)
      console.error('Error updating favorite:', error)
      throw error
    }

    return !isFavorite
  }, [favorites, user])

  // Check if a listing is favorited
  const isFavorited = useCallback((listingId: string) => {
    return favorites.includes(listingId)
  }, [favorites])

  // Load favorites on mount
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