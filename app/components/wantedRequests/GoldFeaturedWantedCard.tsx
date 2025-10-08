'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Star, MessageCircle, Eye, AlertTriangle } from 'lucide-react'
import FavoriteButton from '@/app/components/FavoriteButton'

interface GoldFeaturedWantedCardProps {
  request: {
    id: string
    title: string
    description: string | null
    budget: number
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
    responses?: number
    is_featured: true
    is_urgent?: boolean
    featured_until?: string
    urgency?: 'low' | 'medium' | 'high' | 'urgent'
  }
  size?: 'regular' | 'large'
}

export default function GoldFeaturedWantedCard({ request, size = 'regular' }: GoldFeaturedWantedCardProps) {
  const isLarge = size === 'large'

  const formatPrice = (price: number | null | undefined) => {
    return `Rs. ${price?.toLocaleString() || '0'}`
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

  const truncateDescription = (text: string | null, maxLength: number) => {
    if (!text) return 'No description available'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
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
    <div className={`
      relative rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer
      bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50
      border-2 border-amber-200 hover:border-amber-300
      shadow-lg hover:shadow-xl hover:shadow-amber-200/50
      ${isLarge ? 'transform hover:scale-[1.02]' : 'hover:-translate-y-1'}
    `}>
      {/* Golden Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-yellow-100/20 pointer-events-none"></div>

      {/* Featured Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Star className="w-4 h-4 fill-white" />
          <span className="text-sm font-bold tracking-wide">FEATURED REQUEST</span>
        </div>
      </div>

      {/* Urgent Badge */}
      {request.is_urgent && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-semibold">URGENT</span>
          </div>
        </div>
      )}

      <Link href={`/wanted/${request.id}`} className="block">
        <div className={`p-6 ${isLarge ? 'lg:p-8' : ''} bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/30`}>
          {/* Header */}
          <div className="mb-4">
            <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors ${
              isLarge ? 'text-2xl' : 'text-xl'
            }`}>
              {request.title}
            </h3>

            {/* Vehicle Specifications */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-3 text-sm text-amber-700 mb-3 font-medium">
                {request.make && <span>{request.make}</span>}
                {request.model && <span>{request.model}</span>}
                {getYearRange() && <span>{getYearRange()}</span>}
                {request.fuel_type && <span>{request.fuel_type}</span>}
                {request.transmission && <span>{request.transmission}</span>}
              </div>
            )}
          </div>

          {/* Description */}
          <p className={`text-gray-600 mb-4 ${isLarge ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'}`}>
            {truncateDescription(request.description, isLarge ? 200 : 120)}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
            {request.mileage_max && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-amber-500 text-xs"></i>
                Max {request.mileage_max?.toLocaleString() || '0'} km
              </span>
            )}
            {request.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-amber-500 text-xs"></i>
                {request.fuel_type}
              </span>
            )}
            {request.transmission && (
              <span className="flex items-center gap-1">
                <i className="fas fa-cogs text-amber-500 text-xs"></i>
                {request.transmission}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="text-sm">{request.location}</span>
          </div>

          {/* Budget and Stats */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-sm text-amber-700 font-medium mb-1">Budget Range</div>
              <div className={`font-bold text-amber-600 ${isLarge ? 'text-3xl' : 'text-2xl'}`}>
                {formatPrice(request.budget)}
              </div>

              {/* Stats */}
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {request.views || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {request.responses || 0} responses
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {getTimeAgo(request.created_at)}
                </span>
              </div>
            </div>

            {/* CTA Button for Large Cards */}
            {isLarge && (
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-lg">
                Respond to Request
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Premium Features Indicator */}
          <div className="pt-4 border-t border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Premium Request • Priority Display
              </span>
              <span className="text-xs text-gray-500">
                Verified Buyer
              </span>
            </div>
          </div>

          {/* Response CTA for Regular Cards */}
          {!isLarge && (
            <div className="mt-4 pt-3 border-t border-amber-200">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // Handle response action
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Respond to Request
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-16 right-4 z-10">
        <FavoriteButton
          listingId={request.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-amber-200"
        />
      </div>
    </div>
  )
}