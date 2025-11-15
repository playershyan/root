'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, Eye, TrendingUp, Star, Crown, Car, Camera, Gauge, Fuel, Phone, Mail } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'
import { Button } from '@/components/ui/button'
import { CARD_CONSTANTS, PROMOTION_COLORS, getCardClasses } from './card-design-system'

// Lazy load modals (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const ConversationModal = dynamic(() => import('@/app/components/modals/ConversationModal'))

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
    primary_image_url?: string
    created_at: string
    views?: number
    is_boosted: true
    is_featured?: boolean
    is_top_spot?: boolean
    boosted_until?: string
    phone?: string
    whatsapp?: string
    user_id: string
  }
}

export default function BoostedCard({ listing }: BoostedCardProps) {
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
  const colors = PROMOTION_COLORS.boosted

  return (
    <div className={getCardClasses('boosted')}>
      {/* Blue Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

      {/* Overlay gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_CONSTANTS.overlay.boosted} pointer-events-none`}></div>

      {/* Boost Badge */}
      <div className={`absolute ${CARD_CONSTANTS.badgePosition.left} z-20 mt-1`}>
        <div className={`${colors.badge} text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-md flex items-center gap-1 sm:gap-1.5`}>
          <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="text-xs font-bold tracking-wide">BOOSTED</span>
        </div>
      </div>

      {/* Additional Badges */}
      <div className={`absolute ${CARD_CONSTANTS.badgePosition.right} z-20 flex flex-col gap-1 mt-1`}>
        {listing.is_featured && (
          <div className={`${PROMOTION_COLORS.featured.badge} text-white px-2 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-1`}>
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
            <span className="text-xs font-semibold">FEATURED</span>
          </div>
        )}
        {listing.is_top_spot && (
          <div className={`${PROMOTION_COLORS.topSpot.badge} text-white px-2 py-0.5 sm:py-1 rounded-full shadow-md flex items-center gap-1`}>
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="text-xs font-semibold">TOP</span>
          </div>
        )}
      </div>

      <Link
        href={`/listings/${listing.id}`}
        prefetch={true}
        className="block"
      >
        {/* Image Section */}
        <div className={`relative ${CARD_CONSTANTS.imageHeight.promoted} bg-gradient-to-br from-blue-100 to-cyan-100 mt-0.5 sm:mt-1`}>
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
            <div className="w-full h-full flex items-center justify-center">
              <Car className="text-blue-400" size={48} />
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-2 bg-blue-600/90 text-white px-2 py-0.5 sm:py-1 rounded text-xs flex items-center gap-1">
              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{imageCount}</span>
            </div>
          )}

          {/* Boost Indicator - desktop only */}
          <div className="absolute bottom-2 right-2 bg-blue-600/90 text-white px-2 py-0.5 sm:py-1 rounded text-xs items-center gap-1 hidden sm:flex">
            <TrendingUp className="w-3 h-3" />
            <span>Boosted</span>
          </div>

          {/* Blue Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600/5 to-transparent h-12 sm:h-16"></div>
        </div>

        {/* Content Section */}
        <div className={`${CARD_CONSTANTS.padding.promoted} bg-gradient-to-br from-white via-blue-50/10 to-cyan-50/10`}>
          {/* Title */}
          <h3 className={`font-bold ${CARD_CONSTANTS.titleSize.boosted} ${colors.text} ${colors.hover} mb-2 line-clamp-2 transition-colors`}>
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              <span>{listing.year}</span>
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="text-blue-500 w-3 h-3" />
                <span className="truncate">{formatMileage(listing.mileage)}</span>
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <Fuel className="text-blue-500 w-3 h-3" />
                <span className="truncate">{listing.fuel_type}</span>
              </span>
            )}
          </div>

          {/* Location and Date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 gap-1 sm:gap-0">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className="truncate">{listing.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>

          {/* Price and Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className={`font-bold ${CARD_CONSTANTS.priceSize.boosted} ${colors.text}`}>
                {formatPrice(listing.price)}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">{listing.views || 0} views</span>
                <span className="sm:hidden">{listing.views || 0}</span>
              </div>
            </div>

            {/* Boost Status */}
            <div className="text-right">
              <div className="bg-blue-100 text-blue-700 px-2 py-0.5 sm:py-1 rounded text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Enhanced</span>
              </div>
            </div>
          </div>

          {/* Boost Benefits */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-blue-100">
            <div className="flex flex-wrap items-center justify-between mb-2 sm:mb-3 gap-1">
              <span className="text-xs text-blue-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">Increased Visibility</span>
                <span className="sm:hidden">Boosted</span>
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                More Views
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
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
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-10 sm:top-12 right-3 sm:right-4 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-md border border-blue-200 w-8 h-8 sm:w-10 sm:h-10"
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