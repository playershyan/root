'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Star, MessageCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import FavoriteButton from '@/app/components/FavoriteButton'
import ContactModal from '@/app/components/modals/ContactModal'

interface GoldFeaturedWantedCardProps {
  request: {
    id: string
    title: string
    description: string | null
    budget?: number | null
    min_budget?: number | null
    max_budget?: number | null
    location: string
    make?: string
    model?: string
    year_min?: number
    year_max?: number
    mileage_max?: number
    fuel_type?: string
    transmission?: string
    created_at: string
    views?: number
    clicks?: number
    is_featured: true
    is_urgent?: boolean
    featured_until?: string
    urgency?: 'low' | 'medium' | 'high' | 'urgent'
  }
  size?: 'regular' | 'large'
}

export default function GoldFeaturedWantedCard({ request, size = 'regular' }: GoldFeaturedWantedCardProps) {
  const [showContactModal, setShowContactModal] = useState(false)
  const isLarge = size === 'large'

  const handleRespondClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Track click in database
    try {
      await fetch('/api/wanted-requests/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id })
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }

    // Open modal
    setShowContactModal(true)
  }

  const formatBudgetRange = () => {
    if (request.min_budget && request.max_budget) {
      return `Rs. ${request.min_budget.toLocaleString()} - ${request.max_budget.toLocaleString()}`
    }
    if (request.max_budget) {
      return `Up to Rs. ${request.max_budget.toLocaleString()}`
    }
    if (request.min_budget) {
      return `From Rs. ${request.min_budget.toLocaleString()}`
    }
    if (request.budget) {
      return `Rs. ${request.budget.toLocaleString()}`
    }
    return 'Budget not specified'
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

  const getYearRange = () => {
    if (request.year_min && request.year_max) {
      return `${request.year_min} - ${request.year_max}`
    } else if (request.year_min) {
      return `${request.year_min}+`
    } else if (request.year_max) {
      return `Up to ${request.year_max}`
    }
    return null
  }

  return (
    <>
      <div className={`
        relative rounded-xl overflow-hidden
        bg-gradient-to-br from-amber-50 via-yellow-50/80 to-white
        border-2 border-amber-300/50
        shadow-xl shadow-amber-200/30
        hover:shadow-2xl hover:shadow-amber-300/40
        transition-all duration-300
        hover:-translate-y-1
      `}>
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        {/* Top Badges Row */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-20">
          {/* Featured Badge */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <Star className="w-3.5 h-3.5 fill-white" />
            <span className="text-xs font-bold tracking-wide">FEATURED</span>
          </div>

          {/* Urgent Badge */}
          {request.is_urgent && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-bold">URGENT</span>
            </div>
          )}
        </div>

        {/* Favorite Button - Top Right Corner */}
        <div className="absolute top-3 right-3 z-30">
          <FavoriteButton
            listingId={request.id}
            className="bg-white hover:bg-amber-50 shadow-md border border-amber-200 hover:border-amber-300 transition-colors"
          />
        </div>

        <Link href={`/wanted/${request.id}`} className="block">
        <div className={`relative pt-12 pb-5 px-5 ${isLarge ? 'lg:px-8' : ''}`}>

          {/* Title & Vehicle Info */}
          <div className="mb-4">
            <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 hover:text-amber-700 transition-colors ${
              isLarge ? 'text-2xl lg:text-3xl' : 'text-lg'
            }`}>
              {request.title}
            </h3>

            {/* Vehicle Specs Pills */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {request.make && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.make}
                  </span>
                )}
                {request.model && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.model}
                  </span>
                )}
                {getYearRange() && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {getYearRange()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-2">
              {request.description}
            </p>
          )}

          {/* Requirements Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Location */}
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm truncate">{request.location}</span>
            </div>

            {/* Mileage */}
            {request.mileage_max && (
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm">Max {request.mileage_max.toLocaleString()} km</span>
              </div>
            )}

            {/* Fuel Type */}
            {request.fuel_type && (
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-gas-pump text-amber-500 text-sm w-4 text-center flex-shrink-0"></i>
                <span className="text-sm">{request.fuel_type}</span>
              </div>
            )}

            {/* Transmission */}
            {request.transmission && (
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-cogs text-amber-500 text-sm w-4 text-center flex-shrink-0"></i>
                <span className="text-sm">{request.transmission}</span>
              </div>
            )}
          </div>

          {/* Budget Section */}
          <div className="bg-gradient-to-br from-amber-100/60 to-yellow-100/50 rounded-lg p-3 mb-4 border border-amber-200/50">
            <div className="text-xs text-amber-700 font-semibold mb-1 uppercase tracking-wide">Budget Range</div>
            <div className="font-bold text-amber-600 text-xl">
              {formatBudgetRange()}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between py-3 border-t border-amber-200/50">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                {request.clicks || 0} clicks
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {getTimeAgo(request.created_at)}
              </span>
            </div>

            {/* Verified Badge */}
            <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              Verified
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-3">
            <button
              onClick={handleRespondClick}
              className="
                w-full bg-gradient-to-r from-amber-500 to-yellow-500
                hover:from-amber-600 hover:to-yellow-600
                text-white font-bold rounded-lg
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-md hover:shadow-lg
                py-2.5 text-sm
              "
            >
              <MessageCircle className="w-4 h-4" />
              Respond to Request
            </button>
          </div>

        </div>
        </Link>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        listing={{
          id: request.id,
          title: request.title,
          phone: request.phone,
          whatsapp: request.whatsapp,
          price: request.max_budget || request.min_budget || 0,
          location: request.location,
          make: request.make,
          model: request.model,
          year: request.year_max || request.year_min
        }}
      />
    </>
  )
}
