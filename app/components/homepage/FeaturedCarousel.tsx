'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, MapPin, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

interface Listing {
  id: string
  title: string
  price: number
  image_url?: string
  image_urls?: string[]
  year?: number
  mileage?: number
  fuel_type?: string
  location?: string
  views?: number
  created_at: string
  make?: string
  model?: string
}

interface FeaturedCarouselProps {
  listings: Listing[]
}

const formatPrice = (price: number) => {
  return `Rs. ${price.toLocaleString()}`
}

const formatMileage = (mileage?: number) => {
  if (!mileage) return ''
  return `${mileage.toLocaleString()} km`
}

const getTimeAgo = (date: string) => {
  const now = new Date()
  const created = new Date(date)
  const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} days ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

export default function FeaturedCarousel({ listings }: FeaturedCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const cardWidth = container.offsetWidth / 3 // Scroll by ~1 card on desktop
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth

    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative group">
      {/* Scroll Left Button - Desktop */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all -translate-x-1/2 opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6 text-gray-900" />
        </button>
      )}

      {/* Scroll Right Button - Desktop */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all translate-x-1/2 opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6 text-gray-900" />
        </button>
      )}

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listings/${listing.id}`}
            className="group/card block flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[380px] lg:w-[360px] snap-start"
          >
            <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 h-full">
              {/* Featured Badge */}
              <div className="absolute z-10 top-3 left-3 md:top-4 md:left-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  FEATURED
                </div>
              </div>

              {/* Image */}
              <div className="relative h-48 md:h-52 bg-gray-200 overflow-hidden">
                {listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                  <Image
                    src={listing.image_url || listing.image_urls?.[0] || ''}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, 360px"
                    className="object-cover group-hover/card:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image available</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-900 group-hover/card:text-blue-600 transition-colors line-clamp-2 mb-2">
                    {listing.title}
                  </h3>

                  {/* Vehicle details */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    {listing.year && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {listing.year}
                      </span>
                    )}
                    {listing.mileage && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {formatMileage(listing.mileage)}
                      </span>
                    )}
                    {listing.fuel_type && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {listing.fuel_type}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {listing.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location}</span>
                    </div>
                  )}
                </div>

                {/* Price and stats */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {formatPrice(listing.price)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {listing.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getTimeAgo(listing.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* View button */}
                  <div className="bg-blue-600 text-white p-2 rounded-full group-hover/card:bg-blue-700 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Scroll Indicators - Mobile */}
      <div className="flex lg:hidden justify-center gap-2 mt-4">
        {listings.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-gray-300"
          />
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
