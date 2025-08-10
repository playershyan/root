import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PromotionService } from '@/lib/services/promotionService'

interface UsePromotedListingsOptions {
  vehicleType?: string
  make?: string
  model?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  limit?: number
  offset?: number
}

interface PromotedListingsResult {
  featuredListings: any[]
  topSpotListings: any[]
  boostedListings: any[]
  regularListings: any[]
  loading: boolean
  error: any
  refetch: () => void
}

export function usePromotedListings(options: UsePromotedListingsOptions = {}): PromotedListingsResult {
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [topSpotListings, setTopSpotListings] = useState<any[]>([])
  const [boostedListings, setBoostedListings] = useState<any[]>([])
  const [regularListings, setRegularListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchListings = async () => {
    setLoading(true)
    setError(null)

    try {
      // Build the base query
      let baseQuery = supabase
        .from('listings')
        .select('*')
        .eq('is_sold', false)

      // Apply filters
      if (options.vehicleType) {
        baseQuery = baseQuery.eq('vehicle_type', options.vehicleType)
      }
      if (options.make) {
        baseQuery = baseQuery.eq('make', options.make)
      }
      if (options.model) {
        baseQuery = baseQuery.eq('model', options.model)
      }
      if (options.minPrice) {
        baseQuery = baseQuery.gte('price', options.minPrice)
      }
      if (options.maxPrice) {
        baseQuery = baseQuery.lte('price', options.maxPrice)
      }
      if (options.location) {
        baseQuery = baseQuery.ilike('location', `%${options.location}%`)
      }

      // Fetch featured listings (top 2 for category pages)
      const featuredQuery = baseQuery
        .eq('is_featured', true)
        .gt('featured_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(2)

      const { data: featured, error: featuredError } = await featuredQuery
      if (featuredError) throw featuredError
      setFeaturedListings(featured || [])

      // Fetch top spot listings (up to 2)
      const topSpotQuery = baseQuery
        .eq('is_top_spot', true)
        .gt('top_spot_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(2)

      const { data: topSpot, error: topSpotError } = await topSpotQuery
      if (topSpotError) throw topSpotError
      setTopSpotListings(topSpot || [])

      // Fetch boosted listings
      const boostedQuery = baseQuery
        .eq('is_boosted', true)
        .gt('boosted_until', new Date().toISOString())
        .order('boost_score', { ascending: false })
        .limit(options.limit || 10)

      const { data: boosted, error: boostedError } = await boostedQuery
      if (boostedError) throw boostedError
      setBoostedListings(boosted || [])

      // Fetch regular listings (excluding promoted ones)
      const regularQuery = baseQuery
        .or('is_featured.eq.false,featured_until.lte.' + new Date().toISOString())
        .or('is_top_spot.eq.false,top_spot_until.lte.' + new Date().toISOString())
        .or('is_boosted.eq.false,boosted_until.lte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 20) - 1)

      const { data: regular, error: regularError } = await regularQuery
      if (regularError) throw regularError
      setRegularListings(regular || [])

    } catch (err) {
      console.error('Error fetching promoted listings:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [
    options.vehicleType,
    options.make,
    options.model,
    options.minPrice,
    options.maxPrice,
    options.location,
    options.limit,
    options.offset
  ])

  return {
    featuredListings,
    topSpotListings,
    boostedListings,
    regularListings,
    loading,
    error,
    refetch: fetchListings
  }
}

// Hook for homepage featured listings
export function useHomepageFeatured(limit = 6) {
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true)
      const { data, error } = await PromotionService.getFeaturedListings(limit)
      
      if (error) {
        setError(error)
      } else {
        setListings(data || [])
      }
      
      setLoading(false)
    }

    fetchFeatured()
  }, [limit])

  return { listings, loading, error }
}