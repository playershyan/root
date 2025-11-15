'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Heart, MapPin, Calendar, Eye, Star, Crown, Gauge, Fuel, Settings, Phone, Mail, ArrowUp, AlertTriangle } from 'lucide-react'
import PromotionBadges from './PromotionBadges'
import ImageCarousel from '@/components/ui/ImageCarousel'
import { Button } from '@/components/ui/button'
import { CARD_CONSTANTS, PROMOTION_COLORS, getCardClasses } from './card-design-system'

// Lazy load modals (Phase 2 optimization)
const ContactModal = dynamic(() => import('@/app/components/modals/ContactModal'))
const ConversationModal = dynamic(() => import('@/app/components/modals/ConversationModal'))

interface FeaturedAdCardProps {
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
    created_at: string
    views?: number
    is_boosted?: boolean
    is_urgent?: boolean
    phone?: string
    whatsapp?: string
    user_id: string
  }
  promotionType: 'featured' | 'top_spot'
}

export default function FeaturedAdCard({ listing, promotionType }: FeaturedAdCardProps) {
  const priority = promotionType
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showConversationModal, setShowConversationModal] = useState(false)

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
    
    if (diffInHours < 1) return 'Now'
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

  const colors = priority === 'featured' ? PROMOTION_COLORS.featured : PROMOTION_COLORS.topSpot
  const cardClass = priority === 'featured' ? getCardClasses('featured') : getCardClasses('topSpot')

  return (
    <Link
      href={`/listings/${listing.id}`}
      prefetch={true}
    >
      <div className={cardClass}>
        {/* Overlay gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${priority === 'featured' ? CARD_CONSTANTS.overlay.featured : CARD_CONSTANTS.overlay.topSpot} pointer-events-none`}></div>

        {/* Premium Badge */}
        <div className={`absolute ${CARD_CONSTANTS.badgePosition.left} z-20 ${colors.badge} text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2`}>
          {priority === 'featured' ? (
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-white" />
          ) : (
            <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span className="text-xs sm:text-sm font-bold">{priority === 'featured' ? 'FEATURED' : 'TOP SPOT'}</span>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className={`relative ${priority === 'featured' ? 'lg:w-2/5' : 'lg:w-1/3'} ${CARD_CONSTANTS.imageHeight.featured} lg:h-auto`}>
            <ImageCarousel
              images={images}
              alt={listing.title}
              className="w-full h-full"
              priority={priority === 'featured'}
              showThumbnails={false}
            />

            {/* Promotion Badges Overlay */}
            <div className="absolute bottom-2 left-2 z-10">
              <PromotionBadges listing={listing} size="small" />
            </div>
          </div>

          {/* Content Section */}
          <div className={`flex-1 ${CARD_CONSTANTS.padding.featured}`}>
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className={`font-bold ${colors.text} ${colors.hover} mb-2 line-clamp-2 ${CARD_CONSTANTS.titleSize[priority]}`}>
                  {listing.title}
                </h3>
                
                {/* Vehicle Details */}
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="hidden xs:inline">{listing.year}</span>
                    <span className="xs:hidden">{listing.year}</span>
                  </span>
                  {listing.mileage && (
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="truncate">{formatMileage(listing.mileage)}</span>
                    </span>
                  )}
                  {listing.fuel_type && (
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="truncate">{listing.fuel_type}</span>
                    </span>
                  )}
                  {listing.transmission && (
                    <span className="flex items-center gap-1">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="truncate">{listing.transmission}</span>
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-2 sm:mb-3">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{listing.location}</span>
                </div>
              </div>

              {/* Favorite Button */}
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setIsFavorite(!isFavorite)
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </Button>
            </div>

            {/* Price Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className={`font-bold ${CARD_CONSTANTS.priceSize[priority]} ${colors.text}`}>
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

              {/* CTA Buttons for Featured Ads */}
              {priority === 'featured' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      setShowContactModal(true)
                    }}
                    className={`${colors.button} text-white gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm`}
                    size="sm"
                  >
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Call</span>
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      setShowConversationModal(true)
                    }}
                    className={`${colors.buttonOutline} border-2 gap-1.5 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm`}
                    size="sm"
                    variant="outline"
                  >
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Message</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Promotions */}
            {priority === 'featured' && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.is_boosted && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium inline-flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />Boosted
                    </span>
                  )}
                  {listing.is_urgent && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />Urgent
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto hidden sm:inline">
                    Premium • Verified
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
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
          primary_image_url: images[0] || listing.image_url || listing.primary_image_url,
          user_id: listing.user_id
        }}
      />
    </Link>
  )
}