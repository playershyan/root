'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Eye, Star, Crown, TrendingUp } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'
import ImageCarousel from '@/components/ui/ImageCarousel'

interface GoldFeaturedCardProps {
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
    is_featured: true
    is_top_spot?: boolean
    is_boosted?: boolean
    featured_until?: string
  }
  size?: 'regular' | 'large'
}

export default function GoldFeaturedCard({ listing, size = 'regular' }: GoldFeaturedCardProps) {
  const [imageError, setImageError] = useState(false)
  const isLarge = size === 'large'

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
    
    if (diffInHours < 1) return 'Now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 30) return `${diffInDays} days ago`
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMonths === 1) return '1 month ago'
    return `${diffInMonths} months ago`
  }

  const images = listing.image_urls || (listing.image_url ? [listing.image_url] : [])
  const imageCount = images.length

  return (
    <div className={`
      relative rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer
      bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50
      border-2 border-amber-200 hover:border-amber-300
      shadow-lg hover:shadow-xl hover:shadow-amber-200/50
      ${isLarge ? 'transform hover:scale-[1.02]' : 'hover:-translate-y-1'}
    `}>
      {/* Golden Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-yellow-100/20 pointer-events-none"></div>

      {/* Premium Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Star className="w-4 h-4 fill-white" />
          <span className="text-sm font-bold tracking-wide">FEATURED</span>
        </div>
      </div>

      {/* Additional Badges */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {listing.is_top_spot && (
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
            <Crown className="w-3 h-3" />
            <span className="text-xs font-semibold">TOP SPOT</span>
          </div>
        )}
        {listing.is_boosted && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-semibold">BOOSTED</span>
          </div>
        )}
      </div>

      <Link href={`/listings/${listing.id}`} className="block">
        <div className={`flex ${isLarge ? 'flex-col lg:flex-row' : 'flex-col'}`}>
          {/* Image Section */}
          <div className={`relative ${isLarge ? 'lg:w-2/5 h-64 lg:h-auto' : 'h-56'} bg-gradient-to-br from-amber-100 to-yellow-100`}>
            {images.length > 0 ? (
              isLarge ? (
                <ImageCarousel
                  images={images}
                  alt={listing.title}
                  className="w-full h-full"
                  priority={true}
                  showThumbnails={false}
                />
              ) : (
                !imageError && images[0] ? (
                  <OptimizedImage
                    src={images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality="listing"
                    watermark={true}
                    priority={isLarge}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-car text-amber-400 text-4xl"></i>
                  </div>
                )
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-car text-amber-400 text-4xl"></i>
              </div>
            )}

            {/* Image count */}
            {imageCount > 1 && !isLarge && (
              <div className="absolute top-2 left-2 bg-amber-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <i className="fas fa-camera"></i>
                <span>{imageCount}</span>
              </div>
            )}

            {/* Golden Gradient Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-600/10 to-transparent h-20"></div>
          </div>

          {/* Content Section */}
          <div className={`flex-1 p-6 ${isLarge ? 'lg:p-8' : ''} bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30`}>
            {/* Title */}
            <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-amber-700 transition-colors ${
              isLarge ? 'text-2xl' : 'text-xl'
            }`}>
              {listing.title}
            </h3>

            {/* Vehicle Details */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                {listing.year}
              </span>
              {listing.mileage && (
                <span className="flex items-center gap-1">
                  <i className="fas fa-tachometer-alt text-amber-500 text-xs"></i>
                  {formatMileage(listing.mileage)}
                </span>
              )}
              {listing.fuel_type && (
                <span className="flex items-center gap-1">
                  <i className="fas fa-gas-pump text-amber-500 text-xs"></i>
                  {listing.fuel_type}
                </span>
              )}
              {listing.transmission && (
                <span className="flex items-center gap-1">
                  <i className="fas fa-cogs text-amber-500 text-xs"></i>
                  {listing.transmission}
                </span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span className="text-sm">{listing.location}</span>
            </div>

            {/* Price and Stats */}
            <div className="flex items-end justify-between">
              <div>
                <div className={`font-bold text-amber-600 ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
                  {formatPrice(listing.price)}
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {listing.views || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {getTimeAgo(listing.created_at)}
                  </span>
                </div>
              </div>

              {/* CTA Button for Large Cards */}
              {isLarge && (
                <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg">
                  View Details
                  <i className="fas fa-arrow-right text-sm"></i>
                </button>
              )}
            </div>

            {/* Premium Features Indicator */}
            {isLarge && (
              <div className="mt-6 pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Premium Listing • Priority Display
                  </span>
                  <span className="text-xs text-gray-500">
                    Verified Seller
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-amber-200"
        />
      </div>
    </div>
  )
}