import 'server-only'

import { unstable_cache } from 'next/cache'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'
import type {
  ListingsFeedFilters,
  ListingsFeedResult,
  ListingSummary,
  PromotedSlots
} from '@/lib/types/listings-feed'

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60

async function fetchListingsFeed(filters: ListingsFeedFilters): Promise<ListingsFeedResult> {
  const supabase = createServiceSupabaseClient()
  const page = Math.max(filters.page ?? 1, 1)
  const pageSize = Math.min(Math.max(filters.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('listings')
    .select(`
      id,
      title,
      price,
      make,
      model,
      year,
      mileage,
      fuel_type,
      transmission,
      vehicle_type,
      location,
      city,
      district,
      image_url,
      image_urls,
      primary_image_url,
      pricing_type,
      negotiable,
      asking_price,
      monthly_payment,
      phone,
      whatsapp,
      email,
      created_at,
      is_featured,
      is_top_spot,
      is_boosted,
      is_urgent,
      boost_score,
      user_id
    `, { count: 'exact' })
    .eq('status', 'active')
    .eq('is_sold', false)

  if (filters.vehicleType) {
    query = query.eq('vehicle_type', filters.vehicleType)
  }
  if (filters.make) {
    query = query.eq('make', filters.make)
  }
  if (filters.model) {
    query = query.eq('model', filters.model)
  }
  if (filters.minYear) {
    query = query.gte('year', filters.minYear)
  }
  if (filters.maxYear) {
    query = query.lte('year', filters.maxYear)
  }
  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.fuelTypes && filters.fuelTypes.length > 0) {
    query = query.in('fuel_type', filters.fuelTypes)
  }
  if (filters.transmissionTypes && filters.transmissionTypes.length > 0) {
    query = query.in('transmission', filters.transmissionTypes)
  }
  if (filters.urgentOnly) {
    query = query.eq('is_urgent', true)
  }
  if (filters.search) {
    const term = `%${filters.search.trim()}%`
    query = query.or(
      [
        `title.ilike.${term}`,
        `make.ilike.${term}`,
        `model.ilike.${term}`,
        `location.ilike.${term}`,
        `city.ilike.${term}`,
        `district.ilike.${term}`
      ].join(',')
    )
  }

  switch (filters.sort) {
    case 'price_low':
      query = query.order('price', { ascending: true })
      break
    case 'price_high':
      query = query.order('price', { ascending: false })
      break
    case 'year_new':
      query = query.order('year', { ascending: false })
      break
    case 'year_old':
      query = query.order('year', { ascending: true })
      break
    case 'mileage_low':
      query = query.order('mileage', { ascending: true, nullsFirst: true })
      break
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    logger.error('Failed to fetch listings feed', error, { filters })
    throw error
  }

  const total = count ?? 0
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)

  return {
    items: (data ?? []).map((item) => ({
      ...item,
      image_urls: item.image_urls ?? [],
      user_id: item.user_id ?? null
    })),
    total,
    page,
    pageSize,
    totalPages
  }
}

async function fetchPromotedSlots(filters: Pick<ListingsFeedFilters, 'vehicleType'>): Promise<PromotedSlots> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase.rpc('get_promoted_slots_bundle', {
    p_vehicle_type: filters.vehicleType ?? null
  })

  if (error) {
    logger.error('Failed to fetch promoted slots', error, { vehicleType: filters.vehicleType })
    throw error
  }

  const parseList = (collection: any): ListingSummary[] => {
    if (!collection || !Array.isArray(collection)) return []
    return collection.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      make: item.make ?? null,
      model: item.model ?? null,
      year: item.year ?? null,
      mileage: item.mileage ?? null,
      fuel_type: item.fuel_type ?? null,
      transmission: item.transmission ?? null,
      vehicle_type: item.vehicle_type ?? null,
      location: item.location ?? null,
      city: item.city ?? null,
      district: item.district ?? null,
      image_url: item.image_url ?? null,
      image_urls: item.image_urls ?? [],
      primary_image_url: item.primary_image_url ?? null,
      pricing_type: item.pricing_type ?? null,
      negotiable: item.negotiable ?? null,
      asking_price: item.asking_price ?? null,
      monthly_payment: item.monthly_payment ?? null,
      phone: item.phone ?? null,
      whatsapp: item.whatsapp ?? null,
      email: item.email ?? null,
      created_at: item.created_at ?? null,
      is_featured: item.is_featured ?? null,
      is_top_spot: item.is_top_spot ?? null,
      is_boosted: item.is_boosted ?? null,
      is_urgent: item.is_urgent ?? null,
      boost_score: item.boost_score ?? null,
      user_id: item.user_id ?? null
    }))
  }

  return {
    featured: parseList(data?.featured),
    top_spot: parseList(data?.top_spot),
    boosted: parseList(data?.boosted),
    urgent: parseList(data?.urgent)
  }
}

const getListingsFeedCached = unstable_cache(
  async (serialized: string) => {
    const parsed = JSON.parse(serialized) as ListingsFeedFilters
    return fetchListingsFeed(parsed)
  },
  ['listings-feed'],
  { revalidate: 120 }
)

const getPromotedSlotsCached = unstable_cache(
  async (vehicleType: string | null) => {
    return fetchPromotedSlots({ vehicleType })
  },
  ['promoted-slots'],
  { revalidate: 120 }
)

export async function getListingsFeed(filters: ListingsFeedFilters): Promise<ListingsFeedResult> {
  // Serialize filters to ensure stable cache key
  const serialized = JSON.stringify(filters ?? {})
  return getListingsFeedCached(serialized)
}

export async function getPromotedSlots(vehicleType?: string | null): Promise<PromotedSlots> {
  return getPromotedSlotsCached(vehicleType ?? null)
}

