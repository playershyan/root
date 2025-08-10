import { supabase } from '@/lib/supabase'

export type PromotionType = 'featured' | 'top_spot' | 'boost' | 'urgent'

export interface Promotion {
  id?: string
  listing_id: string
  promotion_type: PromotionType
  expires_at: string
  is_active: boolean
  amount: number
  last_boosted_at?: string
  payment_id?: string
}

export interface PromotionPricing {
  featured: { price: number; days: number }
  top_spot: { price: number; days: number }
  boost: { price: number; days: number }
  urgent: { price: number; days: number }
}

// Pricing configuration
export const PROMOTION_PRICING: PromotionPricing = {
  featured: { price: 3500, days: 7 },
  top_spot: { price: 1200, days: 7 },
  boost: { price: 800, days: 7 },
  urgent: { price: 600, days: 5 },
}

export class PromotionService {
  /**
   * Create a new promotion for a listing
   */
  static async createPromotion(
    listingId: string,
    promotionType: PromotionType,
    paymentId?: string
  ): Promise<{ data: any; error: any }> {
    const pricing = PROMOTION_PRICING[promotionType]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + pricing.days)

    const { data, error } = await supabase.from('promotions').insert([
      {
        listing_id: listingId,
        promotion_type: promotionType,
        expires_at: expiresAt.toISOString(),
        amount: pricing.price,
        payment_id: paymentId,
        is_active: true,
      },
    ])

    if (!error) {
      // Trigger update of listing promotion flags
      await this.updateListingPromotions(listingId)
    }

    return { data, error }
  }

  /**
   * Create multiple promotions for a listing (bundle)
   */
  static async createPromotionBundle(
    listingId: string,
    promotionTypes: PromotionType[],
    paymentId?: string
  ): Promise<{ data: any; error: any }> {
    const promotions = promotionTypes.map((type) => {
      const pricing = PROMOTION_PRICING[type]
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + pricing.days)

      return {
        listing_id: listingId,
        promotion_type: type,
        expires_at: expiresAt.toISOString(),
        amount: pricing.price,
        payment_id: paymentId,
        is_active: true,
      }
    })

    const { data, error } = await supabase.from('promotions').insert(promotions)

    if (!error) {
      await this.updateListingPromotions(listingId)
    }

    return { data, error }
  }

  /**
   * Update listing promotion flags based on active promotions
   */
  static async updateListingPromotions(listingId: string): Promise<void> {
    // Get all active promotions for the listing
    const { data: promotions } = await supabase
      .from('promotions')
      .select('*')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (!promotions) return

    const updateData: any = {
      is_featured: false,
      is_top_spot: false,
      is_boosted: false,
      is_urgent: false,
      featured_until: null,
      top_spot_until: null,
      boosted_until: null,
      urgent_until: null,
    }

    promotions.forEach((promo) => {
      switch (promo.promotion_type) {
        case 'featured':
          updateData.is_featured = true
          updateData.featured_until = promo.expires_at
          break
        case 'top_spot':
          updateData.is_top_spot = true
          updateData.top_spot_until = promo.expires_at
          break
        case 'boost':
          updateData.is_boosted = true
          updateData.boosted_until = promo.expires_at
          updateData.boost_score = Date.now()
          break
        case 'urgent':
          updateData.is_urgent = true
          updateData.urgent_until = promo.expires_at
          break
      }
    })

    await supabase.from('listings').update(updateData).eq('id', listingId)
  }

  /**
   * Expire promotions that have passed their expiry date
   */
  static async expirePromotions(): Promise<void> {
    // Mark expired promotions as inactive
    await supabase
      .from('promotions')
      .update({ is_active: false })
      .eq('is_active', true)
      .lte('expires_at', new Date().toISOString())

    // Update listing flags for expired promotions
    const { data: expiredListings } = await supabase
      .from('listings')
      .select('id')
      .or(
        `featured_until.lte.${new Date().toISOString()},top_spot_until.lte.${new Date().toISOString()},boosted_until.lte.${new Date().toISOString()},urgent_until.lte.${new Date().toISOString()}`
      )

    if (expiredListings) {
      for (const listing of expiredListings) {
        await this.updateListingPromotions(listing.id)
      }
    }
  }

  /**
   * Apply daily boost to boosted listings
   */
  static async applyDailyBoost(): Promise<void> {
    const now = Date.now()

    // Update boost score for all active boosted listings
    await supabase
      .from('listings')
      .update({ boost_score: now })
      .eq('is_boosted', true)
      .gt('boosted_until', new Date().toISOString())

    // Update last_boosted_at in promotions
    await supabase
      .from('promotions')
      .update({ last_boosted_at: new Date().toISOString() })
      .eq('promotion_type', 'boost')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
  }

  /**
   * Get promoted listings with proper sorting
   */
  static async getPromotedListings(
    filters: any = {},
    limit = 20,
    offset = 0
  ): Promise<{ data: any; error: any }> {
    let query = supabase.from('listings').select('*')

    // Apply filters
    if (filters.vehicle_type) {
      query = query.eq('vehicle_type', filters.vehicle_type)
    }
    if (filters.make) {
      query = query.eq('make', filters.make)
    }
    if (filters.model) {
      query = query.eq('model', filters.model)
    }
    if (filters.min_price) {
      query = query.gte('price', filters.min_price)
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price)
    }

    // Sort by promotion priority:
    // 1. Featured ads first
    // 2. Top spot ads
    // 3. Boosted ads (sorted by boost_score)
    // 4. Regular ads (sorted by created_at)
    const { data, error } = await query
      .order('is_featured', { ascending: false })
      .order('is_top_spot', { ascending: false })
      .order('is_boosted', { ascending: false })
      .order('boost_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return { data, error }
  }

  /**
   * Get featured listings for homepage
   */
  static async getFeaturedListings(limit = 6): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('is_featured', true)
      .gt('featured_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Get top spot listings for category page
   */
  static async getTopSpotListings(
    vehicleType?: string,
    limit = 2
  ): Promise<{ data: any; error: any }> {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('is_top_spot', true)
      .gt('top_spot_until', new Date().toISOString())

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  /**
   * Check if a listing has active promotions
   */
  static async getActivePromotions(listingId: string): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    return { data, error }
  }

  /**
   * Calculate bundle discount
   */
  static calculateBundlePrice(promotionTypes: PromotionType[]): number {
    const totalPrice = promotionTypes.reduce(
      (sum, type) => sum + PROMOTION_PRICING[type].price,
      0
    )

    // Apply discounts based on bundle size
    let discount = 0
    if (promotionTypes.length === 2) {
      discount = 200 // Rs. 200 off for 2 features
    } else if (promotionTypes.length === 3) {
      discount = 400 // Rs. 400 off for 3 features
    } else if (promotionTypes.length === 4) {
      discount = 600 // Rs. 600 off for all features
    }

    return totalPrice - discount
  }

  /**
   * Get promotion statistics for a listing
   */
  static async getPromotionStats(listingId: string): Promise<{ data: any; error: any }> {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('views, clicks, messages_count')
      .eq('id', listingId)
      .single()

    if (listingError) return { data: null, error: listingError }

    const { data: promotions, error: promotionsError } = await supabase
      .from('promotions')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })

    if (promotionsError) return { data: null, error: promotionsError }

    return {
      data: {
        listing_stats: listing,
        promotions: promotions,
        active_promotions: promotions.filter(
          (p) => p.is_active && new Date(p.expires_at) > new Date()
        ),
      },
      error: null,
    }
  }
}