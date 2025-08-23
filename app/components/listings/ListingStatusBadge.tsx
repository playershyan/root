'use client'

import { ListingData, getStatusInfo } from '@/lib/utils/listingStatus'

interface ListingStatusBadgeProps {
  listing: ListingData
  size?: 'sm' | 'md' | 'lg'
  showReason?: boolean
}

export default function ListingStatusBadge({ 
  listing, 
  size = 'sm',
  showReason = false 
}: ListingStatusBadgeProps) {
  const statusInfo = getStatusInfo(listing)
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`
        inline-flex font-medium rounded-full
        ${statusInfo.color.bg} ${statusInfo.color.text}
        ${sizeClasses[size]}
      `}>
        {statusInfo.label}
      </span>
      
      {showReason && listing.rejectionReason && (
        <p className="text-xs text-red-600">
          Reason: {listing.rejectionReason}
        </p>
      )}
    </div>
  )
}