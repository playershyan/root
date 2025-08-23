'use client'

import Link from 'next/link'
import { AlertCircle, Info, Edit } from 'lucide-react'
import { ListingData, getListingStatus } from '@/lib/utils/listingStatus'

interface ListingStatusMessageProps {
  listing: ListingData & { 
    id: string
    takedownReason?: string
    pauseDate?: string
  }
}

export default function ListingStatusMessage({ listing }: ListingStatusMessageProps) {
  const status = getListingStatus(listing)
  
  if (status === 'reported' || (status === 'rejected' && listing.rejectionReason)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">
              {status === 'reported' 
                ? 'Listing removed due to multiple reports' 
                : 'Your listing was rejected'}
            </p>
            {(listing.rejectionReason || listing.takedownReason) && (
              <p className="text-xs text-red-600 mt-1">
                Reason: {listing.rejectionReason || listing.takedownReason}
              </p>
            )}
          </div>
        </div>
        
        <Link 
          href={`/post?edit=${listing.id}`}
          className="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 inline-flex items-center gap-1.5 font-medium transition-all"
        >
          <Edit className="w-3 h-3" />
          Edit & Resubmit
        </Link>
      </div>
    )
  }
  
  if (status === 'paused' && listing.pauseDate) {
    const pausedDays = Math.floor(
      (Date.now() - new Date(listing.pauseDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700 font-medium">
              Listing paused {pausedDays > 0 ? `${pausedDays} days ago` : 'today'}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              This listing is not visible to buyers. Resume to make it active again.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'sold') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-green-700 font-medium">
            Congratulations on your sale!
          </p>
        </div>
      </div>
    )
  }
  
  return null
}