'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Calendar, Eye } from 'lucide-react'
import PromotionBadges from './PromotionBadges'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    location: string
    make: string
    model: string
    year: number
    mileage?: number
    fuel_type?: string
    transmission?: string
    image_url?: string
    image_urls?: string[]
    created_at: string
    views?: number
    is_featured?: boolean
    is_top_spot?: boolean
    is_boosted?: boolean
    is_urgent?: boolean
  }
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`
  }

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'N/A'
    return `${mileage.toLocaleString()} km`
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 30) return `${diffInDays} days ago`
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths === 1) return '1 month ago'
    return `${diffInMonths} months ago`
  }

  const primaryImage = listing.image_urls?.[0] || listing.image_url
  const imageCount = listing.image_urls?.length || 0

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
        {/* Image Section */}
        <div className="relative h-48 bg-gray-100">
          {!imageError && primaryImage ? (
            <img
              src={primaryImage}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <i className="fas fa-car text-gray-400 text-3xl"></i>
            </div>
          )}

          {/* Promotion Badges */}
          <div className="absolute top-2 left-2">
            <PromotionBadges listing={listing} size="small" />
          </div>

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <i className="fas fa-camera"></i>
              <span>{imageCount}</span>
            </div>
          )}

          {/* Urgent overlay */}
          {listing.is_urgent && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600/90 to-transparent h-16 flex items-end">
              <span className="text-white font-bold text-xs px-2 pb-2">
                URGENT SALE
              </span>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsFavorite(!isFavorite)
            }}
            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <i className="fas fa-calendar text-gray-400"></i>
              {listing.year}
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-gray-400"></i>
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-gray-400"></i>
                {listing.fuel_type}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-600 mb-3">
            <MapPin className="w-3 h-3" />
            <span className="text-xs truncate">{listing.location}</span>
          </div>

          {/* Price and Stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className={`font-bold text-xl ${listing.is_urgent ? 'text-red-600' : 'text-blue-600'}`}>
                {formatPrice(listing.price)}
              </div>
            </div>
            
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {listing.views || 0}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {getTimeAgo(listing.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}