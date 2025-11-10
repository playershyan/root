import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { APIError } from '@/lib/errorHandling'
import { verifyRecaptcha } from '@/lib/security/recaptcha'
import { logger } from '@/lib/utils/logger'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    logger.api.request('POST', '/api/upload')
    const supabase = createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      logger.error('Upload auth failed', userError || new Error('No user'))
      throw new APIError('Authentication required', 401)
    }

    // Optional reCAPTCHA check for uploads; enforce via RECAPTCHA_UPLOAD_REQUIRED=true
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const headerToken = request.headers.get('x-recaptcha-token')

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      logger.error('FormData parsing failed', formError as Error)
      throw new APIError('Invalid form data', 400)
    }
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
      // If token is provided, verify and reject only if explicitly invalid
      const captcha = await verifyRecaptcha(candidateToken, ipHeader)
      if (!captcha.success) {
        const { incr } = await import('@/lib/security/metrics')
        incr('uploads.captcha_blocked')
        return NextResponse.json({ error: 'Invalid reCAPTCHA' }, { status: 400 })
      }
    }
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'listings'

    if (!file) {
      logger.error('No file in upload request', null, { userId: user.id })
      throw new APIError('No file provided', 400)
    }

    logger.info('Upload file received', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      bucket,
      userId: user.id
    })

    if (file.size > MAX_FILE_SIZE) {
      logger.error('File size exceeds limit', null, {
        userId: user.id,
        fileSize: file.size,
        maxSize: MAX_FILE_SIZE
      })
      throw new APIError('File size exceeds 5MB limit', 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      logger.error('Invalid file type', null, {
        userId: user.id,
        fileType: file.type,
        allowedTypes: ALLOWED_TYPES
      })
      throw new APIError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    logger.info('Uploading to storage', { bucket, fileName, userId: user.id })

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      logger.error('Storage upload failed', error, { userId: user.id, fileName, bucket })
      throw new APIError('Failed to upload file', 500, error)
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    logger.api.success('POST', '/api/upload', 0, { userId: user.id, bucket, fileName })
    return NextResponse.json({
      data: {
        url: publicUrl,
        path: data.path
      },
      success: true
    })
  } catch (error) {
    logger.error('Upload POST error', error as Error, {
      userId: (error as any)?.userId,
      isAPIError: error instanceof APIError
    })

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new APIError('Authentication required', 401)
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const bucket = searchParams.get('bucket') || 'listings'

    if (!filePath) {
      throw new APIError('File path is required', 400)
    }

    if (!filePath.startsWith(user.id + '/')) {
      throw new APIError('Unauthorized to delete this file', 403)
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      logger.error('Storage delete failed', error, { userId: user.id, filePath, bucket })
      throw new APIError('Failed to delete file', 500, error)
    }

    logger.api.success('DELETE', '/api/upload', 0, { userId: user.id, bucket, filePath })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Upload DELETE error', error as Error, {
      userId: (error as any)?.userId,
      isAPIError: error instanceof APIError
    })

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
