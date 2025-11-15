'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, Eye, Crown, Star, TrendingUp, Car, Camera, Gauge, Fuel, Phone, Mail } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'
import { Button } from '@/components/ui/button'
import { CARD_CONSTANTS, PROMOTION_COLORS, getCardClasses } from './card-design-system'

// Lazy load modals (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const ConversationModal = dynamic(() => import('@/app/components/modals/ConversationModal'))

interface TopSpotCardProps {
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
    is_top_spot: true
    is_featured?: boolean
    is_boosted?: boolean
    top_spot_until?: string
    phone?: string
    whatsapp?: string
    user_id: string
  }
}

export default function TopSpotCard({ listing }: TopSpotCardProps) {
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
  const colors = PROMOTION_COLORS.topSpot

  return (
    <div className={getCardClasses('topSpot')}>
      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_CONSTANTS.overlay.topSpot} pointer-events-none`}></div>

      {/* Crown Badge */}
      <div className={`absolute ${CARD_CONSTANTS.badgePosition.left} z-20`}>
        <div className={`${colors.badge} text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2`}>
          <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm font-bold tracking-wide">TOP SPOT</span>
        </div>
      </div>

      {/* Additional Badges */}
      <div className={`absolute ${CARD_CONSTANTS.badgePosition.right} z-20 flex flex-col gap-1.5 sm:gap-2`}>
        {listing.is_featured && (
          <div className={`${PROMOTION_COLORS.featured.badge} text-white px-2 sm:px-3 py-1 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5`}>
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
            <span className="text-xs font-semibold">FEATURED</span>
          </div>
        )}
        {listing.is_boosted && (
          <div className={`${PROMOTION_COLORS.boosted.badge} text-white px-2 sm:px-3 py-1 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5`}>
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-xs font-semibold">BOOSTED</span>
          </div>
        )}
      </div>

      <Link
        href={`/listings/${listing.id}`}
        prefetch={true}
        className="block"
      >
        {/* Image Section */}
        <div className={`relative ${CARD_CONSTANTS.imageHeight.promoted} bg-gradient-to-br from-purple-100 to-violet-100`}>
          {!imageError && primaryImage ? (
            <OptimizedImage
              src={primaryImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality="listing"
              watermark={true}
              priority={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="text-purple-400" size={64} />
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-2 bg-purple-600/90 text-white px-2 py-0.5 sm:py-1 rounded text-xs flex items-center gap-1">
              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{imageCount}</span>
            </div>
          )}

          {/* Purple Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600/10 to-transparent h-16 sm:h-20"></div>
        </div>

        {/* Content Section */}
        <div className={`${CARD_CONSTANTS.padding.promoted} bg-gradient-to-br from-white via-purple-50/20 to-violet-50/20`}>
          {/* Title */}
          <h3 className={`font-bold ${CARD_CONSTANTS.titleSize.topSpot} ${colors.text} ${colors.hover} mb-2 sm:mb-3 line-clamp-2 transition-colors`}>
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-500" />
              <span>{listing.year}</span>
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="text-purple-500 w-3 h-3" />
                <span className="truncate">{formatMileage(listing.mileage)}</span>
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <Fuel className="text-purple-500 w-3 h-3" />
                <span className="truncate">{listing.fuel_type}</span>
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-3 sm:mb-4">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm truncate">{listing.location}</span>
          </div>

          {/* Price and Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 sm:gap-0">
            <div className="flex-1 min-w-0">
              <div className={`font-bold ${CARD_CONSTANTS.priceSize.topSpot} ${colors.text}`}>
                {formatPrice(listing.price)}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">{listing.views || 0} views</span>
                  <span className="sm:hidden">{listing.views || 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getTimeAgo(listing.created_at)}
                </span>
              </div>
            </div>

            {/* Priority Badge */}
            <div className="text-right">
              <div className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span className="hidden sm:inline">Priority</span>
                <span className="sm:hidden">Top</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-purple-200">
            <div className="flex gap-2 mb-2 sm:mb-3">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setShowContactModal(true)
                }}
                size="sm"
                className={`flex-1 ${colors.button} text-white gap-1 text-xs sm:text-sm`}
              >
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Call</span>
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setShowConversationModal(true)
                }}
                variant="outline"
                size="sm"
                className={`flex-1 ${colors.buttonOutline} border-2 gap-1 text-xs sm:text-sm`}
              >
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Message</span>
              </Button>
            </div>

            {/* Premium Features Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs text-purple-700 font-medium flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-500" />
                <span className="hidden sm:inline">Top Position • Premium</span>
                <span className="sm:hidden">Premium</span>
              </span>
              <span className="text-xs text-gray-500">
                Verified
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-12 sm:top-16 right-3 sm:right-4 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-purple-200 w-8 h-8 sm:w-10 sm:h-10"
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