'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import PriceDisplay from '@/app/components/PriceDisplay'
import PromotionBadges from './PromotionBadges'
import ContactModal from '@/app/components/modals/ContactModal'
import ConversationModal from '@/app/components/modals/ConversationModal'
import FavoriteButton from '@/app/components/FavoriteButton'

interface RegularAdCardProps {
  listing: {
    id: string
    title: string
    price: number
    location: string
    make?: string
    model?: string
    year: number
    mileage?: number
    fuel_type?: string
    transmission?: string
    image_url?: string
    image_urls?: string[]
    primary_image_url?: string
    pricing_type?: string
    negotiable?: boolean
    asking_price?: number
    monthly_payment?: number
    isPromoted?: boolean
    promotionType?: string
    phone?: string
    whatsapp?: string
    user_id: string
  }
  showPromotionBadge?: boolean
  activeImageIndex?: number
  onImageNavigate?: (direction: 'prev' | 'next') => void
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
  imageLoading = false,
  imageError = false,
  onImageLoad,
  onImageError
}: RegularAdCardProps) {
  const images = listing.image_urls || []
  const [showContactModal, setShowContactModal] = useState(false)
  const [showConversationModal, setShowConversationModal] = useState(false)
  
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
    <>
    <Link href={`/listings/${listing.id}`} className="block">
      <div className="bg-white md:rounded-lg shadow-sm hover:shadow-md transition-shadow border-b md:border border-gray-100 group cursor-pointer">
        {/* Image Section */}
        <div className="relative h-48 bg-gray-200 md:rounded-t-lg overflow-hidden group">
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
            <img
              src={images[activeImageIndex]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              onLoad={onImageLoad}
              onError={onImageError}
              style={{ display: imageLoading || imageError ? 'none' : 'block' }}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm flex-col">
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
        <div className="absolute top-2 right-2 z-20">
          <FavoriteButton
            listingId={listing.id}
            size="small"
            className="bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
          />
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 hover:bg-gray-50 transition-colors">
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
        </div>
        
        {/* Action Footer */}
        <div className="px-4 pb-4">
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.preventDefault()
              setShowContactModal(true)
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <i className="fas fa-phone mr-2"></i>
            Call Now
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault()
              setShowConversationModal(true)
            }}
            className="flex-1 border border-blue-600 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            <i className="fas fa-envelope mr-2"></i>
            Message
          </button>
        </div>
      </div>
      </div>
    </Link>

    {/* Contact Modal */}
    <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        listing={{
          id: listing.id,
          title: listing.title,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
          price: listing.price,
          location: listing.location,
          make: listing.make,
          model: listing.model,
          year: listing.year
        }}
      />

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        listing={{
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          primary_image_url: images[0] || listing.image_url || listing.primary_image_url,
          user_id: listing.user_id
        }}
      />
    </>
  )
}