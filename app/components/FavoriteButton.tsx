'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFavorites } from '@/lib/contexts/FavoritesContext'
import { AuthModal } from './auth'

interface FavoriteButtonProps {
  listingId: string
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
  onToggle?: (isFavorite: boolean) => void
}

export default function FavoriteButton({ 
  listingId, 
  size = 'medium',
  showText = false,
  className = '',
  onToggle
}: FavoriteButtonProps) {
  const { user } = useAuth()
  const { isFavorited, toggleFavorite } = useFavorites()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingFavorite, setPendingFavorite] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const isFavorite = isFavorited(listingId)

  // Handle size classes
  const sizeClasses = {
    small: 'p-1.5',
    medium: 'p-2',
    large: 'p-3'
  }

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  // When user logs in and we have a pending favorite, add it
  useEffect(() => {
    const addPendingFavorite = async () => {
      if (user && pendingFavorite && !isFavorited(pendingFavorite)) {
        setIsProcessing(true)
        try {
          await toggleFavorite(pendingFavorite)
          onToggle?.(true)
        } catch (error) {
          console.error('Failed to add pending favorite:', error)
        } finally {
          setIsProcessing(false)
          setPendingFavorite(null)
        }
      }
    }

    if (user && pendingFavorite) {
      // Small delay to ensure auth state is fully updated
      setTimeout(addPendingFavorite, 500)
    }
  }, [user, pendingFavorite, toggleFavorite, isFavorited, onToggle])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('FavoriteButton clicked', { 
      user: !!user, 
      userObject: user,
      listingId,
      currentIsFavorite: isFavorite 
    })

    // If not logged in, show auth modal and save listing ID for later
    if (!user) {
      console.log('User not logged in, showing auth modal')
      setPendingFavorite(listingId)
      setShowAuthModal(true)
      return
    }

    // If logged in, toggle favorite
    setIsProcessing(true)
    try {
      const newState = await toggleFavorite(listingId)
      onToggle?.(newState)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          ${sizeClasses[size]}
          ${className}
          ${isProcessing ? 'opacity-50 cursor-wait' : ''}
          transition-all duration-200
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        title={!user ? 'Sign in to save favorites' : (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
      >
        <Heart 
          className={`
            ${iconSizes[size]}
            ${isFavorite && user ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            ${!user ? 'hover:text-red-400' : 'hover:text-red-500'}
            transition-colors
          `}
        />
        {showText && (
          <span className="ml-2 text-sm">
            {isFavorite && user ? 'Saved' : 'Save'}
          </span>
        )}
      </button>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => {
          console.log('AuthModal closed')
          setShowAuthModal(false)
          // Keep pending favorite in case they complete login
        }}
      />
    </>
  )
}