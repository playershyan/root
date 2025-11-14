import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { logger } from '@/lib/utils/logger'

export interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  location: string
  phone: string
  whatsapp?: string
  email?: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number
  created_at: string
  user_name?: string
  user_avatar?: string
  is_active: boolean
  is_high_priority?: boolean
  high_priority_until?: string
  views?: number
  clicks?: number
  status?: string
  // Profile data
  profiles?: {
    id: string
    name: string
    phone?: string
    email?: string
    location?: string
    avatar_url?: string
    whatsapp?: string
    business_profiles?: {
      id: string
      business_name: string
      phone?: string
      whatsapp?: string
      address?: string
      is_active: boolean
    }
  }
}

export interface WantedFilters {
  location?: string
  make?: string
  model?: string
  minBudget?: string
  maxBudget?: string
  yearFrom?: string
  yearTo?: string
  sortBy?: string
  highPriorityOnly?: boolean
  search?: string
}

// Uncached data fetcher
const getWantedRequestsUncached = async (
  filters: WantedFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{ requests: WantedRequest[]; totalCount: number }> => {
  try {
    const supabase = createServerComponentClient({ cookies })
    
    let query = supabase
      .from('wanted_requests')
      .select(`
        *,
        profiles (
          id,
          name,
          phone,
          email,
          location,
          avatar_url,
          whatsapp,
          business_profiles (
            id,
            business_name,
            phone,
            whatsapp,
            address,
            is_active
          )
        )
      `, { count: 'exact' })
      .eq('status', 'active')
      .eq('is_active', true)

    // Apply filters
    if (filters.location && filters.location !== 'All of Sri Lanka') {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters.make && filters.make !== 'All Makes') {
      query = query.eq('make', filters.make)
    }

    if (filters.model && filters.model !== 'All Models') {
      query = query.eq('model', filters.model)
    }

    if (filters.minBudget) {
      const minBudget = parseFloat(filters.minBudget)
      query = query.gte('max_budget', minBudget)
    }

    if (filters.maxBudget) {
      const maxBudget = parseFloat(filters.maxBudget)
      query = query.lte('min_budget', maxBudget)
    }

    if (filters.yearFrom) {
      const yearFrom = parseInt(filters.yearFrom)
      query = query.gte('max_year', yearFrom)
    }

    if (filters.yearTo) {
      const yearTo = parseInt(filters.yearTo)
      query = query.lte('min_year', yearTo)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      query = query.or(
        `make.ilike.%${searchLower}%,` +
        `model.ilike.%${searchLower}%,` +
        `location.ilike.%${searchLower}%`
      )
    }

    if (filters.highPriorityOnly) {
      query = query.eq('is_high_priority', true)
    }

    // Sorting
    switch (filters.sortBy) {
      case 'budget-high':
        query = query.order('max_budget', { ascending: false, nullsFirst: false })
        break
      case 'budget-low':
        query = query.order('min_budget', { ascending: true, nullsFirst: false })
        break
      case 'urgency':
        query = query
          .order('is_high_priority', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
        break
      default: // recent
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching wanted requests', error, {
        component: 'getWantedRequests',
        filters,
        page
      })
      return { requests: [], totalCount: 0 }
    }

    // Process and enhance requests (server-side)
    const enhancedRequests = (data || []).map((req) => {
      const profile = req.profiles

      // Determine contact info based on business profile status
      let contactInfo = {
        phone: req.phone,
        whatsapp: req.whatsapp,
        email: req.email,
        location: req.location
      }

      if (profile) {
        if (profile.business_profiles && profile.business_profiles.is_active) {
          const businessProfile = profile.business_profiles
          contactInfo = {
            phone: businessProfile.phone || profile.phone || req.phone,
            whatsapp: businessProfile.whatsapp || businessProfile.phone || profile.whatsapp || profile.phone || req.whatsapp,
            email: profile.email || req.email,
            location: businessProfile.address || profile.location || req.location
          }
        } else {
          contactInfo = {
            phone: profile.phone || req.phone,
            whatsapp: profile.whatsapp || profile.phone || req.whatsapp,
            email: profile.email || req.email,
            location: profile.location || req.location
          }
        }
      }

      return {
        ...req,
        phone: contactInfo.phone || req.phone || 'Contact via platform',
        whatsapp: contactInfo.whatsapp || req.whatsapp || contactInfo.phone,
        email: contactInfo.email || req.email || '',
        location: contactInfo.location || req.location || 'Location not specified',
        user_name: profile?.name || req.user_name || `User ${req.id?.slice(0, 4) || 'Unknown'}`,
        user_avatar: (profile?.name || req.user_name || 'U').slice(0, 2).toUpperCase()
      }
    })

    return {
      requests: enhancedRequests,
      totalCount: count || 0
    }
  } catch (error) {
    logger.error('Error in getWantedRequests', error as Error, {
      component: 'getWantedRequests',
      filters,
      page
    })
    return { requests: [], totalCount: 0 }
  }
}

// Cached version (30 second cache) - for initial page loads
export const getWantedRequests = unstable_cache(
  getWantedRequestsUncached,
  ['wanted-requests'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['wanted-requests']
  }
)

// Non-cached version for dynamic filters/pagination
export const getWantedRequestsDynamic = getWantedRequestsUncached

