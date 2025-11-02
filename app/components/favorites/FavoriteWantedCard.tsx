'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Share2, HeartOff, MoreVertical, MapPin, Calendar, MessageCircle, Clock } from 'lucide-react'
import { FavoriteWantedData, formatPrice, formatDate, truncateDescription, getUrgencyColor, getUrgencyLabel } from '@/lib/utils/favoritesUtils'

interface FavoriteWantedCardProps {
  wanted: FavoriteWantedData
  onRemoveFromFavorites?: (id: string) => void
  onShare?: (id: string) => void
}

export default function FavoriteWantedCard({
  wanted,
  onRemoveFromFavorites,
  onShare
}: FavoriteWantedCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleMenuAction = (action: () => void, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    action()
    setShowMenu(false)
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow group">
      {/* Header with title and menu */}
      <div className="flex items-start justify-between mb-3">
        <Link 
          href={`/wanted/${wanted.id}`}
          className="flex-1 hover:text-blue-600 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 line-clamp-2 pr-2">
            {wanted.title}
          </h3>
        </Link>

        {/* Three-dotted menu */}
        <div className="relative flex-shrink-0" data-menu-button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <Link
                href={`/wanted/${wanted.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <Eye className="w-4 h-4" />
                View Request
              </Link>
              
              {onShare && (
                <button
                  onClick={(e) => handleMenuAction(() => onShare(wanted.id), e)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              
              {onRemoveFromFavorites && (
                <>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => handleMenuAction(() => onRemoveFromFavorites(wanted.id), e)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <HeartOff className="w-4 h-4" />
                    Remove from Favorites
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
        {truncateDescription(wanted.description, 120)}
      </p>

      {/* Budget Badge */}
      <div className="mb-3">
        <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          Budget: {formatPrice(wanted.budget)}
        </span>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {wanted.urgency && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getUrgencyColor(wanted.urgency)}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {getUrgencyLabel(wanted.urgency)}
          </span>
        )}
        
        {wanted.responses !== undefined && (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
            <MessageCircle className="w-3 h-3 inline mr-1" />
            {wanted.responses} response{wanted.responses !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Meta Information */}
      <div className="space-y-2 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{wanted.location}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formatDate(wanted.postedDate)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          href={`/wanted/${wanted.id}`}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
        >
          View Request
        </Link>
        
        {onShare && (
          <button
            onClick={() => onShare(wanted.id)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}