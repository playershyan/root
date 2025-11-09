import { Listing } from '@/lib/types'
import { logger } from '@/lib/utils/logger'

interface RotationConfig {
  rotationIntervalMinutes: number
  maxDisplayCount: number
  fairExposureWeight: number
  boostScoreWeight: number
  ageBalancingEnabled: boolean
}

export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  rotationIntervalMinutes: 5,
  maxDisplayCount: 6,
  fairExposureWeight: 0.4,
  boostScoreWeight: 0.3,
  ageBalancingEnabled: true
}

export class FeaturedListingsRotationManager {
  private config: RotationConfig
  private rotationHistory: Map<string, Date[]> = new Map()

  constructor(config: RotationConfig = DEFAULT_ROTATION_CONFIG) {
    this.config = config
    this.loadRotationHistory()
  }

  calculateRotationScore(listing: Listing, currentTime: Date = new Date()): number {
    const listingAge = Math.floor((currentTime.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const baseScore = listing.boost_score || 0
    
    // Time-based rotation factor for consistent but changing order
    const hourOfDay = currentTime.getHours()
    const dayOfYear = Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const timeRotationFactor = (hourOfDay + (dayOfYear % 7)) % 24
    
    // Fair exposure bonus - newer listings get periodic boosts
    let fairExposureBonus = 0
    if (this.config.ageBalancingEnabled && listingAge < 7) {
      fairExposureBonus = (7 - listingAge) * 10
    }
    
    // Exposure history penalty - listings shown recently get lower priority
    const exposureHistory = this.getRecentExposureCount(listing.id, currentTime)
    const exposurePenalty = exposureHistory * 5
    
    // Create deterministic but rotating hash
    const listingHash = parseInt(listing.id.slice(-6), 16) % 1000
    const rotationBonus = (listingHash + timeRotationFactor * 17) % 100
    
    // Performance bonus based on views
    const viewsBonus = Math.min((listing.views || 0) / 100, 10)
    
    return (
      baseScore * this.config.boostScoreWeight +
      fairExposureBonus * this.config.fairExposureWeight +
      rotationBonus +
      viewsBonus -
      exposurePenalty
    )
  }

  applyFairRotation(listings: Listing[], displayCount: number = this.config.maxDisplayCount): Listing[] {
    const now = new Date()
    
    const scoredListings = listings.map(listing => ({
      ...listing,
      rotationScore: this.calculateRotationScore(listing, now)
    }))

    // Sort by rotation score
    const rotatedListings = scoredListings.sort((a, b) => b.rotationScore - a.rotationScore)

    // Record exposure for selected listings
    const selectedListings = rotatedListings.slice(0, displayCount)
    selectedListings.forEach(listing => {
      this.recordExposure(listing.id, now)
    })

    this.saveRotationHistory()
    return selectedListings
  }

  private getRecentExposureCount(listingId: string, currentTime: Date): number {
    const history = this.rotationHistory.get(listingId) || []
    const recentCutoff = new Date(currentTime.getTime() - (2 * 60 * 60 * 1000)) // Last 2 hours
    
    return history.filter(exposureTime => exposureTime > recentCutoff).length
  }

  private recordExposure(listingId: string, exposureTime: Date): void {
    const history = this.rotationHistory.get(listingId) || []
    history.push(exposureTime)
    
    // Keep only recent exposure history (last 24 hours)
    const recentCutoff = new Date(exposureTime.getTime() - (24 * 60 * 60 * 1000))
    const recentHistory = history.filter(time => time > recentCutoff)
    
    this.rotationHistory.set(listingId, recentHistory)
  }

  private loadRotationHistory(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('featuredRotationHistory')
      if (stored) {
        const data = JSON.parse(stored)
        this.rotationHistory = new Map(
          Object.entries(data).map(([key, dates]) => [
            key, 
            (dates as string[]).map(d => new Date(d))
          ])
        )
      }
    } catch (error) {
      logger.warn('Failed to load rotation history', { error })
    }
  }

  private saveRotationHistory(): void {
    if (typeof window === 'undefined') return
    
    try {
      const data = Object.fromEntries(
        Array.from(this.rotationHistory.entries()).map(([key, dates]) => [
          key,
          dates.map(d => d.toISOString())
        ])
      )
      localStorage.setItem('featuredRotationHistory', JSON.stringify(data))
    } catch (error) {
      logger.warn('Failed to save rotation history', { error })
    }
  }

  getExposureStats(listingId: string): { totalExposures: number; lastExposure: Date | null; exposuresLast24h: number } {
    const history = this.rotationHistory.get(listingId) || []
    const now = new Date()
    const last24h = new Date(now.getTime() - (24 * 60 * 60 * 1000))
    
    return {
      totalExposures: history.length,
      lastExposure: history.length > 0 ? history[history.length - 1] : null,
      exposuresLast24h: history.filter(time => time > last24h).length
    }
  }

  clearHistory(): void {
    this.rotationHistory.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('featuredRotationHistory')
    }
  }
}

// Create a singleton instance
export const featuredRotationManager = new FeaturedListingsRotationManager()

// Helper functions for component usage
export const getFairRotatedListings = (listings: Listing[], displayCount: number = 6): Listing[] => {
  return featuredRotationManager.applyFairRotation(listings, displayCount)
}

export const getListingExposureStats = (listingId: string) => {
  return featuredRotationManager.getExposureStats(listingId)
}