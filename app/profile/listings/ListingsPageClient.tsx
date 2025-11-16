'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Car, Camera, Zap, CheckCircle, Star, Crown, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import FilterDropdown from './components/FilterDropdown'
import LoadMoreButton from './components/LoadMoreButton'
import ListingStatusBadge from '@/app/components/listings/ListingStatusBadge'
import ListingActions from '@/app/components/listings/ListingActions'
import PromotionBadges from '@/app/components/listings/PromotionBadges'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Helper function to format listing dates
function formatListingDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return date.toLocaleDateString()
}

interface Listing {
  id: string
  title: string
  price: number
  views: number
  status: string
  created_at: string
  primary_image_url?: string
  image_url?: string
  image_urls?: string[]
  is_sold?: boolean
  is_reported?: boolean
  rejection_reason?: string
  // Promotion fields
  is_featured?: boolean
  is_top_spot?: boolean
  is_boosted?: boolean
  is_urgent?: boolean
  featured_until?: string
  top_spot_until?: string
  boosted_until?: string
  urgent_until?: string
  boost_score?: number
}

interface ListingsPageClientProps {
  listings: Listing[]
  totalCount: number
  hasMore: boolean
  statusFilter: string
  currentPage: number
}

export default function ListingsPageClient({
  listings: initialListings,
  totalCount,
  hasMore,
  statusFilter,
  currentPage
}: ListingsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [listings, setListings] = useState(initialListings)
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  // Handle payment success message from URL params
  useEffect(() => {
    const payment = searchParams.get('payment')
    const features = searchParams.get('features')
    const type = searchParams.get('type')

    if (payment === 'success' && features) {
      const featureList = features.split(',').map(f => {
        if (f === 'top-spot') return 'Top Spot'
        return f.charAt(0).toUpperCase() + f.slice(1)
      }).join(', ')
      
      setPaymentMessage(
        type === 'listing' 
          ? `Promotions activated successfully! Your listing now has: ${featureList}`
          : `Promotions activated successfully! Your wanted request now has: ${featureList}`
      )
      setShowPaymentSuccess(true)
      
      // Remove params from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('features')
      url.searchParams.delete('type')
      window.history.replaceState({}, '', url)
      
      // Refresh data to show updated promotions
      router.refresh()
      
      // Auto-hide after 8 seconds
      setTimeout(() => setShowPaymentSuccess(false), 8000)
    } else if (payment === 'failed') {
      toast.error('Payment failed. Please try again.')
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      window.history.replaceState({}, '', url)
    }
  }, [searchParams, router])

  // Handle pause listing
  const handlePause = async (listingId: string) => {
    try {
      const response = await fetch('/api/listings/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to pause listing')
      }

      toast.success('Listing paused successfully')
      router.refresh()
    } catch (error) {
      logger.error('Error pausing listing', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to pause listing')
    }
  }

  // Handle resume listing
  const handleResume = async (listingId: string) => {
    try {
      const response = await fetch('/api/listings/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resume listing')
      }

      toast.success('Listing resumed successfully')
      router.refresh()
    } catch (error) {
      logger.error('Error resuming listing', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to resume listing')
    }
  }

  // Handle mark as sold
  const handleMarkAsSold = async (listingId: string) => {
    if (!confirm('Mark this listing as sold?')) return

    try {
      const response = await fetch('/api/listings/mark-sold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark as sold')
      }

      toast.success('Listing marked as sold')
      router.refresh()
    } catch (error) {
      logger.error('Error marking listing as sold', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as sold')
    }
  }

  // Handle delete listing
  const handleDelete = async (listingId: string) => {
    if (!confirm('Move this listing to bin?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: listingId,
          item_type: 'listing'
        })
      })

      if (!response.ok) throw new Error('Failed to delete listing')

      toast.success('Listing moved to bin')
      router.refresh()
    } catch (error) {
      logger.error('Error deleting listing', error as Error)
      toast.error('Failed to move listing to bin')
    }
  }

  // Handle share listing
  const handleShare = (listingId: string) => {
    const url = `/listings/${listingId}`
    if (navigator.share) {
      navigator.share({
        title: 'Check out this vehicle',
        url: `${window.location.origin}${url}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      toast.success('Link copied to clipboard!')
    }
  }

  // Get active promotions for a listing
  const getActivePromotions = (listing: Listing) => {
    const promotions = []
    if (listing.is_featured && (!listing.featured_until || new Date(listing.featured_until) > new Date())) {
      promotions.push({ type: 'featured', until: listing.featured_until })
    }
    if (listing.is_top_spot && (!listing.top_spot_until || new Date(listing.top_spot_until) > new Date())) {
      promotions.push({ type: 'top_spot', until: listing.top_spot_until })
    }
    if (listing.is_boosted && (!listing.boosted_until || new Date(listing.boosted_until) > new Date())) {
      promotions.push({ type: 'boost', until: listing.boosted_until })
    }
    if (listing.is_urgent && (!listing.urgent_until || new Date(listing.urgent_until) > new Date())) {
      promotions.push({ type: 'urgent', until: listing.urgent_until })
    }
    return promotions
  }

  // Format expiration date
  const formatExpiration = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'Expired'
    if (diffDays === 0) return 'Expires today'
    if (diffDays === 1) return 'Expires tomorrow'
    return `Expires in ${diffDays} days`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        {/* Payment Success Message */}
        {showPaymentSuccess && paymentMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">{paymentMessage}</p>
              <p className="text-green-700 text-sm mt-1">Your promotions are now active and will be visible to all users.</p>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold">My Listings</h1>
            <FilterDropdown />
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {listings.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">
                  {statusFilter === 'all' ? 'No listings yet' : `No ${statusFilter === 'pending' ? 'under review' : statusFilter === 'reported' ? 'reported' : statusFilter} listings`}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {statusFilter === 'all' ? 'Start selling by posting your first vehicle' : 'Try selecting a different filter'}
                </p>
                <Button asChild variant="primary" size="default">
                  <Link href="/post">Post Your First Ad</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vehicle</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Views</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Posted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {listings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 overflow-hidden">
                                {listing.primary_image_url || listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                                  <img
                                    src={listing.primary_image_url || listing.image_url || listing.image_urls![0]}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="font-medium text-blue-600 hover:text-blue-700 block mb-1"
                                >
                                  {listing.title}
                                </Link>
                                {/* Promotion Badges */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <PromotionBadges listing={listing} size="small" />
                                </div>
                                {/* Promotion Expiration Info */}
                                {getActivePromotions(listing).length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {getActivePromotions(listing).map((p, idx) => (
                                      <span key={p.type}>
                                        {idx > 0 && ', '}
                                        {p.type === 'featured' ? 'Featured' : 
                                         p.type === 'top_spot' ? 'Top Spot' : 
                                         p.type === 'boost' ? 'Boost' : 'Urgent'}: {formatExpiration(p.until)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">Rs. {listing.price?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-4">{listing.views}</td>
                          <td className="px-4 py-4">
                            <ListingStatusBadge listing={listing} showReason={true} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{formatListingDate(listing.created_at)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {listing.status === 'active' && (
                                <Button
                                  asChild
                                  size="default"
                                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2 disabled:bg-gray-300 disabled:text-gray-500"
                                  disabled={getActivePromotions(listing).length > 0}
                                >
                                  <Link
                                    href={getActivePromotions(listing).length > 0 ? '#' : `/post/paid-features?listing=${listing.id}`}
                                    aria-disabled={getActivePromotions(listing).length > 0}
                                  >
                                    <Zap className="w-4 h-4" />
                                    Boost
                                  </Link>
                                </Button>
                              )}

                              {listing.status !== 'sold' && listing.status !== 'deleted' && (
                                <ListingActions
                                  listing={listing}
                                  onPause={() => handlePause(listing.id)}
                                  onResume={() => handleResume(listing.id)}
                                  onMarkAsSold={() => handleMarkAsSold(listing.id)}
                                  onDelete={() => handleDelete(listing.id)}
                                  onShare={() => handleShare(listing.id)}
                                  viewMode="mobile"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {listings.map((listing) => (
                    <div key={listing.id} className="bg-white border rounded-lg shadow-sm relative">
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div className="min-w-[64px] w-16 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden">
                            {listing.primary_image_url || listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                              <img
                                src={listing.primary_image_url || listing.image_url || listing.image_urls![0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700 line-clamp-2 break-words block"
                                >
                                  {listing.title}
                                </Link>
                                {/* Promotion Badges - Mobile */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <PromotionBadges listing={listing} size="small" />
                                </div>
                              </div>
                              
                              {listing.status !== 'sold' && listing.status !== 'deleted' && (
                                <ListingActions
                                  listing={listing}
                                  onPause={() => handlePause(listing.id)}
                                  onResume={() => handleResume(listing.id)}
                                  onMarkAsSold={() => handleMarkAsSold(listing.id)}
                                  onDelete={() => handleDelete(listing.id)}
                                  onShare={() => handleShare(listing.id)}
                                  viewMode="mobile"
                                />
                              )}
                            </div>

                            <div className="space-y-2 mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-gray-900">Rs. {listing.price?.toLocaleString() || '0'}</span>
                                <span className="text-xs text-gray-600">{listing.views} views</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <ListingStatusBadge listing={listing} showReason={false} />
                                <span className="text-gray-600">{formatListingDate(listing.created_at)}</span>
                              </div>

                              {/* Promotion Expiration Info - Mobile */}
                              {getActivePromotions(listing).length > 0 && (
                                <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                                  {getActivePromotions(listing).map((p, idx) => (
                                    <span key={p.type}>
                                      {idx > 0 && ' • '}
                                      {p.type === 'featured' ? '⭐ Featured' : 
                                       p.type === 'top_spot' ? '👑 Top Spot' : 
                                       p.type === 'boost' ? '⚡ Boost' : '🚨 Urgent'}: {formatExpiration(p.until)}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {listing.status === 'active' && (
                                <Button
                                  asChild
                                  size="default"
                                  className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
                                  disabled={getActivePromotions(listing).length > 0}
                                >
                                  <Link
                                    href={getActivePromotions(listing).length > 0 ? '#' : `/post/paid-features?listing=${listing.id}`}
                                    aria-disabled={getActivePromotions(listing).length > 0}
                                  >
                                    Boost
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                <LoadMoreButton currentPage={currentPage} hasMore={hasMore} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

