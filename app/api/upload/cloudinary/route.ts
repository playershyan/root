import { NextRequest, NextResponse } from 'next/server'
import { CloudinaryService } from '@/lib/cloudinary'
import { performance } from 'perf_hooks'
import { verifyRecaptcha } from '@/lib/security/recaptcha'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { getAuthenticatedSupabase } from '@/lib/server/getAuthenticatedSupabase'

export async function POST(request: NextRequest) {
  const requestStart = performance.now()

  try {
    performanceMonitor.incrementCounter('uploads.cloudinary.requests', 1, { method: 'POST' })
  } catch (metricsError) {
    console.warn('Failed to increment upload counter:', metricsError)
  }

  try {
    logger.api.request('POST', '/api/upload/cloudinary')
  } catch (logError) {
    console.warn('Failed to log API request:', logError)
  }

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    try {
      const durationMs = Math.round(performance.now() - requestStart)
      const logContext = { ...context, durationMs }

      try {
        performanceMonitor.trackApiResponseTime('/api/upload/cloudinary', durationMs)
      } catch (metricsError) {
        console.warn('Failed to track API response time:', metricsError)
      }

      try {
        performanceMonitor.incrementCounter(`uploads.cloudinary.${outcome}`, 1, { method: 'POST' })
      } catch (metricsError) {
        console.warn('Failed to increment outcome counter:', metricsError)
      }

      try {
        if (outcome === 'success') {
          logger.api.success('POST', '/api/upload/cloudinary', durationMs, logContext)
        } else {
          const reason = context.reason || 'Request failed'
          logger.api.error('POST', '/api/upload/cloudinary', new Error(reason), logContext)
        }
      } catch (logError) {
        console.warn('Failed to log API outcome:', logError)
      }
    } catch (finishError) {
      // If logging/monitoring fails, don't let it break the response
      console.error('Error in finish() helper:', finishError)
    }

    return response
  }

  try {
    // Check Cloudinary configuration first
    if (!CloudinaryService.isConfigured()) {
      return finish('failure', NextResponse.json({
        error: 'Server configuration error: Cloudinary not configured',
        debug: {
          cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          api_key: !!process.env.CLOUDINARY_API_KEY,
          api_secret: !!process.env.CLOUDINARY_API_SECRET,
        }
      }, { status: 500 }), { reason: 'cloudinary-not-configured' })
    }

    // Check if user is authenticated
    const authStart = performance.now()
    const { user, error: authError } = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart

    try {
      logger.db.query('supabase.auth.getUser', {
        durationMs: Math.round(authDuration),
        endpoint: 'upload-cloudinary'
      })
    } catch (logError) {
      console.warn('Failed to log DB query:', logError)
    }

    try {
      performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    } catch (metricsError) {
      console.warn('Failed to track DB query:', metricsError)
    }

    if (authError || !user) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    // Optional reCAPTCHA for uploads
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const headerToken = request.headers.get('x-recaptcha-token')

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      logger.error('FormData parsing failed', formError as Error)
      return finish('failure', NextResponse.json({
        error: 'Invalid form data',
        details: 'Failed to parse multipart form data'
      }, { status: 400 }), { reason: 'formdata-parse-failed' })
    }

    const formToken = formData.get('recaptchaToken') as string | null
    const uploadCaptchaRequired = (process.env.RECAPTCHA_UPLOAD_REQUIRED || '').toLowerCase() === 'true'
    const candidateToken = headerToken || formToken || undefined
    if (uploadCaptchaRequired) {
      const captcha = await verifyRecaptcha(candidateToken, ipHeader)
      if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.1)) {
        const { incr } = await import('@/lib/security/metrics')
        incr('uploads.captcha_blocked')
        return finish('failure', NextResponse.json({ error: 'Upload blocked by reCAPTCHA' }, { status: 400 }), {
          reason: 'captcha-blocked',
          score: captcha.score
        })
      }
    } else if (candidateToken) {
      const captcha = await verifyRecaptcha(candidateToken, ipHeader)
      if (!captcha.success) {
        const { incr } = await import('@/lib/security/metrics')
        incr('uploads.captcha_blocked')
        return finish('failure', NextResponse.json({ error: 'Invalid reCAPTCHA' }, { status: 400 }), {
          reason: 'captcha-invalid'
        })
      }
    }
    const files = formData.getAll('images') as File[]
    const listingId = formData.get('listingId') as string

    if (!files || files.length === 0) {
      return finish('failure', NextResponse.json({ error: 'No files provided' }, { status: 400 }), {
        reason: 'no-files'
      })
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return finish('failure', NextResponse.json({
          error: `Invalid file type: ${file.type}. Allowed types: JPEG, JPG, PNG, TIFF, WebP. Maximum size: 10MB`
        }, { status: 400 }), { reason: 'invalid-file-type', fileType: file.type })
      }

      if (file.size > maxSize) {
        return finish('failure', NextResponse.json({
          error: `File too large: ${file.name}. Maximum size: 10MB`
        }, { status: 400 }), { reason: 'file-too-large', fileName: file.name })
      }
    }

    // Convert Files to Buffers
    let fileBuffers: Array<{ buffer: Buffer; fileType: string }>
    try {
      fileBuffers = await Promise.all(
        files.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            return {
              buffer,
              fileType: file.type
            }
          } catch (fileError) {
            logger.error('Failed to convert file to buffer', fileError as Error, {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            })
            throw new Error(`Failed to process file: ${file.name}`)
          }
        })
      )
    } catch (bufferError) {
      return finish('failure', NextResponse.json({
        error: 'Failed to process uploaded files',
        details: (bufferError as Error).message
      }, { status: 500 }), { reason: 'buffer-conversion-failed' })
    }

    // Upload to Cloudinary
    const folder = `vera-lk/listings/${listingId || user.id}`

    // Upload with vera.lk optimizations
    const uploadStart = performance.now()
    let uploadResults: any[]
    try {
      uploadResults = await CloudinaryService.uploadMultipleImages(
        fileBuffers,
        folder,
        {
          tags: ['vera-lk', 'vehicle-listing', user.id, listingId || 'temp'].filter(Boolean),
          transformation: [
            {
              width: 1920,
              height: 1440,
              crop: 'limit',
              quality: 'auto:eco',
              fetch_format: 'auto',
            },
          ],
        }
      )
    } catch (cloudinaryError) {
      const uploadDuration = performance.now() - uploadStart
      logger.error('Cloudinary service error', cloudinaryError as Error, {
        durationMs: Math.round(uploadDuration),
        fileCount: files.length,
        userId: user.id
      })
      return finish('failure', NextResponse.json({
        error: 'Upload service temporarily unavailable',
        details: 'Failed to upload images to storage service',
        debug: {
          error: (cloudinaryError as Error).message,
          fileCount: files.length
        }
      }, { status: 500 }), { reason: 'cloudinary-service-error' })
    }

    const uploadDuration = performance.now() - uploadStart
    try {
      logger.info('Cloudinary upload batch completed', {
        durationMs: Math.round(uploadDuration),
        fileCount: files.length,
        userId: user.id
      })
    } catch (logError) {
      console.warn('Failed to log upload completion:', logError)
    }

    try {
      performanceMonitor.incrementCounter('uploads.cloudinary.files', files.length, { stage: 'processed' })
    } catch (metricsError) {
      console.warn('Failed to track uploaded files:', metricsError)
    }

    // Check for upload failures
    const failedUploads = uploadResults.filter(result => !result.success)

    const successfulUploads = uploadResults.filter(result => result.success)

    if (successfulUploads.length === 0) {
      try {
        performanceMonitor.incrementCounter('uploads.cloudinary.failures', failedUploads.length, { type: 'cloudinary' })
      } catch (metricsError) {
        console.warn('Failed to track upload failures:', metricsError)
      }
      return finish('failure', NextResponse.json({ 
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
      }, { status: 500 }), {
        reason: 'cloudinary-failure',
        failed: failedUploads.length
      })
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

    try {
      performanceMonitor.incrementCounter('uploads.cloudinary.files', successfulUploads.length, { stage: 'succeeded' })
    } catch (metricsError) {
      console.warn('Failed to track successful uploads:', metricsError)
    }

    return finish('success', NextResponse.json({ 
      success: true,
      images: uploadedImages,
      totalUploaded: successfulUploads.length,
      totalFailed: failedUploads.length,
    }), {
      userId: user.id,
      uploaded: successfulUploads.length,
      failed: failedUploads.length
    })

  } catch (error: any) {
    // Log error safely
    try {
      logger.error('Cloudinary upload error', error)
    } catch (logError) {
      console.error('Logger failed during upload error:', logError, 'Original error:', error)
    }

    // Ensure we always return a valid JSON response
    try {
      const errorMessage = error?.message || String(error) || 'Unknown error occurred'
      const errorName = error?.name || 'Error'

      return finish('failure', NextResponse.json({
        error: 'Internal server error',
        details: errorMessage,
        debug: {
          name: errorName,
          message: errorMessage,
          cloudinaryConfig: {
            cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
            api_key: !!process.env.CLOUDINARY_API_KEY,
            api_secret: !!process.env.CLOUDINARY_API_SECRET,
          }
        }
      }, { status: 500 }), { reason: errorMessage })
    } catch (responseError) {
      // Last resort: return minimal error response if JSON.stringify fails
      console.error('Failed to create error response:', responseError)
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error', success: false }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

export async function DELETE(request: NextRequest) {
  const requestStart = performance.now()

  try {
    performanceMonitor.incrementCounter('uploads.cloudinary.requests', 1, { method: 'DELETE' })
  } catch (metricsError) {
    console.warn('Failed to increment delete counter:', metricsError)
  }

  try {
    logger.api.request('DELETE', '/api/upload/cloudinary')
  } catch (logError) {
    console.warn('Failed to log API request:', logError)
  }

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    try {
      const durationMs = Math.round(performance.now() - requestStart)
      const logContext = { ...context, durationMs }

      try {
        performanceMonitor.trackApiResponseTime('/api/upload/cloudinary', durationMs)
      } catch (metricsError) {
        console.warn('Failed to track API response time:', metricsError)
      }

      try {
        performanceMonitor.incrementCounter(`uploads.cloudinary.${outcome}`, 1, { method: 'DELETE' })
      } catch (metricsError) {
        console.warn('Failed to increment outcome counter:', metricsError)
      }

      try {
        if (outcome === 'success') {
          logger.api.success('DELETE', '/api/upload/cloudinary', durationMs, logContext)
        } else {
          const reason = context.reason || 'Request failed'
          logger.api.error('DELETE', '/api/upload/cloudinary', new Error(reason), logContext)
        }
      } catch (logError) {
        console.warn('Failed to log API outcome:', logError)
      }
    } catch (finishError) {
      console.error('Error in finish() helper:', finishError)
    }

    return response
  }

  try {
    // Check if user is authenticated
    const authStart = performance.now()
    const { supabase, user, error: authError } = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart

    try {
      logger.db.query('supabase.auth.getUser', {
        durationMs: Math.round(authDuration),
        endpoint: 'upload-cloudinary-delete'
      })
    } catch (logError) {
      console.warn('Failed to log DB query:', logError)
    }

    try {
      performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    } catch (metricsError) {
      console.warn('Failed to track DB query:', metricsError)
    }
    
    if (authError || !user) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId')
    
    if (!publicId) {
      return finish('failure', NextResponse.json({ error: 'Public ID is required' }, { status: 400 }), {
        reason: 'missing-public-id'
      })
    }

    // Only allow deletion if the image belongs to the user
    if (!publicId.includes(user.id) && !publicId.startsWith('vera-lk/listings/' + user.id)) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized to delete this image' }, { status: 403 }), {
        reason: 'image-not-owned',
        publicId
      })
    }

    const result = await CloudinaryService.deleteImage(publicId)
    
    if (!result.success) {
      return finish('failure', NextResponse.json({ 
        error: 'Failed to delete image',
        details: result.error 
      }, { status: 500 }), {
        reason: 'cloudinary-delete-failed',
        publicId
      })
    }

    try {
      performanceMonitor.incrementCounter('uploads.cloudinary.deletions', 1, { outcome: 'success' })
    } catch (metricsError) {
      console.warn('Failed to track deletion:', metricsError)
    }

    return finish('success', NextResponse.json({ success: true }), { publicId, userId: user.id })

  } catch (error: any) {
    try {
      logger.error('Cloudinary delete error', error)
    } catch (logError) {
      console.error('Failed to log delete error:', logError, 'Original error:', error)
    }

    return finish('failure', NextResponse.json({
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 }), { reason: error?.message || 'unknown' })
  }
}

// Increase size limits for file uploads
export const runtime = 'nodejs'
export const maxDuration = 60
