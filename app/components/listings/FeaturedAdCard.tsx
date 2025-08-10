'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Calendar, Eye, Star } from 'lucide-react'
import PromotionBadges from './PromotionBadges'

interface FeaturedAdCardProps {
  listing: any
  promotionType: 'featured' | 'top_spot'
}

export default function FeaturedAdCard({ listing, promotionType }: FeaturedAdCardProps) {
  const priority = promotionType
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const images = listing.image_urls || (listing.image_url ? [listing.image_url] : [])
  const hasMultipleImages = images.length > 1

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

  const handleImageError = () => {
    setImageError(true)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const cardStyles = {
    featured: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50 border-2 border-yellow-400 shadow-xl hover:shadow-2xl transform hover:-translate-y-1',
    top_spot: 'bg-gradient-to-br from-purple-50 via-white to-purple-50 border-2 border-purple-400 shadow-lg hover:shadow-xl',
    regular: 'bg-white border border-gray-200 shadow-md hover:shadow-lg'
  }

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${cardStyles[priority]}`}>
        {/* Premium Badge for Featured Ads */}
        {priority === 'featured' && (
          <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <Star className="w-4 h-4 fill-white" />
            <span className="text-sm font-bold">FEATURED</span>
          </div>
        )}

        {/* Top Spot Badge */}
        {priority === 'top_spot' && (
          <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <i className="fas fa-crown text-sm"></i>
            <span className="text-sm font-bold">TOP SPOT</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row">
          {/* Image Section - Larger for featured ads */}
          <div className={`relative ${priority === 'featured' ? 'lg:w-2/5' : 'lg:w-1/3'} h-64 lg:h-auto`}>
            <div className="relative w-full h-full">
              {!imageError && images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                  
                  {/* Image navigation for multiple images */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                      >
                        <i className="fas fa-chevron-left text-xs"></i>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                      >
                        <i className="fas fa-chevron-right text-xs"></i>
                      </button>
                      
                      {/* Image indicators */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {images.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Image count badge */}
                  {hasMultipleImages && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                      <i className="fas fa-camera"></i>
                      <span>{images.length}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <i className="fas fa-car text-gray-400 text-4xl"></i>
                </div>
              )}

              {/* Promotion Badges Overlay */}
              <div className="absolute bottom-2 left-2 z-10">
                <PromotionBadges listing={listing} size="small" />
              </div>
            </div>
          </div>

          {/* Content Section - More spacious for featured ads */}
          <div className={`flex-1 p-6 ${priority === 'featured' ? 'lg:p-8' : 'lg:p-6'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 ${
                  priority === 'featured' ? 'text-2xl' : 'text-xl'
                }`}>
                  {listing.title}
                </h3>
                
                {/* Vehicle Details */}
                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
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
                  {listing.transmission && (
                    <span className="flex items-center gap-1">
                      <i className="fas fa-cogs text-gray-400"></i>
                      {listing.transmission}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{listing.location}</span>
                </div>
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setIsFavorite(!isFavorite)
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Price Section */}
            <div className="flex items-end justify-between">
              <div>
                <div className={`font-bold ${
                  priority === 'featured' ? 'text-3xl' : 'text-2xl'
                } ${listing.is_urgent ? 'text-red-600' : 'text-blue-600'}`}>
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

              {/* CTA Button for Featured Ads */}
              {priority === 'featured' && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  View Details
                  <i className="fas fa-arrow-right text-sm"></i>
                </button>
              )}
            </div>

            {/* Additional Promotions */}
            {priority === 'featured' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  {listing.is_boosted && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      <i className="fas fa-arrow-up mr-1"></i>Boosted
                    </span>
                  )}
                  {listing.is_urgent && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      <i className="fas fa-exclamation-triangle mr-1"></i>Urgent Sale
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    Premium listing • Verified seller
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}