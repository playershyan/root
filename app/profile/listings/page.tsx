'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Car, Camera, Eye, CheckCircle, Zap } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'
import { useListingManagement } from '@/app/hooks/useListingManagement'
import ListingStatusBadge from '@/app/components/listings/ListingStatusBadge'
import ListingActions from '@/app/components/listings/ListingActions'
import ListingStatusMessage from '@/app/components/listings/ListingStatusMessage'
import { filterListingsByStatus } from '@/lib/utils/listingStatus'

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

export default function ListingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const {
    listings,
    loading,
    statusFilter,
    setStatusFilter,
    markAsSold,
    pauseListing,
    resumeListing,
    deleteListing
  } = useListingManagement(user?.id)

  // Filter listings based on status
  const filteredListings = filterListingsByStatus(listings, statusFilter)

  // Event handlers
  const handleMarkAsSold = async (listingId: string) => {
    const result = await markAsSold(listingId)
    if (result.success) {
      // Success handled by hook state update
    } else {
      alert(result.error || 'Failed to mark listing as sold')
    }
  }

  const handlePauseAd = async (listingId: string) => {
    const result = await pauseListing(listingId)
    if (result.success) {
      // Success handled by hook state update
    } else {
      alert(result.error || 'Failed to pause listing')
    }
  }

  const handleResumeAd = async (listingId: string) => {
    const result = await resumeListing(listingId)
    if (result.success) {
      // Success handled by hook state update
    } else {
      alert(result.error || 'Failed to resume listing')
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    const result = await deleteListing(id)
    if (result.success) {
      // Success handled by hook state update
    } else {
      alert(result.error || 'Failed to delete listing')
    }
  }

  const handleShare = (listing: any) => {
    const url = `${window.location.origin}/listings/${listing.id}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link')
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-xl md:text-2xl font-semibold">My Listings</h1>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Listings</option>
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="pending">Under Review</option>
              <option value="paused">Paused</option>
              <option value="reported">Reported</option>
            </select>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">
                  {statusFilter === 'all' ? 'No listings yet' : `No ${statusFilter === 'pending' ? 'under review' : statusFilter === 'reported' ? 'reported' : statusFilter} listings`}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {statusFilter === 'all' ? 'Start selling by posting your first vehicle' : 'Try selecting a different filter'}
                </p>
                <Link
                  href="/post"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block"
                >
                  Post Your First Ad
                </Link>
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
                      {filteredListings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 overflow-hidden">
                                {listing.primary_image_url || listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                                  <img
                                    src={listing.primary_image_url || listing.image_url || listing.image_urls[0]}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <Link
                                  href={`/listings/${listing.id}`}
                                  className="font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {listing.title}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">Rs. {listing.price?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-4">{listing.views}</td>
                          <td className="px-4 py-4">
                            <ListingStatusBadge listing={listing} showReason={true} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{formatListingDate(listing.postedDate)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {listing.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsSold(listing.id)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm transition-all whitespace-nowrap h-9"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Sold
                                  </button>
                                  <Link
                                    href={`/post/paid-features?listing=${listing.id}`}
                                    className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 inline-flex items-center gap-2 font-medium shadow-sm transition-all h-9"
                                  >
                                    <Zap className="w-4 h-4 animate-pulse" />
                                    Boost
                                  </Link>
                                </>
                              )}

                              {listing.status !== 'sold' && listing.status !== 'deleted' && (
                                <ListingActions
                                  listing={listing}
                                  onPause={handlePauseAd}
                                  onResume={handleResumeAd}
                                  onMarkAsSold={handleMarkAsSold}
                                  onDelete={(id) => handleDelete(id, 'listing')}
                                  onShare={handleShare}
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
                <div className="md:hidden space-y-4 relative">
                  {filteredListings.map((listing) => (
                    <div key={listing.id} className="bg-white border rounded-lg shadow-sm relative">
                      {/* Card Header with Image and Title */}
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div className="min-w-[64px] w-16 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden">
                            {listing.primary_image_url || listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                              <img
                                src={listing.primary_image_url || listing.image_url || listing.image_urls[0]}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/listings/${listing.id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 block line-clamp-2 break-words"
                              >
                                {listing.title}
                              </Link>
                              {listing.status !== 'sold' && listing.status !== 'deleted' && (
                                <div className="flex-shrink-0">
                                  <ListingActions
                                    listing={listing}
                                    onPause={handlePauseAd}
                                    onResume={handleResumeAd}
                                    onMarkAsSold={handleMarkAsSold}
                                    onDelete={(id) => handleDelete(id, 'listing')}
                                    onShare={handleShare}
                                    viewMode="mobile"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className="text-base font-semibold text-gray-900">Rs. {listing.price?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {listing.views} views
                          </span>
                          <span>{formatListingDate(listing.postedDate)}</span>
                        </div>

                        {/* Status */}
                        <div className="mb-3">
                          <ListingStatusBadge listing={listing} showReason={true} />
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          {listing.status === 'active' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleMarkAsSold(listing.id)}
                                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-all"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Mark as Sold
                              </button>
                              <Link
                                href={`/post/paid-features?listing=${listing.id}`}
                                className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-amber-600 flex items-center justify-center gap-2 font-medium transition-all"
                              >
                                <Zap className="w-4 h-4" />
                                Boost
                              </Link>
                            </div>
                          )}

                          <ListingStatusMessage listing={listing} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
