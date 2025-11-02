'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFavorites } from '@/lib/contexts/FavoritesContext'
import { AuthModal } from './auth'
import { useAuthWithRedirect } from '../hooks/useAuthWithRedirect'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

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
  const { showAuthModal, openAuthWithAction, closeAuth, handleAuthSuccess } = useAuthWithRedirect()
  const { toasts, showSuccess, removeToast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const isFavorite = isFavorited(listingId)

  // NOTE: Pending action handling moved to parent component (listings page)
  // to avoid race conditions with multiple FavoriteButton instances

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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If not logged in, show auth modal with action to add favorite
    if (!user) {
      openAuthWithAction(
        async () => {
          // This callback is for email/phone auth (no page reload)
          setIsProcessing(true)
          try {
            const newState = await toggleFavorite(listingId)
            onToggle?.(newState)
          } catch (error) {
            console.error('Failed to add favorite after auth:', error)
          } finally {
            setIsProcessing(false)
          }
        },
        'add-favorite', // Action type for OAuth flows
        { listingId } // Data to restore context after OAuth
      )
      return
    }

    // If logged in, toggle favorite immediately
    setIsProcessing(true)
    try {
      const newState = await toggleFavorite(listingId)
      onToggle?.(newState)

      // Show toast notification
      if (newState) {
        showSuccess('Added to favorites', 2000)
      } else {
        showSuccess('Removed from favorites', 2000)
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          ${sizeClasses[size]}
          ${className}
          ${isProcessing ? 'opacity-50 cursor-wait' : ''}
          transition-all duration-200
          relative pointer-events-auto
        `}
        style={{ zIndex: 30 }}
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
        onClose={closeAuth}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  )
}