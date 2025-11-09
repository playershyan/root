import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateListing, sanitizeListing, generateListingTitle } from '@/lib/validation/listing'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/listings
 * Create a new vehicle listing
 *
 * Clean rebuild - no overcomplicated logic, just solid basics
 */
export async function POST(request: NextRequest) {
  logger.debug('CREATE LISTING - START')

  try {
    // 1. AUTH CHECK
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      logger.error('Auth failed in create listing', authError, { reason: authError?.message || 'No user' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('Auth OK - User authenticated', { userId: user.id })

    // 2. PARSE BODY
    let body: any
    try {
      body = await request.json()
      logger.debug('Request body received', { fields: Object.keys(body) })
    } catch (e) {
      logger.error('Invalid JSON in request body', e as Error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
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
    const validation = validateListing(sanitized)

    if (!validation.isValid) {
      logger.warn('Listing validation failed', { errors: validation.errors })
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
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

      // Status
      status: 'pending',

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

    if (duplicates && duplicates.length > 0) {
      logger.warn('Duplicate listing detected', { duplicateId: duplicates[0].id, userId: user.id })
      return NextResponse.json({
        error: 'You already posted a similar listing in the last 24 hours',
        duplicateId: duplicates[0].id
      }, { status: 409 })
    }

    logger.debug('No duplicates found')

    // 7. INSERT INTO DATABASE
    logger.debug('Inserting listing to database')
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([dbPayload])
      .select()
      .single()

    if (insertError) {
      logger.error('Database insert failed for listing', insertError as Error, { userId: user.id })
      return NextResponse.json({
        error: 'Failed to create listing',
        details: insertError.message
      }, { status: 500 })
    }

    logger.info('Listing created successfully', { listingId: newListing.id, userId: user.id })

    // 8. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'Listing created successfully'
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Create listing failed with unexpected error', error, {
      message: error.message,
      stack: error.stack
    })

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
