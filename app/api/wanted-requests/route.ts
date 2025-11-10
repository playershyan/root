import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { validateWantedRequest, sanitizeWantedRequest, formatPhoneNumber, generateWantedRequestTitle } from '@/lib/validation/wantedRequest'
import { incr } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes per user)
    const rateLimitResponse = await withRateLimit(request, rateLimiters.auth)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      min_budget,
      max_budget,
      make,
      customMake,
      model,
      customModel,
      min_year,
      max_year,
      location,
      phone,
      fuel_type,
      transmission,
      max_mileage
    } = body

    // Sanitize input
    const sanitized = sanitizeWantedRequest({
      title,
      description,
      make,
      customMake,
      model,
      customModel,
      min_budget,
      max_budget,
      min_year,
      max_year,
      location,
      phone,
      fuel_type,
      transmission,
      max_mileage
    })

    // Validate input
    const validation = validateWantedRequest(sanitized)
    if (!validation.isValid) {
      incr('wanted.request.validation.failed')
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }

    // Format phone number (Sri Lankan format only)
    const formattedPhone = formatPhoneNumber(sanitized.phone || '', '94')

    // Generate title if not provided
    const finalTitle = title || generateWantedRequestTitle(sanitized)

    // Check for duplicate requests (same user, same make/model, within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const actualMake = sanitized.make === 'Other' ? sanitized.customMake : sanitized.make
    const actualModel = sanitized.model === 'Other' ? sanitized.customModel : sanitized.model

    const { data: duplicates } = await supabase
      .from('wanted_requests')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('make', actualMake)
      .eq('model', actualModel)
      .gte('created_at', oneDayAgo)
      .neq('status', 'deleted')
      .limit(1)

    if (duplicates && duplicates.length > 0) {
      incr('wanted.request.duplicate.blocked')
      return NextResponse.json({
        error: 'You have already posted a similar wanted request in the last 24 hours. Please wait before posting another.',
        duplicateId: duplicates[0].id
      }, { status: 409 })
    }

    // Prepare database payload
    const payload = {
      user_id: user.id,
      title: finalTitle,
      description: sanitized.description || null,
      min_budget: parseFloat(String(sanitized.min_budget)) || null,
      max_budget: parseFloat(String(sanitized.max_budget)) || null,
      make: sanitized.make === 'Other' ? (sanitized.customMake || 'Other') : (sanitized.make || null),
      model: sanitized.model === 'Other' ? (sanitized.customModel || 'Other') : (sanitized.model || null),
      min_year: parseInt(String(sanitized.min_year)) || null,
      max_year: parseInt(String(sanitized.max_year)) || null,
      location: sanitized.location || '',
      phone: formattedPhone,
      fuel_type: sanitized.fuel_type || null,
      transmission: sanitized.transmission || null,
      max_mileage: sanitized.max_mileage ? parseInt(String(sanitized.max_mileage)) : null,
      status: 'pending',
      is_active: false
    }

    // Insert into database
    const { data: newRequest, error: insertError } = await supabase
      .from('wanted_requests')
      .insert([payload])
      .select()
      .single()

    if (insertError) {
      logger.error('Error creating wanted request', insertError as Error)
      incr('wanted.request.create.error')
      return NextResponse.json({
        error: 'Failed to create wanted request',
        details: insertError.message
      }, { status: 500 })
    }

    incr('wanted.request.created')

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: 'Wanted request created successfully and is pending approval'
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Wanted request creation error', error as Error)
    incr('wanted.request.create.error')
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
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
      query = query.eq('is_high_priority', true)
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
        query = query.order('is_high_priority', { ascending: false })
        break
      default: // recent
        query = query.order('created_at', { ascending: false })
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: requests, count, error } = await query

    if (error) {
      logger.error('Error fetching wanted requests', error as Error)
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
    logger.error('Get wanted requests error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}