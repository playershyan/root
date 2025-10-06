import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const make = searchParams.get('make')
    const model = searchParams.get('model')
    const location = searchParams.get('location')
    const minBudget = searchParams.get('minBudget')
    const maxBudget = searchParams.get('maxBudget')
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    const urgentOnly = searchParams.get('urgentOnly') === 'true'
    const sortBy = searchParams.get('sortBy') || 'recent'

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('wanted_requests')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .eq('is_active', true)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`)
    }

    if (make && make !== 'All Makes') {
      query = query.eq('make', make)
    }

    if (model && model !== 'All Models') {
      query = query.eq('model', model)
    }

    if (location && location !== 'All of Sri Lanka') {
      query = query.ilike('location', `%${location}%`)
    }

    if (minBudget) {
      query = query.gte('max_budget', parseFloat(minBudget))
    }

    if (maxBudget) {
      query = query.lte('min_budget', parseFloat(maxBudget))
    }

    if (yearFrom) {
      query = query.gte('max_year', parseInt(yearFrom))
    }

    if (yearTo) {
      query = query.lte('min_year', parseInt(yearTo))
    }

    if (urgentOnly) {
      query = query.eq('urgency', 'high')
    }

    // Apply sorting
    switch (sortBy) {
      case 'budget-high':
        query = query.order('max_budget', { ascending: false, nullsLast: true })
        break
      case 'budget-low':
        query = query.order('min_budget', { ascending: true, nullsLast: true })
        break
      case 'urgency':
        query = query.order('urgency', { ascending: true })
        break
      default: // recent
        query = query.order('created_at', { ascending: false })
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: requests, count, error } = await query

    if (error) {
      console.error('Error fetching wanted requests:', error)
      return NextResponse.json({ error: 'Failed to fetch wanted requests' }, { status: 500 })
    }

    const enhancedRequests = requests || []

    return NextResponse.json({
      requests: enhancedRequests,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      hasMore: (count || 0) > offset + limit
    })

  } catch (error) {
    console.error('Get wanted requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}