import { NextRequest, NextResponse } from 'next/server'
import { CloudinaryService } from '@/lib/cloudinary'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

export async function POST(request: NextRequest) {
  try {
    // Check Cloudinary configuration first
    if (!CloudinaryService.isConfigured()) {
      return NextResponse.json({
        error: 'Server configuration error: Cloudinary not configured',
        debug: {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET,
        }
      }, { status: 500 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional reCAPTCHA for uploads
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const headerToken = request.headers.get('x-recaptcha-token')
    const formData = await request.formData()
    const formToken = formData.get('recaptchaToken') as string | null
    const uploadCaptchaRequired = (process.env.RECAPTCHA_UPLOAD_REQUIRED || '').toLowerCase() === 'true'
    const candidateToken = headerToken || formToken || undefined
    if (uploadCaptchaRequired) {
      const captcha = await verifyRecaptcha(candidateToken, ipHeader)
      if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.1)) {
        const { incr } = await import('@/lib/security/metrics')
        incr('uploads.captcha_blocked')
        return NextResponse.json({ error: 'Upload blocked by reCAPTCHA' }, { status: 400 })
      }
    } else if (candidateToken) {
      const captcha = await verifyRecaptcha(candidateToken, ipHeader)
      if (!captcha.success) {
        const { incr } = await import('@/lib/security/metrics')
        incr('uploads.captcha_blocked')
        return NextResponse.json({ error: 'Invalid reCAPTCHA' }, { status: 400 })
      }
    }
    const files = formData.getAll('images') as File[]
    const listingId = formData.get('listingId') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({
          error: `Invalid file type: ${file.type}. Allowed types: JPEG, JPG, PNG, TIFF, WebP. Maximum size: 10MB`
        }, { status: 400 })
      }

      if (file.size > maxSize) {
        return NextResponse.json({
          error: `File too large: ${file.name}. Maximum size: 10MB`
        }, { status: 400 })
      }
    }

    // Convert Files to Buffers
    const fileBuffers = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return {
          buffer,
          fileType: file.type
        }
      })
    )

    // Upload to Cloudinary
    const folder = `vera-lk/listings/${listingId || user.id}`

    // Upload with vera.lk optimizations
    const uploadResults = await CloudinaryService.uploadMultipleImages(
      fileBuffers,
      folder,
      {
        tags: ['vera-lk', 'vehicle-listing', user.id, listingId || 'temp'].filter(Boolean),
        quality: 'auto:good'
        // No format option - format optimization happens on delivery URLs
        // No custom transformation - let CloudinaryService use its defaults
      }
    )

    // Check for upload failures
    const failedUploads = uploadResults.filter(result => !result.success)

    const successfulUploads = uploadResults.filter(result => result.success)

    if (successfulUploads.length === 0) {
      return NextResponse.json({ 
        error: 'All uploads failed',
        details: failedUploads.map(f => f.error).join(', '),
        debug: {
          failedUploads: failedUploads.map(f => ({ error: f.error })),
          cloudinaryConfig: {
            cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
            api_key: !!process.env.CLOUDINARY_API_KEY,
            api_secret: !!process.env.CLOUDINARY_API_SECRET,
          }
        }
      }, { status: 500 })
    }

    // Return successful upload URLs with optimized variants
    const uploadedImages = successfulUploads.map(result => ({
      url: result.secure_url || result.url,  // Original uploaded image
      publicId: result.public_id,
      // Optimized URLs for different use cases
      thumbnail: result.public_id ? CloudinaryService.getThumbnailUrl(result.public_id, 400) : null,
      mobile: result.public_id ? CloudinaryService.getMobileUrl(result.public_id) : null,
      gallery: result.public_id ? CloudinaryService.getGalleryUrl(result.public_id) : null,
    }))

    return NextResponse.json({ 
      success: true,
      images: uploadedImages,
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length,
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      debug: {
        name: error.name,
        message: error.message,
        cloudinaryConfig: {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET,
        }
      }
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')
    
    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 })
    }

    // Only allow deletion if the image belongs to the user
    if (!publicId.includes(user.id) && !publicId.startsWith('vera-lk/listings/' + user.id)) {
      return NextResponse.json({ error: 'Unauthorized to delete this image' }, { status: 403 })
    }

    const result = await CloudinaryService.deleteImage(publicId)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Failed to delete image',
        details: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Increase size limits for file uploads
export const runtime = 'nodejs'
export const maxDuration = 60
