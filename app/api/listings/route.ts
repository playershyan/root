import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { validateListing, sanitizeListing, generateListingTitle } from '@/lib/validation/listing'
import { formatPhoneForStorage } from '@/lib/utils/phoneFormatter'

/**
 * POST /api/listings
 * Create a new vehicle listing
 *
 * Clean rebuild - no overcomplicated logic, just solid basics
 */
export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════════')
  console.log('📝 CREATE LISTING - START')
  console.log('═══════════════════════════════════════════════════════')

  try {
    // 1. AUTH CHECK
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ AUTH FAILED:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ AUTH OK - User:', user.id)

    // 2. PARSE BODY
    let body: any
    try {
      body = await request.json()
      console.log('📦 BODY RECEIVED:', Object.keys(body))
    } catch (e) {
      console.log('❌ INVALID JSON')
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // 3. SANITIZE INPUT
    console.log('🧹 SANITIZING INPUT...')
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

    console.log('✅ SANITIZED')

    // 4. VALIDATE
    console.log('🔍 VALIDATING...')
    const validation = validateListing(sanitized)

    if (!validation.isValid) {
      console.log('❌ VALIDATION FAILED:', validation.errors)
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }

    console.log('✅ VALIDATION PASSED')

    // 5. PREPARE DATA FOR DATABASE
    console.log('🔧 PREPARING DATABASE PAYLOAD...')

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

    console.log('✅ PAYLOAD READY')
    console.log('📊 PAYLOAD SUMMARY:', {
      title: dbPayload.title,
      make: dbPayload.make,
      model: dbPayload.model,
      year: dbPayload.year,
      price: dbPayload.price,
      images: dbPayload.image_urls?.length || 0
    })

    // 6. CHECK FOR DUPLICATES (same user, same make/model/year in last 24 hours)
    console.log('🔍 CHECKING FOR DUPLICATES...')
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
      console.log('⚠️ DUPLICATE FOUND:', duplicates[0].id)
      return NextResponse.json({
        error: 'You already posted a similar listing in the last 24 hours',
        duplicateId: duplicates[0].id
      }, { status: 409 })
    }

    console.log('✅ NO DUPLICATES')

    // 7. INSERT INTO DATABASE
    console.log('💾 INSERTING TO DATABASE...')
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([dbPayload])
      .select()
      .single()

    if (insertError) {
      console.log('❌ DATABASE ERROR:', insertError)
      return NextResponse.json({
        error: 'Failed to create listing',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('✅ LISTING CREATED:', newListing.id)
    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ CREATE LISTING - SUCCESS')
    console.log('═══════════════════════════════════════════════════════')

    // 8. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'Listing created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.log('═══════════════════════════════════════════════════════')
    console.log('❌ CREATE LISTING - ERROR')
    console.log('Error:', error.message)
    console.log('Stack:', error.stack)
    console.log('═══════════════════════════════════════════════════════')

    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
