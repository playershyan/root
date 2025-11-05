'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { MapPin, Calendar, Eye, Crown, Star, TrendingUp } from 'lucide-react'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'
import { Button } from '@/components/ui/button'

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
    <div className="relative rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-purple-50 via-white to-purple-50 border-2 border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl hover:shadow-purple-200/50 hover:-translate-y-1">
      {/* Purple Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/10 via-transparent to-violet-100/10 pointer-events-none"></div>

      {/* Crown Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Crown className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">TOP SPOT</span>
        </div>
      </div>

      {/* Additional Badges */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {listing.is_featured && (
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-white" />
            <span className="text-xs font-semibold">FEATURED</span>
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
        {/* Image Section */}
        <div className="relative h-52 bg-gradient-to-br from-purple-100 to-violet-100">
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
              <i className="fas fa-car text-purple-400 text-4xl"></i>
            </div>
          )}

          {/* Image count */}
          {imageCount > 1 && (
            <div className="absolute bottom-2 left-2 bg-purple-600/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <i className="fas fa-camera"></i>
              <span>{imageCount}</span>
            </div>
          )}

          {/* Purple Gradient Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600/10 to-transparent h-20"></div>
        </div>

        {/* Content Section */}
        <div className="p-5 bg-gradient-to-br from-white via-purple-50/20 to-violet-50/20">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-700 transition-colors">
            {listing.title}
          </h3>

          {/* Vehicle Details */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-purple-500" />
              {listing.year}
            </span>
            {listing.mileage && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-purple-500 text-xs"></i>
                {formatMileage(listing.mileage)}
              </span>
            )}
            {listing.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-purple-500 text-xs"></i>
                {listing.fuel_type}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span className="text-sm">{listing.location}</span>
          </div>

          {/* Price and Stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className="font-bold text-2xl text-purple-600">
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

            {/* Priority Badge */}
            <div className="text-right">
              <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Priority
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-purple-200">
            <div className="flex gap-2 mb-3">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setShowContactModal(true)
                }}
                size="default"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                <i className="fas fa-phone text-xs"></i>
                Call
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  setShowConversationModal(true)
                }}
                variant="outline"
                size="default"
                className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50 gap-1"
              >
                <i className="fas fa-envelope text-xs"></i>
                Message
              </Button>
            </div>

            {/* Premium Features Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-700 font-medium flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-500" />
                Top Position • Premium Visibility
              </span>
              <span className="text-xs text-gray-500">
                Verified
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-16 right-4 z-10">
        <FavoriteButton
          listingId={listing.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-purple-200"
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