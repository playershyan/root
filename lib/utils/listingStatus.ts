export type ListingStatusType = 
  | 'active' 
  | 'under_review' 
  | 'paused' 
  | 'reported' 
  | 'rejected' 
  | 'deleted' 
  | 'sold'

export interface ListingStatusInfo {
  label: string
  color: {
    bg: string
    text: string
  }
  icon?: string
}

export interface ListingData {
  id: string
  title: string
  details?: string
  description?: string
  price: number
  views: number
  status: 'active' | 'pending' | 'deleted' | 'sold'
  postedDate?: string
  created_at?: string
  image?: string
  image_url?: string
  image_urls?: string[]
  primary_image_url?: string
  isPaused?: boolean
  isReportedTakedown?: boolean
  is_reported_takedown?: boolean
  rejectionReason?: string
  takedownReason?: string
  takedown_reason?: string
  pause_date?: string
  pauseDate?: string
}

export function getListingStatus(listing: ListingData): ListingStatusType {
  if (listing.status === 'active') return 'active'
  if (listing.status === 'sold') return 'sold'
  if (listing.status === 'pending' && listing.isPaused) return 'paused'
  if (listing.status === 'pending') return 'under_review'
  if (listing.status === 'deleted' && listing.isReportedTakedown) return 'reported'
  if (listing.status === 'deleted' && listing.rejectionReason) return 'rejected'
  if (listing.status === 'deleted') return 'deleted'
  return 'active'
}

export const statusConfig: Record<ListingStatusType, ListingStatusInfo> = {
  active: {
    label: 'Active',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    }
  },
  under_review: {
    label: 'Under Review',
    color: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800'
    }
  },
  paused: {
    label: 'Paused',
    color: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800'
    }
  },
  reported: {
    label: 'Reported',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    }
  },
  rejected: {
    label: 'Rejected',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    }
  },
  deleted: {
    label: 'Deleted',
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-800'
    }
  },
  sold: {
    label: 'Sold',
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-800'
    }
  }
}

export function getStatusInfo(listing: ListingData): ListingStatusInfo {
  const status = getListingStatus(listing)
  return statusConfig[status]
}

export function canPauseListing(listing: ListingData): boolean {
  return listing.status === 'active' && !listing.isPaused
}

export function canResumeListing(listing: ListingData): boolean {
  return listing.status === 'pending' && listing.isPaused === true
}

export function canEditListing(listing: ListingData): boolean {
  return listing.status === 'active' || (listing.status === 'pending' && listing.isPaused)
}

export function canDeleteListing(listing: ListingData): boolean {
  return listing.status === 'active' || listing.status === 'pending'
}

export function canMarkAsSold(listing: ListingData): boolean {
  return listing.status === 'active'
}

export function filterListingsByStatus(
  listings: ListingData[], 
  filter: 'all' | 'active' | 'sold' | 'pending' | 'paused' | 'reported'
): ListingData[] {
  if (filter === 'all') return listings
  
  return listings.filter(listing => {
    switch (filter) {
      case 'active':
        return listing.status === 'active'
      case 'sold':
        return listing.status === 'sold'
      case 'pending':
        return listing.status === 'pending' && !listing.isPaused
      case 'paused':
        return listing.status === 'pending' && listing.isPaused
      case 'reported':
        return listing.status === 'deleted' && listing.isReportedTakedown
      default:
        return true
    }
  })
}