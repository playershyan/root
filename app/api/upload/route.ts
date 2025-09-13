import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { APIError } from '@/lib/errorHandling'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new APIError('Authentication required', 401)
    }

    // Optional reCAPTCHA check for uploads; enforce via RECAPTCHA_UPLOAD_REQUIRED=true
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
      throw new APIError('No file provided', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new APIError('File size exceeds 5MB limit', 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new APIError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new APIError('Failed to upload file', 500, error)
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return Response.json({
      data: {
        url: publicUrl,
        path: data.path
      },
      success: true
    })
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return Response.json(
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
      throw new APIError('Failed to delete file', 500, error)
    }

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return Response.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
