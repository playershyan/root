'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Eye, Share2, HeartOff, MoreVertical, MapPin, User, Calendar } from 'lucide-react'
import { FavoriteAdData, formatPrice, formatDate, truncateDescription } from '@/lib/utils/favoritesUtils'

interface FavoriteAdCardProps {
  ad: FavoriteAdData
  onRemoveFromFavorites?: (id: string) => void
  onShare?: (id: string) => void
}

export default function FavoriteAdCard({
  ad,
  onRemoveFromFavorites,
  onShare
}: FavoriteAdCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleMenuAction = (action: () => void, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    action()
    setShowMenu(false)
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative">
        {/* Image */}
        <Link href={`/listings/${ad.id}`} className="block">
          <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
            {ad.image && !imageError ? (
              <img
                src={ad.image}
                alt={ad.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
          </div>
        </Link>

        {/* Three-dotted menu */}
        <div className="absolute top-3 right-3" data-menu-button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <Link
                href={`/listings/${ad.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMenu(false)}
              >
                <Eye className="w-4 h-4" />
                View Listing
              </Link>
              
              {onShare && (
                <button
                  onClick={(e) => handleMenuAction(() => onShare(ad.id), e)}
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
                    onClick={(e) => handleMenuAction(() => onRemoveFromFavorites(ad.id), e)}
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

        {/* Price Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-bold text-gray-900 shadow-sm">
            {formatPrice(ad.price)}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <Link 
          href={`/listings/${ad.id}`}
          className="block hover:text-blue-600 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {ad.title}
          </h3>
        </Link>
        
        {ad.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {truncateDescription(ad.description, 80)}
          </p>
        )}

        {/* Vehicle Details */}
        {(ad.make || ad.model || ad.year || ad.mileage) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {ad.year && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {ad.year}
              </span>
            )}
            {ad.mileage && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {ad.mileage.toLocaleString()} km
              </span>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{ad.location}</span>
          </div>
          
          {ad.seller && (
            <div className="flex items-center gap-1">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{ad.seller}</span>
            </div>
          )}
          
          {ad.postedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDate(ad.postedDate)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/listings/${ad.id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
          >
            View Details
          </Link>
          
          {onShare && (
            <button
              onClick={() => onShare(ad.id)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}