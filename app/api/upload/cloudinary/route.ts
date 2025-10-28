import { NextRequest, NextResponse } from 'next/server'
import { CloudinaryService } from '@/lib/cloudinary'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Cloudinary upload API called')
    
    // Check Cloudinary configuration first
    if (!CloudinaryService.isConfigured()) {
      console.error('❌ Cloudinary is not properly configured')
      console.error('Missing environment variables:', {
        CLOUDINARY_CLOUD_NAME: !process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: !process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: !process.env.CLOUDINARY_API_SECRET,
      })
      return NextResponse.json({ 
        error: 'Server configuration error: Cloudinary not configured',
        debug: {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET,
        }
      }, { status: 500 })
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

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
    
    console.log('📁 Form data received:', {
      filesCount: files.length,
      listingId,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
      fileTypes: files.map(f => f.type)
    })
    
    if (!files || files.length === 0) {
      console.log('❌ No files provided')
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    console.log('🔍 Validating files...')
    for (const file of files) {
      console.log(`📄 Validating ${file.name}: type=${file.type}, size=${file.size}`)
      
      if (!allowedTypes.includes(file.type)) {
        console.log(`❌ Invalid file type: ${file.type}`)
        return NextResponse.json({ 
          error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP` 
        }, { status: 400 })
      }
      
      if (file.size > maxSize) {
        console.log(`❌ File too large: ${file.name} (${file.size} bytes)`)
        return NextResponse.json({ 
          error: `File too large: ${file.name}. Maximum size: 10MB` 
        }, { status: 400 })
      }
    }
    console.log('✅ All files validated successfully')

    // Convert Files to Buffers
    console.log('🔄 Converting Files to Buffers...')
    const fileBuffers = await Promise.all(
      files.map(async (file, index) => {
        console.log(`📦 Converting file ${index + 1}/${files.length}: ${file.name}`)
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log(`✅ File ${file.name} converted: ${buffer.length} bytes`)
        return {
          buffer,
          fileType: file.type
        }
      })
    )
    console.log('✅ All files converted to buffers')

    // Upload to Cloudinary
    const folder = `vera-lk/listings/${listingId || user.id}`
    console.log('☁️ Starting Cloudinary uploads to folder:', folder)
    
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

    console.log('📊 Upload results summary:', {
      totalFiles: uploadResults.length,
      successful: uploadResults.filter(r => r.success).length,
      failed: uploadResults.filter(r => !r.success).length,
      failures: uploadResults.filter(r => !r.success).map(r => r.error)
    })

    // Check for upload failures
    const failedUploads = uploadResults.filter(result => !result.success)
    if (failedUploads.length > 0) {
      console.error('❌ Some uploads failed:')
      failedUploads.forEach((failure, index) => {
        console.error(`  ${index + 1}. ${failure.error}`)
      })
    }

    const successfulUploads = uploadResults.filter(result => result.success)
    console.log('✅ Successful uploads:', successfulUploads.length)
    
    if (successfulUploads.length === 0) {
      console.log('💥 All uploads failed, returning error')
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
    console.log('🎯 Preparing response with successful uploads')
    const uploadedImages = successfulUploads.map(result => ({
      url: result.secure_url || result.url,  // Original uploaded image
      publicId: result.public_id,
      // Optimized URLs for different use cases
      thumbnail: result.public_id ? CloudinaryService.getThumbnailUrl(result.public_id, 400) : null,
      mobile: result.public_id ? CloudinaryService.getMobileUrl(result.public_id) : null,
      gallery: result.public_id ? CloudinaryService.getGalleryUrl(result.public_id) : null,
    }))

    console.log('🎉 Upload API completed successfully:', {
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length,
      imageUrls: uploadedImages.map(img => img.url)
    })

    return NextResponse.json({ 
      success: true,
      images: uploadedImages,
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length,
    })

  } catch (error: any) {
    console.error('💥 Cloudinary upload API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
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
    const supabase = createRouteHandlerClient({ cookies })
    
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
    console.error('Cloudinary delete API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// Increase size limits and timeout for file uploads (especially on mobile)
export const runtime = 'nodejs'
export const maxDuration = 120 // Increased from 60 to 120 seconds for slow mobile connections
