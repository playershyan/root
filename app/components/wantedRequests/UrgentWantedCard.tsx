'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, AlertTriangle, MessageCircle, Eye, Phone, Clock } from 'lucide-react'
import FavoriteButton from '@/app/components/FavoriteButton'

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
    year_min?: number
    year_max?: number
    mileage_max?: number
    fuel_type?: string
    transmission?: string
    created_at: string
    views?: number
    responses?: number
    is_urgent: true
    urgent_until?: string
    urgency?: 'urgent' | 'high'
  }
}

export default function UrgentWantedCard({ request }: UrgentWantedCardProps) {
  const formatPrice = (price: number | null | undefined) => {
    return `Rs. ${price?.toLocaleString() || '0'}`
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
      return formatPrice(request.budget)
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

  const truncateDescription = (text: string, maxLength: number) => {
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
    <div className="relative rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer bg-white border-2 border-red-200 hover:border-red-300 shadow-lg hover:shadow-xl hover:shadow-red-200/50">
      {/* Urgent Pulse Animation */}
      <div className="absolute inset-0 bg-red-50/30 animate-pulse pointer-events-none"></div>

      {/* Urgent Banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 z-20">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span className="text-sm font-bold tracking-wide">URGENT REQUEST</span>
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        </div>
      </div>

      <Link href={`/wanted/${request.id}`} className="block">
        <div className="p-5 mt-10 bg-gradient-to-br from-white to-red-50/20">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-red-700 transition-colors">
              {request.title}
            </h3>

            {/* Vehicle Specifications */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-3 text-sm text-red-700 mb-3 font-medium">
                {request.make && <span>{request.make}</span>}
                {request.model && <span>{request.model}</span>}
                {getYearRange() && <span>{getYearRange()}</span>}
                {request.fuel_type && <span>{request.fuel_type}</span>}
                {request.transmission && <span>{request.transmission}</span>}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-4 text-sm line-clamp-3">
            {truncateDescription(request.description, 120)}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
            {request.mileage_max && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-red-500 text-xs"></i>
                Max {request.mileage_max?.toLocaleString() || '0'} km
              </span>
            )}
            {request.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-red-500 text-xs"></i>
                {request.fuel_type}
              </span>
            )}
            {request.transmission && (
              <span className="flex items-center gap-1">
                <i className="fas fa-cogs text-red-500 text-xs"></i>
                {request.transmission}
              </span>
            )}
          </div>

          {/* Location and Urgency */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              <span>{request.location}</span>
            </div>
            <div className="flex items-center gap-1 text-red-600 font-medium">
              <Clock className="w-3 h-3" />
              <span>Time Sensitive</span>
            </div>
          </div>

          {/* Budget */}
          <div className="mb-4">
            <div className="text-sm text-red-700 font-medium mb-1">Ready to Pay</div>
            <div className="font-bold text-2xl text-red-600">
              {formatBudgetRange()}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-gray-500 mb-4">
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

          {/* Urgent Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-red-100">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle instant response action
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Respond Now
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle call action
              }}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Call
            </button>
          </div>

          {/* Urgency Indicator */}
          <div className="mt-3 pt-3 border-t border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-700 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                Quick Decision Required
              </span>
              <span className="text-xs text-gray-500">
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-14 right-4 z-10">
        <FavoriteButton
          listingId={request.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-red-200"
        />
      </div>
    </div>
  )
}