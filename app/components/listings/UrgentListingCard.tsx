'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, Eye, AlertTriangle, Phone, MessageCircle, Car, Camera, Gauge, Fuel } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'
import { Button } from '@/components/ui/button'
import { CARD_CONSTANTS, PROMOTION_COLORS, getCardClasses } from './card-design-system'

// Lazy load modals (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const ConversationModal = dynamic(() => import('@/app/components/modals/ConversationModal'))

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
    primary_image_url?: string
    created_at: string
    views?: number
    is_urgent: true
    urgent_until?: string
    phone?: string
    whatsapp?: string
    user_id: string
  }
}

export default function UrgentListingCard({ listing }: UrgentListingCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showConversationModal, setShowConversationModal] = useState(false)

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

  const primaryImage = listing.image_urls?.[0] || listing.image_url
  const imageCount = listing.image_urls?.length || 0
  const colors = PROMOTION_COLORS.urgent

  return (
    <div className={getCardClasses('urgent')}>
      {/* Urgent Pulse Animation */}
      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_CONSTANTS.overlay.urgent} animate-pulse pointer-events-none`}></div>

      {/* Urgent Banner */}
      <div className={`absolute top-0 left-0 right-0 ${colors.badge} text-white px-3 sm:px-4 py-1.5 sm:py-2 z-20`}>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
          <span className="text-xs sm:text-sm font-bold tracking-wide">URGENT SALE</span>
          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
        </div>
      </div>

      {/* Clickable Link Area */}
      <Link
        href={`/listings/${listing.id}`}
        prefetch={true}
        className="block"
      >
        {/* Image Section */}
        <div className={`relative ${CARD_CONSTANTS.imageHeight.promoted} bg-gray-100 mt-8 sm:mt-10`}>
          {!imageError && primaryImage ? (
            <OptimizedImage
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality="listing"
              watermark={true}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
              <Car className="text-red-400" size={48} />
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute top-2 right-2 bg-red-600/90 text-white px-2 py-0.5 sm:py-1 rounded text-xs flex items-center gap-1">
              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{imageCount}</span>
            </div>
          )}

          {/* Red Overlay Gradient */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600/20 to-transparent h-12 sm:h-16"></div>
        </div>

        {/* Content Section */}
        <div className={`${CARD_CONSTANTS.padding.promoted} bg-gradient-to-br from-white to-red-50/20`}>
          {/* Title */}
          <h3 className={`font-bold ${CARD_CONSTANTS.titleSize.urgent} ${colors.text} ${colors.hover} mb-2 line-clamp-2 transition-colors`}>
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-red-500" />
              <span>{listing.year}</span>
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="text-red-500 w-3 h-3" />
                <span className="truncate">{formatMileage(listing.mileage)}</span>
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <Fuel className="text-red-500 w-3 h-3" />
                <span className="truncate">{listing.fuel_type}</span>
              </span>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 gap-1 sm:gap-0">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`font-bold ${CARD_CONSTANTS.priceSize.urgent} text-red-600`}>
              {formatPrice(listing.price)}
            </div>

            {/* Views */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">{listing.views || 0} views</span>
              <span className="sm:hidden">{listing.views || 0}</span>
            </div>
          </div>

          {/* Urgent Action Buttons */}
          <div className="flex gap-2 pt-2 sm:pt-3 border-t border-red-100">
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowContactModal(true)
              }}
              size="sm"
              className={`flex-1 ${colors.button} text-white gap-1 sm:gap-2 text-xs sm:text-sm`}
            >
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Call Now</span>
              <span className="sm:hidden">Call</span>
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowConversationModal(true)
              }}
              size="sm"
              className={`flex-1 ${colors.buttonOutline} border-2 gap-1 sm:gap-2 text-xs sm:text-sm`}
            >
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Message</span>
            </Button>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-11 sm:top-14 right-2 sm:right-3 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-lg w-8 h-8 sm:w-10 sm:h-10"
        />
      </div>

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
          primary_image_url: listing.image_urls?.[0] || listing.image_url || listing.primary_image_url,
          user_id: listing.user_id
        }}
      />
    </div>
  )
}