'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, MessageCircle, TrendingUp } from 'lucide-react'
import FavoriteButton from '@/app/components/FavoriteButton'
import ContactModal from '@/app/components/modals/ContactModal'

interface RegularWantedCardProps {
  request: {
    id: string
    title: string
    description: string
    budget?: number | null
    min_budget?: number | null
    max_budget?: number | null
    location: string
    make?: string
    model?: string
    min_year?: number
    max_year?: number
    max_mileage?: number
    fuel_type?: string
    transmission?: string
    created_at: string
    views?: number
    clicks?: number
    urgency?: 'low' | 'medium' | 'high'
  }
}

export default function RegularWantedCard({ request }: RegularWantedCardProps) {
  const [showContactModal, setShowContactModal] = useState(false)

  const handleRespondClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('[WantedCard] Tracking click for request:', request.id)

    // Track click in database
    try {
      const response = await fetch('/api/wanted-requests/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request.id })
      })

      const result = await response.json()
      console.log('[WantedCard] Track click response:', result)

      if (!response.ok) {
        console.error('[WantedCard] Track click failed:', result)
      }
    } catch (error) {
      console.error('[WantedCard] Failed to track click:', error)
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
    if (request.min_year && request.max_year) {
      return `${request.min_year} - ${request.max_year}`
    } else if (request.min_year) {
      return `${request.min_year}+`
    } else if (request.max_year) {
      return `Up to ${request.max_year}`
    }
    return null
  }

  return (
    <>
      <div className="
        relative rounded-xl overflow-hidden
        bg-white
        border border-gray-200
        shadow-md hover:shadow-lg
        transition-all duration-300
        hover:-translate-y-1
      ">
        {/* Favorite Button - Top Right Corner */}
        <div className="absolute top-3 right-3 z-30">
          <FavoriteButton
            listingId={request.id}
            className="bg-white hover:bg-gray-50 shadow-md border border-gray-200 hover:border-gray-300 transition-colors"
          />
        </div>

        <Link href={`/wanted/${request.id}`} className="block">
        <div className="relative p-5">

          {/* Title & Vehicle Info */}
          <div className="mb-4 pr-8">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors text-lg">
              {request.title}
            </h3>

            {/* Vehicle Specs Pills */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {request.make && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.make}
                  </span>
                )}
                {request.model && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.model}
                  </span>
                )}
                {getYearRange() && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
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
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Location */}
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm truncate">{request.location}</span>
            </div>

            {/* Mileage */}
            {request.max_mileage && (
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm">Max {request.max_mileage.toLocaleString()} km</span>
              </div>
            )}

            {/* Fuel Type */}
            {request.fuel_type && (
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-gas-pump text-gray-500 text-sm w-4 text-center flex-shrink-0"></i>
                <span className="text-sm">{request.fuel_type}</span>
              </div>
            )}

            {/* Transmission */}
            {request.transmission && (
              <div className="flex items-center gap-2 text-gray-700">
                <i className="fas fa-cogs text-gray-500 text-sm w-4 text-center flex-shrink-0"></i>
                <span className="text-sm">{request.transmission}</span>
              </div>
            )}
          </div>

          {/* Budget Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-3 mb-4 border border-gray-200/50">
            <div className="text-xs text-gray-600 font-semibold mb-1 uppercase tracking-wide">Budget Range</div>
            <div className="font-bold text-gray-900 text-xl">
              {formatBudgetRange()}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between py-3 border-t border-gray-200/50">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {getTimeAgo(request.created_at)}
            </span>

            {/* Verified Badge */}
            {request.urgency && (
              <div className={`text-xs font-medium flex items-center gap-1 ${
                request.urgency === 'high' ? 'text-orange-600' :
                request.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  request.urgency === 'high' ? 'bg-orange-500' :
                  request.urgency === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></span>
                {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-3">
            <button
              onClick={handleRespondClick}
              className="
                w-full bg-blue-600
                hover:bg-blue-700
                text-white font-semibold rounded-lg
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-sm hover:shadow-md
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
          year: request.max_year || request.min_year
        }}
      />
    </>
  )
}
