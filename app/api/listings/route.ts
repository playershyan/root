import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { validateListing, sanitizeListing, generateListingTitle } from '@/lib/validation/listing'
import { formatPhoneForStorage, normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Special privilege UID - bypasses validation and OTP requirements
const PRIVILEGED_USER_ID = '9b288153-3836-45ff-8f0b-8a196e423477'

/**
 * POST /api/listings
 * Create a new vehicle listing
 *
 * Clean rebuild - no overcomplicated logic, just solid basics
 */
export async function POST(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('api.listings.requests', 1, { method: 'POST' })
  logger.api.request('POST', '/api/listings')
  logger.debug('CREATE LISTING - START')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/listings', durationMs)
    performanceMonitor.incrementCounter(`api.listings.${outcome}`, 1, { method: 'POST' })

    if (outcome === 'success') {
      logger.api.success('POST', '/api/listings', durationMs, logContext)
    } else {
      const errorReason = context.reason || 'Request failed'
      logger.api.error('POST', '/api/listings', new Error(errorReason), logContext)
    }

    return response
  }

  try {
    // 1. AUTH CHECK
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const authStart = performance.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      context: 'create-listing'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)

    if (authError || !user) {
      logger.error('Auth failed in create listing', authError, { reason: authError?.message || 'No user' })
      return finish('failure',
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        { reason: authError?.message || 'Unauthorized' }
      )
    }

    logger.debug('Auth OK - User authenticated', { userId: user.id })

    // 2. PARSE BODY
    let body: any
    try {
      body = await request.json()
      logger.debug('Request body received', { fields: Object.keys(body) })
    } catch (e) {
      logger.error('Invalid JSON in request body', e as Error)
      return finish('failure',
        NextResponse.json({ error: 'Invalid request body' }, { status: 400 }),
        { reason: 'invalid-json' }
      )
    }

    // 3. SANITIZE INPUT
    logger.debug('Sanitizing listing input')
    const sanitized = sanitizeListing({
      title: body.title,
      description: body.description,
      vehicleType: body.vehicleType,
      make: body.make,
      customMake: body.customMake,
      model: body.model,
      customModel: body.customModel,
      year: body.year,
      mileage: body.mileage,
      condition: body.condition,
      fuelType: body.fuelType,
      transmission: body.transmission,
      color: body.color,
      engineCapacity: body.engineCapacity,
      trim: body.trim,
      grade: body.grade,
      price: body.price,
      pricingType: body.pricingType || 'cash',
      negotiable: body.negotiable,
      financeType: body.financeType,
      outstandingBalance: body.outstandingBalance,
      monthlyPayment: body.monthlyPayment,
      remainingTerm: body.remainingTerm,
      askingPrice: body.askingPrice,
      district: body.district,
      city: body.city,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      imageUrls: body.imageUrls,
      interiorColor: body.interiorColor,
      registrationYear: body.registrationYear,
      vehicleConditionDetails: body.vehicleConditionDetails,
      previousOwners: body.previousOwners,
      serviceRecordsAvailable: body.serviceRecordsAvailable
    })

    logger.debug('Input sanitized')

    // 4. VALIDATE
    logger.debug('Validating listing data')
    const validation = validateListing(sanitized, user.id)

    if (!validation.isValid) {
      logger.warn('Listing validation failed', { errors: validation.errors })
      return finish('failure',
        NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 }),
        { reason: 'validation-failed', validationErrors: validation.errors }
      )
    }

    logger.debug('Validation passed')

    // 5. PREPARE DATA FOR DATABASE
    logger.debug('Preparing database payload')

    // Determine actual make/model (handle "Other" option)
    const actualMake = sanitized.make === 'Other' ? sanitized.customMake : sanitized.make
    const actualModel = sanitized.model === 'Other' ? sanitized.customModel : sanitized.model

    // Parse numbers safely
    const year = sanitized.year ? parseInt(String(sanitized.year), 10) : null
    const mileage = sanitized.mileage ? parseInt(String(sanitized.mileage), 10) : null
    const engineCapacity = sanitized.engineCapacity ? parseInt(String(sanitized.engineCapacity), 10) : null
    const registrationYear = sanitized.registrationYear ? parseInt(String(sanitized.registrationYear), 10) : null
    const previousOwners = sanitized.previousOwners ? parseInt(String(sanitized.previousOwners), 10) : null

    // Determine final price (for finance listings, use asking price)
    let finalPrice: number
    if (sanitized.pricingType === 'finance' && sanitized.askingPrice) {
      finalPrice = parseFloat(String(sanitized.askingPrice))
    } else {
      finalPrice = parseFloat(String(sanitized.price))
    }

    // Finance fields (only if pricing type is finance)
    const outstandingBalance = sanitized.pricingType === 'finance' && sanitized.outstandingBalance
      ? parseFloat(String(sanitized.outstandingBalance))
      : null
    const monthlyPayment = sanitized.pricingType === 'finance' && sanitized.monthlyPayment
      ? parseFloat(String(sanitized.monthlyPayment))
      : null
    const askingPrice = sanitized.pricingType === 'finance' && sanitized.askingPrice
      ? parseFloat(String(sanitized.askingPrice))
      : null

    // Get user's profile to check if phone changed
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('phone, whatsapp')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile', profileError as Error)
    }

    // Check if phone number is new or changed (requires OTP verification)
    // Normalize both for proper comparison
    const normalizedInputPhone = sanitized.phone ? normalizeSriLankaPhone(sanitized.phone) : null
    const phoneIsNew = normalizedInputPhone && !userProfile?.phone
    // Compare normalized values to avoid false positives from format differences
    const phoneChanged = normalizedInputPhone && userProfile?.phone && normalizedInputPhone !== userProfile.phone
    const phoneRequiresOtp = phoneIsNew || phoneChanged

    // If phone is new or changed, require OTP verification
    if (phoneRequiresOtp && !body.phoneOtpCode) {
      return finish('failure',
        NextResponse.json({
          error: 'OTP verification required for phone number change',
          requiresOTP: true
        }, { status: 400 }),
        { reason: 'otp-required' }
      )
    }

    // If phone is new or changed, verify OTP
    if (phoneRequiresOtp && body.phoneOtpCode) {
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
        logger.error('OTP verification failed for listing', otpError as Error, {
          phone: sanitized.phone,
          userId: user.id
        })
        return finish('failure',
          NextResponse.json({
            error: 'Invalid or expired verification code. Please request a new code.',
            requiresOTP: true
          }, { status: 400 }),
          { reason: 'invalid-otp' }
        )
      }

      // Check attempt limit
      if (otpRecord.attempts >= 3) {
        return finish('failure',
          NextResponse.json({
            error: 'Too many verification attempts. Please request a new code.',
            requiresOTP: true
          }, { status: 400 }),
          { reason: 'too-many-attempts' }
        )
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

      logger.info('Phone OTP verified for listing', { userId: user.id, phone: sanitized.phone })
    }

    // Format phone numbers (add +94 country code)
    const formattedPhone = formatPhoneForStorage(sanitized.phone || '', '94')
    const formattedWhatsApp = sanitized.whatsapp
      ? formatPhoneForStorage(sanitized.whatsapp, '94')
      : formattedPhone // Default to phone if whatsapp not provided

    // Generate title if not provided
    const finalTitle = sanitized.title || generateListingTitle(sanitized)

    // Location string
    const location = `${sanitized.city}, ${sanitized.district}`

    // Build database payload
    const dbPayload: any = {
      // User
      user_id: user.id,

      // Basic info
      title: finalTitle,
      description: sanitized.description || null,
      details: sanitized.description || null,
      price: finalPrice,
      negotiable: sanitized.negotiable !== undefined ? sanitized.negotiable : true,

      // Vehicle details
      make: actualMake,
      model: actualModel,
      year,
      mileage,
      fuel_type: sanitized.fuelType || null,
      transmission: sanitized.transmission || null,
      body_type: sanitized.vehicleType || null,
      vehicle_type: sanitized.vehicleType || null,
      color: sanitized.color || null,
      engine_capacity: engineCapacity,
      grade: sanitized.trim || sanitized.grade || null,
      condition: sanitized.condition || null,

      // Location
      location,
      city: sanitized.city,
      district: sanitized.district,

      // Contact
      phone: formattedPhone,
      whatsapp: formattedWhatsApp,
      email: sanitized.email || null,

      // Images
      image_urls: sanitized.imageUrls || [],
      image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,
      primary_image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,

      // Status (privileged user listings auto-approved)
      status: user.id === PRIVILEGED_USER_ID ? 'active' : 'pending',

      // Finance
      pricing_type: sanitized.pricingType || 'cash',
      finance_type: sanitized.pricingType === 'finance' ? sanitized.financeType : null,
      outstanding_balance: outstandingBalance,
      monthly_payment: monthlyPayment,
      remaining_term: sanitized.pricingType === 'finance' ? sanitized.remainingTerm : null,
      asking_price: askingPrice,

      // Additional info
      interior_color: sanitized.interiorColor || null,
      registration_year: registrationYear,
      vehicle_condition_details: sanitized.vehicleConditionDetails || null,
      previous_owners: previousOwners,
      service_records_available: sanitized.serviceRecordsAvailable || false,

      // Promotion flags (all false by default)
      is_featured: false,
      is_top_spot: false,
      is_boosted: false,
      is_urgent: false
    }

    logger.debug('Database payload ready', {
      title: dbPayload.title,
      make: dbPayload.make,
      model: dbPayload.model,
      year: dbPayload.year,
      price: dbPayload.price,
      images: dbPayload.image_urls?.length || 0
    })

    // 6. CHECK FOR DUPLICATES (same user, same make/model/year in last 24 hours)
    logger.debug('Checking for duplicate listings')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const duplicateCheckStart = performance.now()
    const { data: duplicates } = await supabase
      .from('listings')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .eq('make', actualMake)
      .eq('model', actualModel)
      .eq('year', year)
      .gte('created_at', oneDayAgo)
      .neq('status', 'deleted')
      .limit(1)
    const duplicateCheckDuration = performance.now() - duplicateCheckStart
    logger.db.query('listings.duplicate_check', {
      durationMs: Math.round(duplicateCheckDuration),
      userId: user.id
    })
    performanceMonitor.trackDatabaseQuery('listings.duplicate_check', duplicateCheckDuration)

    if (duplicates && duplicates.length > 0) {
      logger.warn('Duplicate listing detected', { duplicateId: duplicates[0].id, userId: user.id })
      return finish('failure',
        NextResponse.json({
        error: 'You already posted a similar listing in the last 24 hours',
        duplicateId: duplicates[0].id
      }, { status: 409 }),
        { reason: 'duplicate', duplicateId: duplicates[0].id, userId: user.id }
      )
    }

    logger.debug('No duplicates found')

    // 7. INSERT INTO DATABASE
    logger.debug('Inserting listing to database')
    const insertStart = performance.now()
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([dbPayload])
      .select()
      .single()
    const insertDuration = performance.now() - insertStart
    logger.db.query('listings.insert', {
      durationMs: Math.round(insertDuration),
      userId: user.id
    })
    performanceMonitor.trackDatabaseQuery('listings.insert', insertDuration)

    if (insertError) {
      logger.error('Database insert failed for listing', insertError as Error, { userId: user.id })
      performanceMonitor.incrementCounter('api.listings.failures', 1, { reason: 'insert_failure' })
      return finish('failure',
        NextResponse.json({
        error: 'Failed to create listing',
        details: insertError.message
      }, { status: 500 }),
        { reason: 'insert_failure', userId: user.id }
      )
    }

    logger.info('Listing created successfully', { listingId: newListing.id, userId: user.id })
    performanceMonitor.incrementCounter('api.listings.creations', 1, { status: 'success' })

    // 8. RETURN SUCCESS
    return finish('success', NextResponse.json({
      success: true,
      listing: newListing,
      message: 'Listing created successfully'
    }, { status: 201 }), { listingId: newListing.id, userId: user.id })

  } catch (error: any) {
    logger.error('Create listing failed with unexpected error', error, {
      message: error.message,
      stack: error.stack
    })

    performanceMonitor.incrementCounter('api.listings.failures', 1, { reason: 'exception' })
    return finish('failure',
      NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 }),
      { reason: error.message }
    )
  }
}

