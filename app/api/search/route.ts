import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { APIError } from '@/lib/errorHandling'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q') || ''
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const minYear = searchParams.get('minYear')
    const maxYear = searchParams.get('maxYear')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const fuelType = searchParams.get('fuelType')
    const transmission = searchParams.get('transmission')
    const bodyType = searchParams.get('bodyType')
    const location = searchParams.get('location')
    const isFinance = searchParams.get('isFinance')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

    let queryBuilder = supabase
      .from('listings')
      .select(`
        id, title, price, location, make, model, year, mileage,
        fuel_type, transmission, body_type, negotiable, pricing_type,
        image_url, primary_image_url, image_urls,
        is_featured, is_top_spot, is_boosted, is_urgent, boost_score,
        created_at, views, seller_id
      `, { count: 'exact' })
      .eq('is_sold', false)

    // Text search
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,make.ilike.%${query}%,model.ilike.%${query}%`)
    }

    // Filters
    if (make) queryBuilder = queryBuilder.eq('make', make)
    if (model) queryBuilder = queryBuilder.eq('model', model)
    if (minYear) queryBuilder = queryBuilder.gte('year', parseInt(minYear))
    if (maxYear) queryBuilder = queryBuilder.lte('year', parseInt(maxYear))
    if (minPrice) queryBuilder = queryBuilder.gte('price', parseInt(minPrice))
    if (maxPrice) queryBuilder = queryBuilder.lte('price', parseInt(maxPrice))
    if (fuelType) queryBuilder = queryBuilder.eq('fuel_type', fuelType)
    if (transmission) queryBuilder = queryBuilder.eq('transmission', transmission)
    if (bodyType) queryBuilder = queryBuilder.eq('body_type', bodyType)
    if (location) queryBuilder = queryBuilder.ilike('location', `%${location}%`)
    if (isFinance === 'true') queryBuilder = queryBuilder.eq('pricing_type', 'finance')
    if (isFinance === 'false') queryBuilder = queryBuilder.eq('pricing_type', 'cash')

    // Sorting
    const sortMap: Record<string, { column: string; ascending: boolean }> = {
      'price_asc': { column: 'price', ascending: true },
      'price_desc': { column: 'price', ascending: false },
      'year_asc': { column: 'year', ascending: true },
      'year_desc': { column: 'year', ascending: false },
      'created_at': { column: 'created_at', ascending: false }
    }

    const sort = sortMap[sortBy] || sortMap['created_at']
    queryBuilder = queryBuilder.order(sort.column, { ascending: sort.ascending })

    // Promote featured listings
    queryBuilder = queryBuilder.order('is_featured', { ascending: false })
    queryBuilder = queryBuilder.order('is_top_spot', { ascending: false })
    queryBuilder = queryBuilder.order('boost_score', { ascending: false })

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    queryBuilder = queryBuilder.range(from, to)

    const { data: listings, error, count } = await queryBuilder

    if (error) {
      throw new APIError('Failed to search listings', 500, error)
    }

    // Optimize response: only include promotion fields if active
    const optimizedListings = listings?.map(listing => {
      const base: any = {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        location: listing.location,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        mileage: listing.mileage,
        fuel_type: listing.fuel_type,
        transmission: listing.transmission,
        body_type: listing.body_type,
        negotiable: listing.negotiable,
        pricing_type: listing.pricing_type,
        image_url: listing.image_url,
        primary_image_url: listing.primary_image_url,
        image_urls: listing.image_urls,
        created_at: listing.created_at,
        views: listing.views,
        seller_id: listing.seller_id
      }

      // Only add promotion fields if they're active
      if (listing.is_featured) base.is_featured = true
      if (listing.is_top_spot) base.is_top_spot = true
      if (listing.is_boosted) base.is_boosted = true
      if (listing.is_urgent) base.is_urgent = true
      if (listing.boost_score && listing.boost_score > 0) base.boost_score = listing.boost_score

      return base
    })

    const totalPages = Math.ceil((count || 0) / limit)

    return Response.json({
      data: optimizedListings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      },
      success: true
    })
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return Response.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}