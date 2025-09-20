import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as supabaseClient } from '@/lib/supabase'

export interface RotationConfig {
  featuredSlots: number // Number of featured slots (default: 2)
  topSpotSlots: number // Number of top spot slots (default: 2)
  rotationInterval: number // Hours between rotations (default: 1)
  impressionWeight: number // Weight for impression count in algorithm (default: 0.1)
  randomFactor: number // Random factor for fairness (default: 10)
}

export interface RotatedAd {
  listing_id: string
  promotion_id: string
  rotation_score: number
  impressions: number
  listing?: any
}

const DEFAULT_CONFIG: RotationConfig = {
  featuredSlots: 2,
  topSpotSlots: 2,
  rotationInterval: 1, // Rotate every hour
  impressionWeight: 0.1,
  randomFactor: 10
}

export class RotationService {
  private static config: RotationConfig = DEFAULT_CONFIG

  private static getClient(client?: SupabaseClient) {
    return client ?? supabaseClient
  }

  /**
   * Set rotation configuration
   */
  static setConfig(config: Partial<RotationConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get rotated featured ads with fair distribution
   */
  static async getRotatedFeaturedAds(
    vehicleType?: string,
    limit?: number,
    client?: SupabaseClient
  ): Promise<{ data: any[]; error: any }> {
    const supabase = this.getClient(client)
    const { data, error } = await supabaseClient.rpc('get_rotated_featured_ads', {
      p_vehicle_type: vehicleType ?? null,
      p_limit: limit ?? undefined
    })

    return { data: data || [], error }
  }

  /**
   * Get rotated top spot ads with fair distribution
   */
  static async getRotatedTopSpotAds(
    vehicleType?: string,
    limit?: number
  ): Promise<{ data: any[]; error: any }> {
    try {
      let query = supabase
        .from('promotions')
        .select(`
          *,
          listings!inner(*)
        `)
        .eq('promotion_type', 'top_spot')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (vehicleType) {
        query = query.eq('listings.vehicle_type', vehicleType)
      }

      const { data: promotions, error } = await query

      if (error) throw error
      if (!promotions || promotions.length === 0) return { data: [], error: null }

      const slots = limit || this.config.topSpotSlots

      // If we have fewer ads than slots, return all
      if (promotions.length <= slots) {
        return { data: promotions.map(p => p.listings), error: null }
      }

      // Calculate rotation scores
      const scoredPromotions = promotions.map(promo => {
        const hoursSinceShown = promo.last_shown_at
          ? (Date.now() - new Date(promo.last_shown_at).getTime()) / (1000 * 60 * 60)
          : 1000

        const score = 
          hoursSinceShown
          - (promo.impressions * this.config.impressionWeight)
          + (Math.random() * this.config.randomFactor)

        return { ...promo, rotationScore: score }
      })

      // Sort and select
      scoredPromotions.sort((a, b) => b.rotationScore - a.rotationScore)
      const selectedAds = scoredPromotions.slice(0, slots)

      // Update metrics
      const promotionIds = selectedAds.map(ad => ad.id)
      await this.updateImpressions(promotionIds)

      return { 
        data: selectedAds.map(p => ({
          ...p.listings,
          promotion_id: p.id,
          rotation_score: p.rotation_score,
          impressions: p.impressions
        })), 
        error: null 
      }
    } catch (error) {
      console.error('Error getting rotated top spot ads:', error)
      return { data: [], error }
    }
  }

  /**
   * Get boosted ads with fair daily rotation
   */
  static async getRotatedBoostedAds(
    vehicleType?: string,
    limit = 10,
    client?: SupabaseClient
  ): Promise<{ data: any[]; error: any }> {
    const supabase = this.getClient(client)
    const { data, error } = await supabaseClient.rpc('get_rotated_boost_ads', {
      p_vehicle_type: vehicleType ?? null,
      p_limit: limit
    })

    return { data: data || [], error }
  }

  // Deprecated: rotation and impression tracking handled inside Postgres RPCs

  /**
   * Reset daily rotation scores (call at midnight)
   */
  static async resetDailyRotationScores(client?: SupabaseClient): Promise<void> {
    const supabase = this.getClient(client)
    await supabaseClient.rpc('reset_daily_rotation_scores')
  }

  /**
   * Get rotation statistics for monitoring
   */
  static async getRotationStats(promotionType?: string): Promise<{ data: any; error: any }> {
    try {
      let query = supabase
        .from('promotions')
        .select(`
          id,
          listing_id,
          promotion_type,
          impressions,
          rotation_score,
          last_shown_at,
          created_at,
          expires_at,
          listings!inner(title, vehicle_type)
        `)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (promotionType) {
        query = query.eq('promotion_type', promotionType)
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate statistics
      const stats = data?.map(promo => {
        const daysSinceCreated = 
          (Date.now() - new Date(promo.created_at).getTime()) / (1000 * 60 * 60 * 24)
        
        const hoursSinceShown = promo.last_shown_at
          ? (Date.now() - new Date(promo.last_shown_at).getTime()) / (1000 * 60 * 60)
          : null

        return {
          ...promo,
          avg_daily_impressions: promo.impressions / Math.max(daysSinceCreated, 1),
          hours_since_shown: hoursSinceShown,
          show_status: this.getShowStatus(hoursSinceShown)
        }
      })

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error getting rotation stats:', error)
      return { data: null, error }
    }
  }

  /**
   * Get show status based on last shown time
   */
  private static getShowStatus(hoursSinceShown: number | null): string {
    if (hoursSinceShown === null) return 'Never shown'
    if (hoursSinceShown < 1) return 'Shown recently'
    if (hoursSinceShown < 6) return 'Shown today'
    if (hoursSinceShown < 24) return 'Shown yesterday'
    return 'Not shown recently'
  }

  /**
   * Shuffle array with seed for consistent rotation
   */
  private static shuffleWithSeed<T>(array: T[], seed: string | number): T[] {
    // Convert string seed to number
    const numericSeed = typeof seed === 'string'
      ? seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      : seed
    const shuffled = [...array]
    let currentIndex = shuffled.length
    let randomValue = numericSeed

    // Simple seeded random
    const random = () => {
      randomValue = (randomValue * 9301 + 49297) % 233280
      return randomValue / 233280
    }

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(random() * currentIndex)
      currentIndex--
      ;[shuffled[currentIndex], shuffled[randomIndex]] = 
        [shuffled[randomIndex], shuffled[currentIndex]]
    }

    return shuffled
  }

  /**
   * Get fair share report for advertisers
   */
  static async getFairShareReport(
    listingId: string
  ): Promise<{ data: any; error: any }> {
    try {
      const { data: promotion, error: promotionError } = await supabaseClient
        .from('promotions')
        .select('*')
        .eq('listing_id', listingId)
        .eq('is_active', true)
        .single()

      if (promotionError) throw promotionError

      // Get total active promotions of same type
      const { count: totalCount } = await supabaseClient
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('promotion_type', promotion.promotion_type)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      // Calculate fair share
      const slotsAvailable = promotion.promotion_type === 'featured' 
        ? this.config.featuredSlots 
        : this.config.topSpotSlots

      const fairSharePercentage = totalCount 
        ? Math.min(100, (slotsAvailable / totalCount) * 100)
        : 100

      const expectedDailyImpressions = promotion.impressions / 
        Math.max(
          (Date.now() - new Date(promotion.created_at).getTime()) / (1000 * 60 * 60 * 24),
          1
        )

      return {
        data: {
          promotion_type: promotion.promotion_type,
          total_competing_ads: totalCount,
          slots_available: slotsAvailable,
          fair_share_percentage: fairSharePercentage.toFixed(1),
          total_impressions: promotion.impressions,
          avg_daily_impressions: expectedDailyImpressions.toFixed(0),
          last_shown: promotion.last_shown_at,
          rotation_score: promotion.rotation_score,
          status: this.getShowStatus(
            promotion.last_shown_at 
              ? (Date.now() - new Date(promotion.last_shown_at).getTime()) / (1000 * 60 * 60)
              : null
          )
        },
        error: null
      }
    } catch (error) {
      console.error('Error getting fair share report:', error)
      return { data: null, error }
    }
  }

  /**
   * Update impression counts for promotions
   */
  static async updateImpressions(promotionIds: string[]): Promise<void> {
    try {
      if (promotionIds.length === 0) return

      await supabaseClient
        .from('promotions')
        .update({
          impressions: supabaseClient.rpc('increment_impressions'),
          last_shown_at: new Date().toISOString()
        })
        .in('id', promotionIds)
    } catch (error) {
      console.error('Error updating impressions:', error)
    }
  }
}