'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Car, RotateCcw, MapPin, Calendar, Camera, User } from 'lucide-react'
import {
  BinItemData,
  formatDeletedDate,
  getDeletionUrgencyColor,
  getDeletionUrgencyMessage,
  formatPrice,
  truncateText
} from '@/lib/utils/binUtils'

interface BinListingCardProps {
  listing: BinItemData
  onRestore?: (id: string) => void
  restoring?: boolean
}

export default function BinListingCard({
  listing,
  onRestore,
  restoring = false
}: BinListingCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleRestore = () => {
    if (onRestore && listing.can_restore) {
      onRestore(listing.id)
    }
  }

  // Get image URL from original_data
  const getImageUrl = () => {
    if (listing.original_data) {
      const data = typeof listing.original_data === 'string'
        ? JSON.parse(listing.original_data)
        : listing.original_data
      return data.primary_image_url || data.image_url || (data.image_urls && data.image_urls[0])
    }
    return null
  }

  const imageUrl = getImageUrl()

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Image section */}
        <div className="w-32 h-32 bg-gray-200 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}
        </div>

        {/* Content section */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                {listing.title}
              </h4>
              
              {/* Price */}
              {listing.price && (
                <div className="mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(listing.price)}
                  </span>
                </div>
              )}
              
              {/* Description */}
              {listing.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {isExpanded ? listing.description : truncateText(listing.description, 80)}
                  {listing.description.length > 80 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Restore button */}
            <div className="flex-shrink-0 ml-3">
              {listing.can_restore ? (
                <button
                  onClick={handleRestore}
                  disabled={restoring}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
                >
                  {restoring ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                  Cannot Restore
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-sm text-gray-600">
            {listing.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
            )}
            
            {listing.seller && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">By {listing.seller}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Deleted {formatDeletedDate(listing.deleted_at)}</span>
            </div>
            
            {listing.deletion_reason && (
              <div className="flex items-start gap-1">
                <span className="flex-shrink-0">Reason:</span>
                <span className="font-medium">{listing.deletion_reason}</span>
              </div>
            )}
          </div>

          {/* Deletion countdown */}
          {listing.can_restore && listing.days_until_permanent_deletion > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getDeletionUrgencyColor(listing.days_until_permanent_deletion)}`}>
                <span>{getDeletionUrgencyMessage(listing.days_until_permanent_deletion)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}