'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Eye, TrendingUp, Star, Crown } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'

interface BoostedCardProps {
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
    is_boosted: true
    is_featured?: boolean
    is_top_spot?: boolean
    boosted_until?: string
  }
}

export default function BoostedCard({ listing }: BoostedCardProps) {
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
    <div className="relative rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-blue-50 via-white to-cyan-50 border border-blue-200 hover:border-blue-300 shadow-md hover:shadow-lg hover:shadow-blue-200/30 hover:-translate-y-0.5">
      {/* Blue Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

      {/* Boost Badge */}
      <div className="absolute top-3 left-3 z-20">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs font-bold tracking-wide">BOOSTED</span>
        </div>
      </div>

      {/* Additional Badges */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        {listing.is_featured && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2 py-1 rounded-full shadow-md flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            <span className="text-xs font-semibold">FEATURED</span>
          </div>
        )}
        {listing.is_top_spot && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full shadow-md flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span className="text-xs font-semibold">TOP</span>
          </div>
        )}
      </div>

      <Link href={`/listings/${listing.id}`} className="block">
        {/* Image Section */}
        <div className="relative h-48 bg-gradient-to-br from-blue-100 to-cyan-100 mt-1">
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
            <div className="w-full h-full flex items-center justify-center">
              <i className="fas fa-car text-blue-400 text-3xl"></i>
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-2 bg-blue-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <i className="fas fa-camera"></i>
              <span>{imageCount}</span>
            </div>
          )}

          {/* Boost Indicator */}
          <div className="absolute bottom-2 right-2 bg-blue-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Boosted</span>
          </div>

          {/* Blue Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/5 to-transparent h-16"></div>
        </div>

        {/* Content Section */}
        <div className="p-4 bg-gradient-to-br from-white via-blue-50/10 to-cyan-50/10">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              {listing.year}
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-blue-500 text-xs"></i>
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-blue-500 text-xs"></i>
                {listing.fuel_type}
              </span>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>

          {/* Price and Stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className="font-bold text-xl text-blue-600">
                {formatPrice(listing.price)}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Eye className="w-3 h-3" />
                <span>{listing.views || 0} views</span>
              </div>
            </div>

            {/* Boost Status */}
            <div className="text-right">
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Enhanced
              </div>
            </div>
          </div>

          {/* Boost Benefits */}
          <div className="mt-3 pt-3 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Increased Visibility
              </span>
              <span className="text-xs text-gray-500">
                More Views
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-10 right-3 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-md border border-blue-200"
        />
      </div>
    </div>
  )
}