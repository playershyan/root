'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import PriceDisplay from '@/app/components/PriceDisplay'
import PromotionBadges from './PromotionBadges'

interface RegularAdCardProps {
  listing: any
  showPromotionBadge?: boolean
  activeImageIndex?: number
  onImageNavigate?: (direction: 'prev' | 'next') => void
  isSaved?: boolean
  onToggleSaved?: () => void
  imageLoading?: boolean
  imageError?: boolean
  onImageLoad?: () => void
  onImageError?: () => void
}

export default function RegularAdCard({
  listing,
  showPromotionBadge = false,
  activeImageIndex = 0,
  onImageNavigate,
  isSaved = false,
  onToggleSaved,
  imageLoading = false,
  imageError = false,
  onImageLoad,
  onImageError
}: RegularAdCardProps) {
  const images = listing.image_urls || []
  
  const getPromotionBadge = () => {
    if (!showPromotionBadge || !listing.isPromoted) return null
    
    switch (listing.promotionType) {
      case 'urgent':
        return <PromotionBadges.Urgent />
      case 'boost':
        return <PromotionBadges.Boost />
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden group">
        {/* Promotion Badge */}
        {getPromotionBadge() && (
          <div className="absolute top-2 left-2 z-10">
            {getPromotionBadge()}
          </div>
        )}
        
        {/* Finance Badge */}
        {listing.pricing_type === 'finance' && (
          <div className="absolute top-2 right-12 z-10 bg-amber-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-sm">
            <i className="fas fa-handshake mr-1"></i>
            Finance
          </div>
        )}

        {/* Image Display */}
        {images.length > 0 ? (
          <>
            {!imageLoading && !imageError && (
              <img
                src={images[activeImageIndex]}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onLoad={onImageLoad}
                onError={onImageError}
              />
            )}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                <i className="fas fa-image text-2xl mb-2"></i>
                <p>Image unavailable</p>
              </div>
            )}
            
            {/* Image Navigation */}
            {images.length > 1 && onImageNavigate && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onImageNavigate('prev')
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    onImageNavigate('next')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  {activeImageIndex + 1}/{images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <i className="fas fa-car text-3xl mb-2"></i>
            <span className="text-sm">No images</span>
          </div>
        )}
        
        {/* Save Button */}
        {onToggleSaved && (
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleSaved()
            }}
            className="absolute top-2 right-2 bg-white/90 p-2 rounded-full hover:bg-white transition-colors shadow-sm"
          >
            <Heart 
              className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-current' : 'text-gray-400'}`}
            />
          </button>
        )}
      </div>
      
      {/* Content Section */}
      <Link href={`/listings/${listing.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          
          {/* Price */}
          <PriceDisplay
            pricingType={listing.pricing_type}
            price={listing.price}
            negotiable={listing.negotiable}
            askingPrice={listing.asking_price}
            monthlyPayment={listing.monthly_payment}
            variant="card"
          />
          
          {/* Vehicle Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <i className="fas fa-calendar text-blue-500 w-4"></i>
              <span>{listing.year}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-road text-gray-500 w-4"></i>
              <span>{listing.mileage?.toLocaleString() || 'N/A'} km</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-gas-pump text-green-500 w-4"></i>
              <span>{listing.fuel_type || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="fas fa-cogs text-purple-500 w-4"></i>
              <span>{listing.transmission || 'N/A'}</span>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-1 border-t border-gray-100">
            <i className="fas fa-map-marker-alt text-red-500"></i>
            <span>{listing.location}</span>
          </div>
        </div>
      </Link>
      
      {/* Action Footer */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            <i className="fas fa-phone mr-2"></i>
            Call Now
          </button>
          <button className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm">
            <i className="fas fa-envelope mr-2"></i>
            Message
          </button>
        </div>
      </div>
    </div>
  )
}