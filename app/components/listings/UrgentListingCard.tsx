'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Eye, AlertTriangle, Phone, MessageCircle } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'

interface UrgentListingCardProps {
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
    is_urgent: true
    urgent_until?: string
  }
}

export default function UrgentListingCard({ listing }: UrgentListingCardProps) {
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
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative border-2 border-red-200 hover:border-red-300">
      {/* Urgent Pulse Animation */}
      <div className="absolute inset-0 bg-red-50/30 animate-pulse pointer-events-none"></div>

      {/* Urgent Banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 z-20">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span className="text-sm font-bold tracking-wide">URGENT SALE</span>
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      {/* Clickable Link Area */}
      <Link href={`/listings/${listing.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 bg-gray-100 mt-10">
          {!imageError && primaryImage ? (
            <OptimizedImage
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={80}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
              <i className="fas fa-car text-red-400 text-3xl"></i>
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-red-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <i className="fas fa-camera"></i>
              <span>{imageCount}</span>
            </div>
          )}

          {/* Red Overlay Gradient */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600/20 to-transparent h-16"></div>
        </div>

        {/* Content Section */}
        <div className="p-4 bg-gradient-to-br from-white to-red-50/20">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-red-500" />
              {listing.year}
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-red-500 text-xs"></i>
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-red-500 text-xs"></i>
                {listing.fuel_type}
              </span>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="font-bold text-2xl text-red-600">
              {formatPrice(listing.price)}
            </div>

            {/* Views */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="w-3 h-3" />
              <span>{listing.views || 0} views</span>
            </div>
          </div>

          {/* Urgent Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-red-100">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle call action
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle message action
              }}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-14 right-2 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-lg"
        />
      </div>
    </div>
  )
}