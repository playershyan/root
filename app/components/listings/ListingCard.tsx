'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Eye } from 'lucide-react'
import PromotionBadges from './PromotionBadges'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'

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
    <div className="bg-white border border-gray-200 hover:border-gray-300 transition-colors duration-200 overflow-hidden group relative">
      {/* Clickable Link Area */}
      <Link href={`/listings/${listing.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 bg-gray-50">
        {!imageError && primaryImage ? (
          <OptimizedImage
            src={primaryImage}
            alt={listing.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={80}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <i className="fas fa-car text-gray-300 text-2xl"></i>
          </div>
        )}

        {/* Promotion Badges */}
        <div className="absolute top-3 left-3">
          <PromotionBadges listing={listing} size="small" />
        </div>

        {/* Image count */}
        {imageCount > 1 && (
          <div className="absolute top-3 right-3 bg-gray-900/80 text-white px-2 py-1 text-xs flex items-center gap-1">
            <i className="fas fa-camera"></i>
            <span>{imageCount}</span>
          </div>
        )}

        {/* Urgent indicator */}
        {listing.is_urgent && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-gray-900 text-white px-2 py-1 text-xs font-medium">
              URGENT
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-3 leading-tight">
          {listing.title}
        </h3>

        {/* Vehicle Details */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
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
        <div className="flex items-center gap-1 text-gray-500 mb-4">
          <MapPin className="w-3 h-3" />
          <span className="text-xs truncate">{listing.location}</span>
        </div>

        {/* Price and Stats */}
        <div className="flex items-end justify-between">
          <div>
            <div className={`font-semibold text-lg ${listing.is_urgent ? 'text-gray-900' : 'text-gray-900'}`}>
              {formatPrice(listing.price)}
            </div>
          </div>
          
          <div className="flex gap-4 text-xs text-gray-400">
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
      </Link>

      {/* Favorite Button - Outside Link to prevent event conflicts */}
      <div className="absolute top-3 right-3 z-20">
        <FavoriteButton
          listingId={listing.id}
          size="small"
          className="bg-white/95 backdrop-blur-sm hover:bg-white transition-colors"
        />
      </div>
    </div>
  )
}