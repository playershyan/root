import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sanitizeListing } from '@/lib/validation/listing'
import { buildListingDescription } from '@/lib/services/descriptionBuilder'
import { formatPhoneForStorage, normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'
import { CloudinaryService } from '@/lib/cloudinary'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Special privilege UID - only this user can bulk import
const PRIVILEGED_USER_ID = '9b288153-3836-45ff-8f0b-8a196e423477'

interface ListingImportRow {
  title?: string
  make?: string
  customMake?: string
  model?: string
  customModel?: string
  year?: string | number
  mileage?: string | number
  condition?: string
  engineCapacity?: string | number
  fuelType?: string
  transmission?: string
  color?: string
  trim?: string
  district?: string
  city?: string
  price?: string | number
  negotiable?: boolean
  pricingType?: 'cash' | 'finance'
  financeType?: string
  outstandingBalance?: string | number
  monthlyPayment?: string | number
  remainingTerm?: string
  askingPrice?: string | number
  phone?: string
  whatsapp?: string
  email?: string
  imageUrls?: string // Comma-separated URLs or array
  vehicleType?: string
}

interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{ row: number; error: string; data?: any }>
  listings: Array<{ id: string; title: string }>
}

/**
 * Parse CSV string into array of objects
 */
function parseCSV(csvText: string): ListingImportRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim())
  const rows: ListingImportRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}

    headers.forEach((header, index) => {
      const value = values[index]
      if (value !== undefined && value !== '') {
        row[header] = value
      }
    })

    if (Object.keys(row).length > 0) {
      rows.push(row)
    }
  }

  return rows
}

/**
 * Upload images from URLs to Cloudinary (preserving order)
 */
async function uploadImages(imageUrls: string[]): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (const url of imageUrls) {
    try {
      const result = await CloudinaryService.uploadImage(
        url.trim(),
        'vera-lk/listings',
        { quality: 'auto:good' }
      )

      if (result.success && result.secure_url) {
        uploadedUrls.push(result.secure_url)
      } else {
        logger.warn('Image upload failed', { url, error: result.error })
        // Continue with other images even if one fails
      }
    } catch (error) {
      logger.error('Image upload error', error as Error, { url })
      // Continue with other images
    }
  }

  return uploadedUrls
}

/**
 * Process and import a single listing
 */
async function importListing(
  row: ListingImportRow,
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Parse image URLs (comma-separated string or array)
    let imageUrls: string[] = []
    if (row.imageUrls) {
      if (typeof row.imageUrls === 'string') {
        imageUrls = row.imageUrls.split(',').map(url => url.trim()).filter(url => url.length > 0)
      } else if (Array.isArray(row.imageUrls)) {
        imageUrls = row.imageUrls
      }
    }

    // Upload images to Cloudinary (preserving order)
    const uploadedImageUrls = await uploadImages(imageUrls)

    // Determine actual make/model
    const actualMake = row.make === 'Other' ? row.customMake : row.make
    const actualModel = row.model === 'Other' ? row.customModel : row.model

    // Generate AI description from available data
    const { description } = buildListingDescription({
      title: row.title,
      vehicleType: row.vehicleType,
      make: actualMake,
      model: actualModel,
      trim: row.trim,
      year: row.year?.toString(),
      mileage: row.mileage,
      condition: row.condition,
      engineCapacity: row.engineCapacity,
      fuelType: row.fuelType,
      transmission: row.transmission,
      color: row.color,
      pricingType: row.pricingType,
      price: row.price,
      negotiable: row.negotiable,
      financeType: row.financeType,
      outstandingBalance: row.outstandingBalance,
      monthlyPayment: row.monthlyPayment,
      remainingTerm: row.remainingTerm,
      askingPrice: row.askingPrice,
      city: row.city,
      district: row.district,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email
    })

    // Sanitize listing data
    const sanitized = sanitizeListing({
      title: row.title,
      description: description || row.title, // Use generated description or fallback to title
      vehicleType: row.vehicleType,
      make: actualMake,
      model: actualModel,
      year: row.year,
      mileage: row.mileage,
      condition: row.condition,
      fuelType: row.fuelType,
      transmission: row.transmission,
      color: row.color,
      engineCapacity: row.engineCapacity,
      trim: row.trim,
      district: row.district,
      city: row.city,
      price: row.price,
      pricingType: row.pricingType || 'cash',
      negotiable: row.negotiable,
      financeType: row.financeType,
      outstandingBalance: row.outstandingBalance,
      monthlyPayment: row.monthlyPayment,
      remainingTerm: row.remainingTerm,
      askingPrice: row.askingPrice,
      phone: row.phone,
      whatsapp: row.whatsapp,
      email: row.email,
      imageUrls: uploadedImageUrls
    })

    // Parse numbers
    const year = sanitized.year ? parseInt(String(sanitized.year), 10) : null
    const mileage = sanitized.mileage ? parseInt(String(sanitized.mileage), 10) : null
    const engineCapacity = sanitized.engineCapacity ? parseInt(String(sanitized.engineCapacity), 10) : null

    // Determine final price (allow null for privileged user)
    let finalPrice: number | null
    if (!sanitized.price) {
      finalPrice = null
    } else if (sanitized.pricingType === 'finance' && sanitized.askingPrice) {
      finalPrice = parseFloat(String(sanitized.askingPrice))
    } else {
      finalPrice = parseFloat(String(sanitized.price))
    }

    // Finance fields
    const outstandingBalance = sanitized.pricingType === 'finance' && sanitized.outstandingBalance
      ? parseFloat(String(sanitized.outstandingBalance))
      : null
    const monthlyPayment = sanitized.pricingType === 'finance' && sanitized.monthlyPayment
      ? parseFloat(String(sanitized.monthlyPayment))
      : null
    const askingPrice = sanitized.pricingType === 'finance' && sanitized.askingPrice
      ? parseFloat(String(sanitized.askingPrice))
      : null

    // Format phone numbers
    const formattedPhone = sanitized.phone ? formatPhoneForStorage(sanitized.phone, '94') : null
    const formattedWhatsApp = sanitized.whatsapp
      ? formatPhoneForStorage(sanitized.whatsapp, '94')
      : formattedPhone

    // Generate title if not provided
    const finalTitle = sanitized.title || `${actualMake} ${actualModel} ${year || ''}`

    // Location string
    const location = sanitized.city && sanitized.district
      ? `${sanitized.city}, ${sanitized.district}`
      : sanitized.district || sanitized.city || ''

    // Prepare database payload
    const dbPayload = {
      user_id: userId,
      title: finalTitle,
      description: description || '',
      vehicle_type: sanitized.vehicleType || null,
      body_type: sanitized.vehicleType || null,
      make: actualMake || null,
      model: actualModel || null,
      year,
      mileage,
      fuel_type: sanitized.fuelType || null,
      transmission: sanitized.transmission || null,
      color: sanitized.color || null,
      engine_capacity: engineCapacity,
      grade: sanitized.trim || null,
      condition: sanitized.condition || null,
      location,
      city: sanitized.city || null,
      district: sanitized.district || null,
      phone: formattedPhone,
      whatsapp: formattedWhatsApp,
      email: sanitized.email || null,
      price: finalPrice,
      negotiable: sanitized.negotiable || false,
      pricing_type: sanitized.pricingType || 'cash',
      finance_type: sanitized.pricingType === 'finance' ? sanitized.financeType : null,
      outstanding_balance: outstandingBalance,
      monthly_payment: monthlyPayment,
      remaining_term: sanitized.pricingType === 'finance' ? sanitized.remainingTerm : null,
      asking_price: askingPrice,
      image_urls: uploadedImageUrls,
      image_url: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
      primary_image_url: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null,
      status: 'active', // Auto-approve for privileged user
      is_featured: false,
      is_top_spot: false,
      is_boosted: false,
      is_urgent: false
    }

    // Insert into database using admin client (bypasses RLS)
    const { data: listing, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert([dbPayload])
      .select('id, title')
      .single()

    if (insertError) {
      logger.error('Failed to insert listing', insertError as Error, { title: finalTitle })
      return { success: false, error: insertError.message }
    }

    logger.info('Listing imported successfully', { id: listing.id, title: listing.title })
    return { success: true, id: listing.id }
  } catch (error) {
    logger.error('Import listing error', error as Error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * POST /api/admin/bulk-import-listings
 * Bulk import listings from CSV or JSON
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now()

  try {
    // Authenticate user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify privileged user
    if (user.id !== PRIVILEGED_USER_ID) {
      return NextResponse.json({
        error: 'Forbidden: Only privileged users can bulk import listings'
      }, { status: 403 })
    }

    // Parse request body
    const contentType = request.headers.get('content-type') || ''
    let listings: ListingImportRow[] = []

    if (contentType.includes('application/json')) {
      const body = await request.json()

      if (body.csv) {
        // CSV provided as string in JSON
        listings = parseCSV(body.csv)
      } else if (Array.isArray(body.listings)) {
        // JSON array of listings
        listings = body.listings
      } else if (Array.isArray(body)) {
        // Direct JSON array
        listings = body
      } else {
        return NextResponse.json({
          error: 'Invalid format. Provide CSV string or listings array'
        }, { status: 400 })
      }
    } else if (contentType.includes('text/csv')) {
      // Direct CSV upload
      const csvText = await request.text()
      listings = parseCSV(csvText)
    } else {
      return NextResponse.json({
        error: 'Unsupported content type. Use application/json or text/csv'
      }, { status: 400 })
    }

    if (listings.length === 0) {
      return NextResponse.json({
        error: 'No listings to import'
      }, { status: 400 })
    }

    logger.info('Starting bulk import', { count: listings.length, userId: user.id })

    // Process each listing
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      listings: []
    }

    for (let i = 0; i < listings.length; i++) {
      const row = listings[i]
      const importResult = await importListing(row, user.id)

      if (importResult.success && importResult.id) {
        result.imported++
        result.listings.push({
          id: importResult.id,
          title: row.title || `${row.make} ${row.model}`
        })
      } else {
        result.failed++
        result.errors.push({
          row: i + 1,
          error: importResult.error || 'Unknown error',
          data: row
        })
      }
    }

    const duration = Math.round(performance.now() - startTime)
    logger.info('Bulk import completed', {
      duration,
      imported: result.imported,
      failed: result.failed,
      total: listings.length
    })

    return NextResponse.json({
      ...result,
      message: `Import completed: ${result.imported} imported, ${result.failed} failed`,
      duration: `${duration}ms`
    })
  } catch (error) {
    logger.error('Bulk import error', error as Error)
    return NextResponse.json({
      error: 'Internal server error',
      message: (error as Error).message
    }, { status: 500 })
  }
}
