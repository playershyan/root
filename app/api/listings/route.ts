import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { validateListing, sanitizeListing, generateListingTitle } from '@/lib/validation/listing'
import { incr } from '@/lib/security/metrics'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 listings per 15 minutes per user)
    const rateLimitResponse = await withRateLimit(request, rateLimiters.auth)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const supabase = createRouteHandlerClient({ cookies })

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
      details,
      vehicleType,
      make,
      customMake,
      model,
      customModel,
      year,
      mileage,
      condition,
      fuelType,
      transmission,
      bodyType,
      color,
      engineCapacity,
      trim,
      grade,
      price,
      pricingType,
      negotiable,
      financeType,
      outstandingBalance,
      monthlyPayment,
      remainingTerm,
      askingPrice,
      district,
      city,
      location,
      phone,
      whatsapp,
      email,
      imageUrls,
      interiorColor,
      registrationYear,
      vehicleConditionDetails,
      previousOwners,
      serviceRecordsAvailable,
      countryCode = 'LK'
    } = body

    // Sanitize input
    const sanitized = sanitizeListing({
      title,
      description,
      details,
      vehicleType,
      make,
      customMake,
      model,
      customModel,
      year,
      mileage,
      condition,
      fuelType,
      transmission,
      bodyType,
      color,
      engineCapacity,
      trim,
      grade,
      price,
      pricingType,
      negotiable,
      financeType,
      outstandingBalance,
      monthlyPayment,
      remainingTerm,
      askingPrice,
      district,
      city,
      location,
      phone,
      whatsapp,
      email,
      imageUrls,
      interiorColor,
      registrationYear,
      vehicleConditionDetails,
      previousOwners,
      serviceRecordsAvailable
    })

    // Validate input
    const validation = validateListing(sanitized)
    if (!validation.isValid) {
      incr('listing.validation.failed')
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }

    // Format phone numbers (countryCode is like 'LK', need to convert to dial code like '94')
    // Default to '94' (Sri Lanka) if countryCode is 'LK' or not a numeric code
    const dialCode = countryCode === 'LK' || !/^\d+$/.test(countryCode) ? '94' : countryCode
    const formattedPhone = formatPhoneForStorage(sanitized.phone || '', dialCode)
    const formattedWhatsApp = sanitized.whatsapp 
      ? formatPhoneForStorage(sanitized.whatsapp, dialCode)
      : null

    // Generate title if not provided
    const finalTitle = title || generateListingTitle(sanitized)

    // Prepare location string
    const locationString = sanitized.city && sanitized.district
      ? `${sanitized.city}, ${sanitized.district}`
      : sanitized.location || sanitized.city || sanitized.district || null

    // Check for duplicate listings (same user, same make/model/year, within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const actualMake = sanitized.make === 'Other' ? sanitized.customMake : sanitized.make
    const actualModel = sanitized.model === 'Other' ? sanitized.customModel : sanitized.model
    const listingYear = parseInt(String(sanitized.year)) || null

    // Check for duplicates with similar make, model, year, and price (within 10%)
    const listingPrice = parseFloat(String(sanitized.price)) || 0
    const priceThreshold = listingPrice * 0.1 // 10% tolerance

    const { data: duplicates } = await supabase
      .from('listings')
      .select('id, created_at, title')
      .eq('user_id', user.id)
      .eq('make', actualMake)
      .eq('model', actualModel)
      .eq('year', listingYear)
      .gte('created_at', oneDayAgo)
      .neq('status', 'deleted')
      .gte('price', listingPrice - priceThreshold)
      .lte('price', listingPrice + priceThreshold)
      .limit(1)

    if (duplicates && duplicates.length > 0) {
      incr('listing.duplicate.blocked')
      return NextResponse.json({
        error: 'You have already posted a similar listing in the last 24 hours. Please wait before posting another.',
        duplicateId: duplicates[0].id
      }, { status: 409 })
    }

    // Prepare database payload
    const actualPrice = pricingType === 'finance' 
      ? (parseFloat(String(askingPrice || outstandingBalance || price)) || parseFloat(String(price)))
      : parseFloat(String(price))

    const payload: any = {
      user_id: user.id,
      title: finalTitle,
      description: sanitized.description || null,
      details: sanitized.details || sanitized.description || null,
      price: actualPrice,
      negotiable: sanitized.negotiable !== undefined ? sanitized.negotiable : true,
      make: actualMake,
      model: actualModel,
      year: listingYear,
      mileage: sanitized.mileage ? parseInt(String(sanitized.mileage)) : null,
      fuel_type: sanitized.fuelType || null,
      transmission: sanitized.transmission || null,
      body_type: sanitized.bodyType || null,
      vehicle_type: sanitized.vehicleType || null,
      color: sanitized.color || null,
      engine_capacity: sanitized.engineCapacity ? parseInt(String(sanitized.engineCapacity)) : null,
      grade: sanitized.trim || sanitized.grade || null,
      condition: sanitized.condition || null,
      location: locationString,
      city: sanitized.city || null,
      district: sanitized.district || null,
      phone: formattedPhone,
      whatsapp: formattedWhatsApp,
      email: sanitized.email || null,
      image_urls: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls : [],
      image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,
      primary_image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,
      status: 'pending',
      // Finance information
      pricing_type: sanitized.pricingType || 'cash',
      finance_type: sanitized.pricingType === 'finance' ? sanitized.financeType : null,
      outstanding_balance: sanitized.pricingType === 'finance' && sanitized.outstandingBalance
        ? parseFloat(String(sanitized.outstandingBalance)) : null,
      monthly_payment: sanitized.pricingType === 'finance' && sanitized.monthlyPayment
        ? parseFloat(String(sanitized.monthlyPayment)) : null,
      remaining_term: sanitized.pricingType === 'finance' ? sanitized.remainingTerm : null,
      asking_price: sanitized.pricingType === 'finance' && sanitized.askingPrice
        ? parseFloat(String(sanitized.askingPrice)) : null,
      // Additional information
      interior_color: sanitized.interiorColor || null,
      registration_year: sanitized.registrationYear ? parseInt(String(sanitized.registrationYear)) : null,
      vehicle_condition_details: sanitized.vehicleConditionDetails || null,
      previous_owners: sanitized.previousOwners ? parseInt(String(sanitized.previousOwners)) : null,
      service_records_available: sanitized.serviceRecordsAvailable !== undefined 
        ? sanitized.serviceRecordsAvailable : false,
      // Promotion flags (all false by default)
      is_featured: false,
      is_top_spot: false,
      is_boosted: false,
      is_urgent: false
    }

    // Insert into database
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([payload])
      .select()
      .single()

    if (insertError) {
      console.error('Error creating listing:', insertError)
      incr('listing.create.error')
      return NextResponse.json({
        error: 'Failed to create listing',
        details: insertError.message
      }, { status: 500 })
    }

    incr('listing.created')
    
    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'Listing created successfully and is pending approval'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Listing creation error:', error)
    incr('listing.create.error')
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, { status: 500 })
  }
}

