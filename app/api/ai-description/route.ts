import { NextResponse } from 'next/server'
import { generateVehicleDescriptionWithOpenAI } from '@/lib/openai'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { incr, incrTrend } from '@/lib/security/metrics'

export async function POST(request: Request) {
  try {
    // Basic body size guard to mitigate abuse
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 25_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const body = await request.json()
    const { make, model, year, mileage, fuel_type, transmission, condition, style, recaptchaToken } = body

    // reCAPTCHA verification (enable via RECAPTCHA_ENABLED=true)
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
    if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
      return captchaGuardFailJson(0.3)
    }

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      )
    }

    const description = await generateVehicleDescriptionWithOpenAI(
      make,
      model,
      year,
      mileage,
      fuel_type,
      transmission,
      condition,
      style || 'professional'
    )

    incr('ai.description.request')
    return NextResponse.json({ description })
  } catch (error) {
    console.error('AI Description Error:', error)
    incr('ai.description.error')
    await incrTrend('ai.description.error')
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}
