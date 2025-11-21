import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { validateWantedRequest, sanitizeWantedRequest, formatPhoneNumber, generateWantedRequestTitle } from '@/lib/validation/wantedRequest'
import { normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { incr } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'

// TEMPORARY CONFIGURATION: Auto-approve wanted requests (bypass admin moderation)
// Set to false to require admin approval before wanted requests go live
const AUTO_APPROVE_WANTED_REQUESTS = true

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
      whatsapp,
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
      whatsapp,
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

    // Get user's profile to check if phone changed
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, whatsapp')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile', profileError as Error)
    }

    // Check if phone number changed
    const phoneChanged = sanitized.phone && userProfile?.phone && sanitized.phone !== userProfile.phone

    // If phone changed, require OTP verification
    if (phoneChanged && !body.phoneOtpCode) {
      return NextResponse.json({
        error: 'OTP verification required for phone number change',
        requiresOTP: true
      }, { status: 400 })
    }

    // If phone changed, verify OTP
    if (phoneChanged && body.phoneOtpCode) {
      // Normalize phone to match storage format in phone_verifications
      const normalizedPhone = normalizeSriLankaPhone(sanitized.phone)

      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', normalizedPhone) // Use normalized phone
        .eq('otp_code', body.phoneOtpCode)
        .eq('verified', false)
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .single()

      if (otpError || !otpRecord) {
        logger.error('OTP verification failed for wanted request', otpError as Error, {
          phone: sanitized.phone,
          userId: user.id
        })
        return NextResponse.json({
          error: 'Invalid or expired verification code. Please request a new code.',
          requiresOTP: true
        }, { status: 400 })
      }

      // Check attempt limit
      if (otpRecord.attempts >= 3) {
        return NextResponse.json({
          error: 'Too many verification attempts. Please request a new code.',
          requiresOTP: true
        }, { status: 400 })
      }

      // Increment attempt counter and mark as verified
      await supabase
        .from('phone_verifications')
        .update({
          attempts: (otpRecord.attempts || 0) + 1,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id)

      logger.info('Phone OTP verified for wanted request', { userId: user.id, phone: sanitized.phone })

      // Auto-populate profile contact fields if empty (opt-in via saveToProfile flag)
      const saveToProfile = body.saveToProfile !== false // Default to true

      logger.info('[AUTO-POPULATE] Starting profile auto-population check', {
        userId: user.id,
        saveToProfile,
        hasUserProfile: !!userProfile,
        currentPhone: userProfile?.phone || 'EMPTY',
        currentWhatsapp: userProfile?.whatsapp || 'EMPTY',
        newPhone: normalizedPhone,
        newWhatsapp: sanitized.whatsapp || 'NOT_PROVIDED'
      })

      if (saveToProfile && userProfile) {
        const profileUpdates: any = {}
        let shouldUpdateProfile = false

        // Update phone if empty in profile (use normalized format to match profile storage)
        const phoneIsEmpty = !userProfile.phone || userProfile.phone.trim() === ''
        logger.info('[AUTO-POPULATE] Phone check', {
          currentPhone: userProfile.phone,
          phoneIsEmpty,
          normalizedPhone
        })

        if (phoneIsEmpty) {
          profileUpdates.phone = normalizedPhone
          shouldUpdateProfile = true
          logger.info('[AUTO-POPULATE] Will update phone field', { normalizedPhone })
        }

        // Update whatsapp if empty in profile
        // Only update if explicitly provided AND different from phone
        if (sanitized.whatsapp && sanitized.whatsapp !== sanitized.phone) {
          // Normalize whatsapp number
          const normalizedWhatsApp = normalizeSriLankaPhone(sanitized.whatsapp)
          const whatsappIsEmpty = !userProfile.whatsapp || userProfile.whatsapp.trim() === ''

          logger.info('[AUTO-POPULATE] WhatsApp check', {
            currentWhatsapp: userProfile.whatsapp,
            whatsappIsEmpty,
            normalizedWhatsApp,
            isDifferentFromPhone: sanitized.whatsapp !== sanitized.phone
          })

          // Check if whatsapp is empty in profile
          if (whatsappIsEmpty) {
            profileUpdates.whatsapp = normalizedWhatsApp
            shouldUpdateProfile = true
            logger.info('[AUTO-POPULATE] Will update whatsapp field', { normalizedWhatsApp })
          }
        }

        // Perform update if needed
        if (shouldUpdateProfile) {
          logger.info('[AUTO-POPULATE] Executing profile update', {
            userId: user.id,
            updates: profileUpdates
          })

          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id)

          if (updateError) {
            logger.error('[AUTO-POPULATE] Failed to update profile contact fields', updateError as Error, {
              userId: user.id,
              updates: profileUpdates,
              errorCode: (updateError as any).code,
              errorMessage: updateError.message,
              errorDetails: updateError
            })
          } else {
            logger.info('[AUTO-POPULATE] SUCCESS - Profile contact fields updated', {
              userId: user.id,
              fields: Object.keys(profileUpdates),
              values: profileUpdates
            })
          }
        } else {
          logger.info('[AUTO-POPULATE] No update needed - profile fields already populated', {
            userId: user.id,
            currentPhone: userProfile.phone,
            currentWhatsapp: userProfile.whatsapp
          })
        }
      } else {
        logger.info('[AUTO-POPULATE] Skipped - saveToProfile disabled or no userProfile', {
          saveToProfile,
          hasUserProfile: !!userProfile
        })
      }
    }

    // Format phone number (Sri Lankan format only)
    const formattedPhone = formatPhoneNumber(sanitized.phone || '', '94')
    // Format WhatsApp number (use phone if whatsapp not provided)
    const formattedWhatsApp = sanitized.whatsapp 
      ? formatPhoneNumber(sanitized.whatsapp, '94')
      : formattedPhone

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
      whatsapp: formattedWhatsApp || null,
      fuel_type: sanitized.fuel_type || null,
      transmission: sanitized.transmission || null,
      max_mileage: sanitized.max_mileage ? parseInt(String(sanitized.max_mileage)) : null,
      // Auto-approval status (controlled by AUTO_APPROVE_WANTED_REQUESTS flag)
      status: AUTO_APPROVE_WANTED_REQUESTS ? 'active' : 'pending',
      is_active: AUTO_APPROVE_WANTED_REQUESTS
    }

    // Insert into database
    const { data: newRequest, error: insertError } = await supabase
      .from('wanted_requests')
      .insert([payload])
      .select(`
        id, user_id, title, description, min_budget, max_budget,
        make, model, min_year, max_year, location, phone,
        status, created_at
      `)
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
      message: AUTO_APPROVE_WANTED_REQUESTS 
        ? 'Wanted request created successfully and is now live'
        : 'Wanted request created successfully and is pending approval'
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)
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
      .select(`
        id, user_id, title, description, min_budget, max_budget,
        make, model, min_year, max_year, location, phone,
        fuel_type, transmission, max_mileage,
        created_at, updated_at, views, is_urgent
      `, { count: 'exact' })
      .eq('status', 'active')
      // Note: is_active is synced by trigger, but we only filter by status to ensure all active requests appear

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
      query = query.gte('min_budget', parseFloat(minBudget))
    }

    if (maxBudget) {
      query = query.lte('max_budget', parseFloat(maxBudget))
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
        query = query.order('max_budget', { ascending: false, nullsFirst: false })
        break
      case 'budget-low':
        query = query.order('min_budget', { ascending: true, nullsFirst: false })
        break
      case 'high-priority':
        query = query
          .order('is_high_priority', { ascending: false })
          .order('created_at', { ascending: false })
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