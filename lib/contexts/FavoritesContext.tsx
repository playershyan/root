'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

// Context for sharing favorites state across components
interface FavoritesContextType {
  favorites: string[]
  loading: boolean
  toggleFavorite: (listingId: string) => Promise<boolean>
  isFavorited: (listingId: string) => boolean
  refetch: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

// Provider component
export function FavoritesProvider({ children }: { children: ReactNode }) {
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
        console.error('Failed to fetch favorites:', response.status)
        setFavorites([])
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
    console.log('FavoritesContext toggleFavorite called', {
      listingId,
      user: !!user,
      currentFavorites: favorites,
      userId: user?.id
    })

    if (!user) {
      // Guests cannot toggle favorites
      console.log('No user - throwing error')
      throw new Error('User must be logged in to manage favorites')
    }

    const isFavorite = favorites.includes(listingId)
    console.log('Current state:', { isFavorite, favorites })

    const newFavorites = isFavorite
      ? favorites.filter(id => id !== listingId)
      : [...favorites, listingId]

    console.log('New favorites array:', newFavorites)

    // Store previous state for potential revert
    const previousFavorites = [...favorites]

    // Update local state immediately for responsiveness
    setFavorites(newFavorites)
    console.log('Local state updated')

    try {
      const requestBody = {
        listingId,
        action: isFavorite ? 'remove' : 'add'
      }
      console.log('Making API request:', requestBody)

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('API response status:', response.status)

      if (!response.ok) {
        // Revert on error
        setFavorites(previousFavorites)
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update favorite:', errorData)
        throw new Error(errorData.error || 'Failed to update favorite')
      }

      // Verify the response
      const result = await response.json()
      console.log('Favorite updated successfully:', result)

    } catch (error) {
      // Revert on error
      setFavorites(previousFavorites)
      console.error('Error updating favorite:', error)
      throw error
    }

    console.log('Returning new state:', !isFavorite)
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

  const contextValue = {
    favorites,
    loading,
    toggleFavorite,
    isFavorited,
    refetch: fetchFavorites
  }

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  )
}

// Hook to use favorites context
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}