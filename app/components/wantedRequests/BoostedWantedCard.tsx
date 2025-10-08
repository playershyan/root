'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, TrendingUp, MessageCircle, Eye, Phone, Zap } from 'lucide-react'
import FavoriteButton from '@/app/components/FavoriteButton'

interface BoostedWantedCardProps {
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
    responses?: number
    is_boosted: true
    boosted_until?: string
    urgency?: 'low' | 'medium' | 'high'
  }
}

export default function BoostedWantedCard({ request }: BoostedWantedCardProps) {
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
    <div className="relative rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl hover:shadow-blue-200/50 hover:-translate-y-1">
      {/* Boost Badge */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">BOOSTED</span>
        </div>
      </div>

      {/* Boost Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-blue-100/20 pointer-events-none"></div>

      <Link href={`/wanted/${request.id}`} className="block">
        <div className="p-6 mt-12 bg-gradient-to-br from-white via-blue-50/30 to-white">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
              {request.title}
            </h3>

            {/* Vehicle Specifications */}
            {(request.make || request.model || getYearRange()) && (
              <div className="flex flex-wrap gap-3 text-sm text-blue-700 mb-3 font-medium">
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
            {truncateDescription(request.description, 140)}
          </p>

          {/* Requirements */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
            {request.max_mileage && (
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-blue-500 text-xs"></i>
                Max {request.max_mileage?.toLocaleString() || '0'} km
              </span>
            )}
            {request.fuel_type && (
              <span className="flex items-center gap-1">
                <i className="fas fa-gas-pump text-blue-500 text-xs"></i>
                {request.fuel_type}
              </span>
            )}
            {request.transmission && (
              <span className="flex items-center gap-1">
                <i className="fas fa-cogs text-blue-500 text-xs"></i>
                {request.transmission}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-sm">{request.location}</span>
          </div>

          {/* Budget */}
          <div className="mb-4">
            <div className="text-sm text-blue-700 font-medium mb-1">Budget Range</div>
            <div className="font-bold text-2xl text-blue-600">
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

          {/* Boost Features */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Boosted Benefits</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Higher visibility in search results</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Daily repositioning to top of listings</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>Up to 8x more responses</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-blue-100">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle priority response action
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Priority Response
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Handle contact action
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              Contact
            </button>
          </div>

          {/* Boost Status */}
          <div className="mt-4 pt-3 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-700 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                Boosted Request • Enhanced Visibility
              </span>
              <span className="text-xs text-gray-500">
                Verified Buyer
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button */}
      <div className="absolute top-16 right-4 z-10">
        <FavoriteButton
          listingId={request.id}
          className="bg-white/90 hover:bg-white shadow-lg border border-blue-200"
        />
      </div>
    </div>
  )
}