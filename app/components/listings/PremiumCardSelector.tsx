'use client'

import UrgentListingCard from './UrgentListingCard'
import GoldFeaturedCard from './GoldFeaturedCard'
import TopSpotCard from './TopSpotCard'
import BoostedCard from './BoostedCard'
import ListingCard from './ListingCard'

// Wanted Request Components
import UrgentWantedCard from '../wantedRequests/UrgentWantedCard'
import GoldFeaturedWantedCard from '../wantedRequests/GoldFeaturedWantedCard'

interface PremiumCardSelectorProps {
  listing?: any
  wantedRequest?: any
  size?: 'regular' | 'large'
}

/**
 * Automatically selects the appropriate premium card component based on promotion types
 * Priority order: Urgent > Featured > Top Spot > Boosted > Regular
 */
export default function PremiumCardSelector({ listing, wantedRequest, size = 'regular' }: PremiumCardSelectorProps) {

  // Handle Wanted Requests
  if (wantedRequest) {
    if (wantedRequest.is_urgent) {
      return <UrgentWantedCard request={wantedRequest} />
    }

    if (wantedRequest.is_featured) {
      return <GoldFeaturedWantedCard request={wantedRequest} size={size} />
    }

    // Default wanted request card would go here
    return null
  }

  // Handle Listings
  if (listing) {
    // Priority 1: Urgent (highest priority)
    if (listing.is_urgent) {
      return <UrgentListingCard listing={listing} />
    }

    // Priority 2: Featured (gold treatment)
    if (listing.is_featured) {
      return <GoldFeaturedCard listing={listing} size={size} />
    }

    // Priority 3: Top Spot (purple treatment)
    if (listing.is_top_spot) {
      return <TopSpotCard listing={listing} />
    }

    // Priority 4: Boosted (blue treatment)
    if (listing.is_boosted) {
      return <BoostedCard listing={listing} />
    }

    // Default: Regular listing card
    return <ListingCard listing={listing} />
  }

  return null
}

// Helper function to determine card type
export function getCardType(item: any, type: 'listing' | 'wanted') {
  if (type === 'wanted') {
    if (item.is_urgent) return 'urgent-wanted'
    if (item.is_featured) return 'featured-wanted'
    return 'regular-wanted'
  }

  if (type === 'listing') {
    if (item.is_urgent) return 'urgent-listing'
    if (item.is_featured) return 'featured-listing'
    if (item.is_top_spot) return 'top-spot-listing'
    if (item.is_boosted) return 'boosted-listing'
    return 'regular-listing'
  }

  return 'regular'
}

// Export individual components for direct use
export {
  UrgentListingCard,
  GoldFeaturedCard,
  TopSpotCard,
  BoostedCard,
  UrgentWantedCard,
  GoldFeaturedWantedCard
}