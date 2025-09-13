import { NextRequest, NextResponse } from 'next/server'
import { verifyRecaptcha } from '@/lib/security/recaptcha'

export async function POST(request: NextRequest) {
  try {
    const { recaptchaToken } = await request.json()
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const result = await verifyRecaptcha(recaptchaToken, ipHeader)
    return NextResponse.json({ success: result.success, score: result.score, action: result.action, errors: result.errorCodes })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'invalid-request' }, { status: 400 })
  }
}

