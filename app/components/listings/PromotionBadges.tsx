import { Star, TrendingUp, AlertTriangle, Crown } from 'lucide-react'

interface PromotionBadgesProps {
  listing: {
    is_featured?: boolean
    is_top_spot?: boolean
    is_boosted?: boolean
    is_urgent?: boolean
    featured_until?: string
    top_spot_until?: string
    boosted_until?: string
    urgent_until?: string
  }
  size?: 'small' | 'medium' | 'large'
  showLabels?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export default function PromotionBadges({ 
  listing, 
  size = 'medium', 
  showLabels = false,
  orientation = 'horizontal' 
}: PromotionBadgesProps) {
  
  const sizeStyles = {
    small: {
      container: 'gap-1',
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      iconClass: 'text-xs'
    },
    medium: {
      container: 'gap-2',
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      iconClass: 'text-sm'
    },
    large: {
      container: 'gap-3',
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      iconClass: 'text-base'
    }
  }

  const styles = sizeStyles[size]
  const containerClass = orientation === 'vertical' ? 'flex flex-col' : 'flex flex-wrap'

  const badges = []

  // Urgent Badge - Highest Priority (Red)
  if (listing.is_urgent) {
    badges.push(
      <div
        key="urgent"
        className={`${styles.badge} bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-lg flex items-center gap-1.5 font-bold animate-pulse border-2 border-red-300`}
      >
        <AlertTriangle className={`${styles.icon} animate-bounce`} />
        {showLabels && <span className="tracking-wide">URGENT</span>}
      </div>
    )
  }

  // Featured Badge - High Priority (Gold)
  if (listing.is_featured) {
    badges.push(
      <div
        key="featured"
        className={`${styles.badge} bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-full shadow-lg flex items-center gap-1.5 font-bold border border-amber-300`}
      >
        <Star className={`${styles.icon} fill-white`} />
        {showLabels && <span className="tracking-wide">FEATURED</span>}
      </div>
    )
  }

  // Top Spot Badge - Medium Priority (Purple)
  if (listing.is_top_spot) {
    badges.push(
      <div
        key="top-spot"
        className={`${styles.badge} bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md flex items-center gap-1.5 font-semibold`}
      >
        <Crown className={styles.icon} />
        {showLabels && <span>TOP SPOT</span>}
      </div>
    )
  }

  // Boosted Badge - Lower Priority (Blue)
  if (listing.is_boosted) {
    badges.push(
      <div
        key="boosted"
        className={`${styles.badge} bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md flex items-center gap-1.5 font-semibold`}
      >
        <TrendingUp className={styles.icon} />
        {showLabels && <span>BOOSTED</span>}
      </div>
    )
  }

  if (badges.length === 0) return null

  return (
    <div className={`${containerClass} ${styles.container}`}>
      {badges}
    </div>
  )
}

// Individual badge components for flexible use
export function FeaturedBadge({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const styles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className={`${styles[size]} bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-full shadow-lg flex items-center gap-1.5 font-bold border border-amber-300`}>
      <Star className={size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} fill="white" />
      <span className="tracking-wide">FEATURED</span>
    </div>
  )
}

export function TopSpotBadge({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const styles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className={`${styles[size]} bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-md flex items-center gap-1.5 font-semibold`}>
      <Crown className={size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>TOP SPOT</span>
    </div>
  )
}

export function BoostedBadge({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const styles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className={`${styles[size]} bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md flex items-center gap-1.5 font-semibold`}>
      <TrendingUp className={size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>BOOSTED</span>
    </div>
  )
}

export function UrgentBadge({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const styles = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className={`${styles[size]} bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-lg flex items-center gap-1.5 font-bold animate-pulse border-2 border-red-300`}>
      <AlertTriangle className={`${size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-5 h-5' : 'w-4 h-4'} animate-bounce`} />
      <span className="tracking-wide">URGENT</span>
    </div>
  )
}

// Export individual components as properties of the default export for convenience
PromotionBadges.Featured = FeaturedBadge
PromotionBadges.TopSpot = TopSpotBadge
PromotionBadges.Boost = BoostedBadge
PromotionBadges.Urgent = UrgentBadge