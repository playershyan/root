'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, AlertTriangle, MessageCircle, TrendingUp, Fuel, Settings } from 'lucide-react'
import WantedRequestFavoriteButton from '@/app/components/WantedRequestFavoriteButton'
import ContactModal from '@/app/components/modals/ContactModal'
import { logger } from '@/lib/utils/logger'

interface UrgentWantedCardProps {
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
    phone?: string
    whatsapp?: string
  }
}

export default function UrgentWantedCard({ request }: UrgentWantedCardProps) {
  const [showContactModal, setShowContactModal] = useState(false)

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
      logger.error('Failed to track wanted request click', error as Error, {
        component: 'UrgentWantedCard',
        action: 'handleRespondClick',
        requestId: request.id
      })
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
    
    if (diffInHours < 1) return 'Now'
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
        bg-gradient-to-br from-orange-50 via-white to-orange-50/50
        border-2 border-orange-300
        shadow-xl shadow-orange-200/40
        hover:shadow-2xl hover:shadow-orange-300/50
        transition-all duration-300
        hover:-translate-y-1
      ">
        {/* Subtle Pulse Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-50/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        {/* Top Badges Row */}
        <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-20">
          {/* High Priority Badge */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-wide">HIGH PRIORITY</span>
          </div>
        </div>

        {/* Favorite Button - Top Right Corner */}
        <div className="absolute top-3 right-3 z-30">
          <WantedRequestFavoriteButton
            requestId={request.id}
            className="bg-white hover:bg-orange-50 shadow-md border border-orange-200 hover:border-orange-300 transition-colors"
          />
        </div>

        <Link href={`/wanted/${request.id}`} className="block">
        <div className="relative pt-12 pb-5 px-5">

          {/* Title & Vehicle Info */}
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-orange-600 transition-colors text-lg">
              {request.title}
            </h3>

            {/* Vehicle Specs Pills */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {request.make && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.make}
                  </span>
                )}
                {request.model && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {request.model}
                  </span>
                )}
                {getYearRange() && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full">
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
              <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm truncate">{request.location}</span>
            </div>

            {/* Mileage */}
            {request.max_mileage && (
              <div className="flex items-center gap-2 text-gray-700">
                <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm">Max {request.max_mileage.toLocaleString()} km</span>
              </div>
            )}

            {/* Fuel Type */}
            {request.fuel_type && (
              <div className="flex items-center gap-2 text-gray-700">
                <Fuel className="text-orange-500 text-sm w-4 h-4 text-center flex-shrink-0" />
                <span className="text-sm">{request.fuel_type}</span>
              </div>
            )}

            {/* Transmission */}
            {request.transmission && (
              <div className="flex items-center gap-2 text-gray-700">
                <Settings className="text-orange-500 text-sm w-4 h-4 text-center flex-shrink-0" />
                <span className="text-sm">{request.transmission}</span>
              </div>
            )}
          </div>

          {/* Budget Section */}
          <div className="bg-gradient-to-br from-orange-100/60 to-orange-50/50 rounded-lg p-3 mb-4 border border-orange-200/50">
            <div className="text-xs text-orange-700 font-semibold mb-1 uppercase tracking-wide">Ready to Pay</div>
            <div className="font-bold text-orange-600 text-xl">
              {formatBudgetRange()}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between py-3 border-t border-orange-200/50">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {getTimeAgo(request.created_at)}
            </span>

            {/* Priority Indicator */}
            <div className="flex items-center gap-1 text-xs text-orange-700 font-medium">
              <AlertTriangle className="w-3 h-3" />
              High Priority
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-3">
            <button
              onClick={handleRespondClick}
              className="
                w-full bg-gradient-to-r from-orange-500 to-orange-600
                hover:from-orange-600 hover:to-orange-700
                text-white font-bold rounded-lg
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-md hover:shadow-lg
                py-2.5 text-sm
              "
            >
              <MessageCircle className="w-4 h-4" />
              Respond
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
