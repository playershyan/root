'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Heart } from 'lucide-react'
import PriceDisplay from '@/app/components/PriceDisplay'
import PromotionBadges from './PromotionBadges'
import FavoriteButton from '@/app/components/FavoriteButton'
import { Button } from '@/components/ui/button'
import OptimizedImage from '@/components/ui/OptimizedImage'

// Lazy load modals (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const ConversationModal = dynamic(() => import('@/app/components/modals/ConversationModal'))

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
    <Link
      href={`/listings/${listing.id}`}
      prefetch={true}
      className="block"
    >
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 group cursor-pointer">
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
            <OptimizedImage
              src={images[activeImageIndex]}
              alt={listing.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority={false}
              quality="listing"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              watermark={true}
              onLoad={onImageLoad}
              onError={() => {
                onImageError?.()
              }}
            />
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
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
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    onImageNavigate('prev')
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    onImageNavigate('next')
                  }}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <i className="fas fa-chevron-right"></i>
                </Button>
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
          <Button
            onClick={(e) => {
              e.preventDefault()
              setShowContactModal(true)
            }}
            variant="primary"
            size="default"
            className="flex-1 gap-2"
          >
            <i className="fas fa-phone"></i>
            Call Now
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault()
              setShowConversationModal(true)
            }}
            variant="outline"
            size="default"
            className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50 gap-2"
          >
            <i className="fas fa-envelope"></i>
            Message
          </Button>
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