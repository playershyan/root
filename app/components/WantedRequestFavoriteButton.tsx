'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

interface WantedRequestFavoriteButtonProps {
  requestId: string
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
  onToggle?: (isFavorite: boolean) => void
}

export default function WantedRequestFavoriteButton({
  requestId,
  size = 'medium',
  showText = false,
  className = '',
  onToggle
}: WantedRequestFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if saved on mount and when requestId changes
  useEffect(() => {
    checkIfSaved()
  }, [requestId])

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedWantedRequests') {
        checkIfSaved()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [requestId])

  const checkIfSaved = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedWantedRequests')
      if (saved) {
        const savedSet = new Set(JSON.parse(saved))
        setIsFavorite(savedSet.has(requestId))
      }
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsProcessing(true)

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('savedWantedRequests')
        const savedSet = saved ? new Set(JSON.parse(saved)) : new Set()

        if (savedSet.has(requestId)) {
          // Remove from favorites
          savedSet.delete(requestId)
          setIsFavorite(false)

          // Remove from full data
          const existingData = localStorage.getItem('favoriteWantedRequestsData')
          if (existingData) {
            const currentData = JSON.parse(existingData)
            const updatedData = currentData.filter((item: any) => item.id !== requestId)
            localStorage.setItem('favoriteWantedRequestsData', JSON.stringify(updatedData))
          }

          onToggle?.(false)
        } else {
          // Add to favorites
          savedSet.add(requestId)
          setIsFavorite(true)

          // Note: Full data will be saved when we have access to the complete request object
          // This is handled in the parent component or detail page

          onToggle?.(true)
        }

        localStorage.setItem('savedWantedRequests', JSON.stringify(Array.from(savedSet)))

        // Trigger storage event for same-tab updates
        window.dispatchEvent(new Event('wanted-favorites-updated'))
      }
    } catch (error) {
      console.error('Failed to toggle wanted request favorite:', error)
    } finally {
      setIsProcessing(false)
    }
  }

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

  return (
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
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`
          ${iconSizes[size]}
          ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          hover:text-red-500
          transition-colors
        `}
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isFavorite ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}
