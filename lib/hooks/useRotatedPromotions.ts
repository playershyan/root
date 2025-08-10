import { useState, useEffect } from 'react'
import { RotationService } from '@/lib/services/rotationService'
import { supabase } from '@/lib/supabase'

interface UseRotatedPromotionsOptions {
  vehicleType?: string
  refreshInterval?: number // Minutes between rotation refreshes
}

interface RotatedPromotionsResult {
  featuredListings: any[]
  topSpotListings: any[]
  boostedListings: any[]
  regularListings: any[]
  loading: boolean
  error: any
  refetch: () => void
  rotationInfo: {
    nextRotation: Date
    currentCycle: number
  }
}

export function useRotatedPromotions(
  options: UseRotatedPromotionsOptions = {}
): RotatedPromotionsResult {
  const [featuredListings, setFeaturedListings] = useState<any[]>([])
  const [topSpotListings, setTopSpotListings] = useState<any[]>([])
  const [boostedListings, setBoostedListings] = useState<any[]>([])
  const [regularListings, setRegularListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [rotationInfo, setRotationInfo] = useState({
    nextRotation: new Date(Date.now() + 60 * 60 * 1000), // Next hour
    currentCycle: Math.floor(new Date().getHours())
  })

  const fetchRotatedListings = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch rotated featured ads
      const { data: featured, error: featuredError } = 
        await RotationService.getRotatedFeaturedAds(options.vehicleType)
      
      if (featuredError) throw featuredError
      setFeaturedListings(featured || [])

      // Fetch rotated top spot ads
      const { data: topSpot, error: topSpotError } = 
        await RotationService.getRotatedTopSpotAds(options.vehicleType)
      
      if (topSpotError) throw topSpotError
      setTopSpotListings(topSpot || [])

      // Fetch rotated boosted ads
      const { data: boosted, error: boostedError } = 
        await RotationService.getRotatedBoostedAds(options.vehicleType, 10)
      
      if (boostedError) throw boostedError
      setBoostedListings(boosted || [])

      // Fetch regular listings (non-promoted)
      let regularQuery = supabase
        .from('listings')
        .select('*')
        .eq('is_sold', false)
        .or('is_featured.eq.false,featured_until.is.null,featured_until.lte.' + new Date().toISOString())
        .or('is_top_spot.eq.false,top_spot_until.is.null,top_spot_until.lte.' + new Date().toISOString())
        .or('is_boosted.eq.false,boosted_until.is.null,boosted_until.lte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (options.vehicleType) {
        regularQuery = regularQuery.eq('vehicle_type', options.vehicleType)
      }

      const { data: regular, error: regularError } = await regularQuery
      
      if (regularError) throw regularError
      setRegularListings(regular || [])

      // Update rotation info
      const nextHour = new Date()
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      setRotationInfo({
        nextRotation: nextHour,
        currentCycle: Math.floor(new Date().getHours())
      })

    } catch (err) {
      console.error('Error fetching rotated listings:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchRotatedListings()
  }, [options.vehicleType])

  // Set up rotation refresh interval
  useEffect(() => {
    const refreshMinutes = options.refreshInterval || 60 // Default: refresh every hour
    const interval = setInterval(() => {
      fetchRotatedListings()
    }, refreshMinutes * 60 * 1000)

    return () => clearInterval(interval)
  }, [options.vehicleType, options.refreshInterval])

  // Also refresh at the top of each hour for synchronized rotation
  useEffect(() => {
    const now = new Date()
    const nextHour = new Date()
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    const msUntilNextHour = nextHour.getTime() - now.getTime()

    const timeout = setTimeout(() => {
      fetchRotatedListings()
      
      // Then set up hourly interval
      const hourlyInterval = setInterval(() => {
        fetchRotatedListings()
      }, 60 * 60 * 1000)

      return () => clearInterval(hourlyInterval)
    }, msUntilNextHour)

    return () => clearTimeout(timeout)
  }, [])

  return {
    featuredListings,
    topSpotListings,
    boostedListings,
    regularListings,
    loading,
    error,
    refetch: fetchRotatedListings,
    rotationInfo
  }
}

// Hook for advertiser dashboard to see their rotation stats
export function usePromotionFairShare(listingId: string) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const { data, error } = await RotationService.getFairShareReport(listingId)
      
      if (error) {
        setError(error)
      } else {
        setStats(data)
      }
      
      setLoading(false)
    }

    if (listingId) {
      fetchStats()
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchStats, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [listingId])

  return { stats, loading, error }
}