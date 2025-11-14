'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Eye, Car, ImageIcon, Zap } from 'lucide-react'
import PromotionBadges from './PromotionBadges'
import OptimizedImage from '@/components/ui/OptimizedImage'
import FavoriteButton from '@/app/components/FavoriteButton'

interface ListingCardProps {
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
    created_at: string
    views?: number
    is_featured?: boolean
    is_top_spot?: boolean
    is_boosted?: boolean
    is_urgent?: boolean
  }
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [imageError, setImageError] = useState(false)

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

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden group relative">
      {/* Clickable Link Area */}
      <Link
        href={`/listings/${listing.id}`}
        prefetch={true}
        className="block"
      >
        {/* Image Section */}
        <div className="relative h-52 bg-slate-100 overflow-hidden">
        {!imageError && primaryImage ? (
          <OptimizedImage
            src={primaryImage}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality="listing"
            watermark={true}
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <Car className="text-slate-300 mb-2" size={48} />
            <span className="text-xs text-slate-400 font-medium">No image</span>
          </div>
        )}

        {/* Image overlay gradient for better badge contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>

        {/* Promotion Badges */}
        <div className="absolute top-3 left-3 z-10">
          <PromotionBadges listing={listing} size="small" />
        </div>

        {/* Image count badge - repositioned to avoid favorite button */}
        {imageCount > 1 && (
          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-lg">
            <ImageIcon size={16} />
            <span>{imageCount}</span>
          </div>
        )}

        {/* Urgent indicator */}
        {listing.is_urgent && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1.5">
              <Zap size={12} />
              URGENT
            </span>
          </div>
        )}

        {/* Favorite Button - Top right, above image */}
        <div className="absolute top-3 right-3 z-20">
          <FavoriteButton
            listingId={listing.id}
            size="small"
            className="bg-white/95 backdrop-blur-md hover:bg-white shadow-lg transition-all duration-200"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 text-base line-clamp-2 mb-3 leading-snug group-hover:text-slate-700 transition-colors">
          {listing.title}
        </h3>

        {/* Vehicle Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Year</span>
            <span className="text-sm font-semibold text-slate-700">{listing.year}</span>
          </div>

          {listing.mileage && (
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Mileage</span>
              <span className="text-sm font-semibold text-slate-700">{formatMileage(listing.mileage)}</span>
            </div>
          )}

          {listing.fuel_type && (
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">Fuel</span>
              <span className="text-sm font-semibold text-slate-700 capitalize">{listing.fuel_type}</span>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} />
          <span className="text-xs font-medium truncate">{listing.location}</span>
        </div>

        {/* Price and Stats Row */}
        <div className="flex items-center justify-between">
          {/* Price */}
          <div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Price</div>
            <div className={`font-bold text-xl ${listing.is_urgent ? 'text-emerald-600' : 'text-slate-900'}`}>
              {formatPrice(listing.price)}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <Eye className="w-3.5 h-3.5 text-slate-400 mb-1" strokeWidth={2.5} />
              <span className="text-xs font-semibold text-slate-600">{listing.views || 0}</span>
            </div>
            <div className="flex flex-col items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mb-1" strokeWidth={2.5} />
              <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{getTimeAgo(listing.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
      </Link>
    </div>
  )
}
