import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'

// Error codes for client-side handling
export enum ListingErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RLS_ERROR = 'RLS_ERROR',
  SERVER_ERROR = 'SERVER_ERROR'
}

interface CreateListingRequest {
  listing: {
    user_id?: string // Will be set server-side
    title: string
    description: string
    details?: string
    price: number
    negotiable?: boolean
    make: string
    customMake?: string
    model: string
    customModel?: string
    year: number
    mileage?: number
    fuel_type?: string
    transmission?: string
    body_type?: string
    vehicle_type?: string
    color?: string
    engine_capacity?: number
    location: string
    city: string
    district: string
    image_urls: string[]
    image_url?: string
    status?: string
    phone: string
    whatsapp?: string
    email?: string
    pricing_type?: string
    finance_type?: string
    finance_provider?: string
    original_amount?: number
    outstanding_balance?: number
    monthly_payment?: number
    remaining_term?: string
    early_settlement?: string
    asking_price?: number
    interior_color?: string
    registration_year?: number
    vehicle_condition_details?: string
    previous_owners?: number
    including_finance_companies?: boolean
    service_records_available?: boolean
    trim?: string
    grade?: string
    condition?: string
    is_featured?: boolean
    is_top_spot?: boolean
    is_boosted?: boolean
    is_urgent?: boolean
  }
  imageUrls?: string[]
}

interface CreateListingResponse {
  success: boolean
  listing?: any
  message?: string
  error?: string
  code?: ListingErrorCode
  details?: string
}

// Validation helpers
function validateRequiredFields(listing: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const required = ['title', 'price', 'make', 'model', 'year', 'city', 'district', 'phone']

  for (const field of required) {
    if (!listing[field] || (typeof listing[field] === 'string' && listing[field].trim() === '')) {
      errors.push(`${field} is required`)
    }
  }

  // Validate image_urls array
  if (!listing.image_urls || !Array.isArray(listing.image_urls) || listing.image_urls.length === 0) {
    errors.push('At least one image is required')
  }

  return { valid: errors.length === 0, errors }
}

function sanitizeListingData(listing: any, userId: string): any {
  // Set server-side values
  const sanitized = {
    ...listing,
    user_id: userId, // Always use authenticated user ID
    status: 'pending', // New listings always start as pending
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    posted_date: new Date().toISOString(),
  }

  // Handle custom make/model
  if (sanitized.make === 'Other' && sanitized.customMake) {
    sanitized.make = sanitized.customMake
  }
  if (sanitized.model === 'Other' && sanitized.customModel) {
    sanitized.model = sanitized.customModel
  }

  // Remove client-provided fields that shouldn't be set directly
  delete sanitized.customMake
  delete sanitized.customModel

  // Ensure image_url is set to first image
  if (sanitized.image_urls && sanitized.image_urls.length > 0) {
    sanitized.image_url = sanitized.image_urls[0]
  }

  // Set promotion flags to false by default
  sanitized.is_featured = false
  sanitized.is_top_spot = false
  sanitized.is_boosted = false
  sanitized.is_urgent = false

  return sanitized
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[${requestId}] Create listing API called`)

    const supabase = createRouteHandlerClient({ cookies })

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log(`[${requestId}] Authentication failed:`, authError?.message)
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please log in to publish a listing.',
        code: ListingErrorCode.AUTH_REQUIRED,
        details: authError?.message
      } as CreateListingResponse, { status: 401 })
    }

    console.log(`[${requestId}] User authenticated:`, user.id)

    // Parse request body
    let body: CreateListingRequest
    try {
      body = await request.json()
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse request body:`, parseError)
      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        code: ListingErrorCode.VALIDATION_ERROR,
        details: 'Request body must be valid JSON'
      } as CreateListingResponse, { status: 400 })
    }

    const { listing } = body

    if (!listing) {
      return NextResponse.json({
        success: false,
        error: 'Listing data is required',
        code: ListingErrorCode.VALIDATION_ERROR
      } as CreateListingResponse, { status: 400 })
    }

    // Validate required fields
    const validation = validateRequiredFields(listing)
    if (!validation.valid) {
      console.log(`[${requestId}] Validation failed:`, validation.errors)
      return NextResponse.json({
        success: false,
        error: 'Validation failed: ' + validation.errors.join(', '),
        code: ListingErrorCode.VALIDATION_ERROR,
        details: validation.errors.join('\n')
      } as CreateListingResponse, { status: 400 })
    }

    console.log(`[${requestId}] Validation passed`)

    // Sanitize and prepare listing data
    const sanitizedListing = sanitizeListingData(listing, user.id)

    console.log(`[${requestId}] Inserting listing into database...`)
    console.log(`[${requestId}] Listing data:`, {
      user_id: sanitizedListing.user_id,
      title: sanitizedListing.title,
      price: sanitizedListing.price,
      make: sanitizedListing.make,
      model: sanitizedListing.model,
      images: sanitizedListing.image_urls?.length || 0
    })

    // Insert listing into database
    const { data: createdListing, error: insertError } = await supabase
      .from('listings')
      .insert([sanitizedListing])
      .select()
      .single()

    if (insertError) {
      console.error(`[${requestId}] Database insert error:`, {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })

      // Check for RLS policy errors
      if (insertError.code === '42501' || insertError.message?.toLowerCase().includes('policy')) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied. Please try logging out and back in.',
          code: ListingErrorCode.RLS_ERROR,
          details: insertError.message
        } as CreateListingResponse, { status: 403 })
      }

      // Check for constraint violations
      if (insertError.code?.startsWith('23')) {
        return NextResponse.json({
          success: false,
          error: 'Database constraint violation. Please check your data and try again.',
          code: ListingErrorCode.DATABASE_ERROR,
          details: insertError.message
        } as CreateListingResponse, { status: 400 })
      }

      // Generic database error
      return NextResponse.json({
        success: false,
        error: 'Failed to create listing. Please try again.',
        code: ListingErrorCode.DATABASE_ERROR,
        details: insertError.message
      } as CreateListingResponse, { status: 500 })
    }

    console.log(`[${requestId}] Listing created successfully:`, createdListing.id)

    // Log the successful creation
    try {
      await supabase
        .from('listing_actions')
        .insert({
          listing_id: createdListing.id,
          user_id: user.id,
          action: 'created',
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn(`[${requestId}] Failed to log listing creation:`, logError)
    }

    return NextResponse.json({
      success: true,
      listing: createdListing,
      message: 'Listing created successfully! It will be reviewed by our team shortly.'
    } as CreateListingResponse, { status: 201 })

  } catch (error: any) {
    console.error(`[${requestId}] Unexpected error in create listing endpoint:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    })

    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: ListingErrorCode.SERVER_ERROR,
      details: error.message
    } as CreateListingResponse, { status: 500 })
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}
