import { NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { incr, incrTrend } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'
import { buildListingDescription } from '@/lib/services/descriptionBuilder'
import { getFieldConfig } from '@/lib/utils/vehicleFieldConfig'

export async function POST(request: Request) {
  const totalStart = performance.now()
  const timings: Record<string, number> = {}
  let status: 'success' | 'captcha_fail' | 'validation_error' | 'error' = 'error'

  const logTimings = (extra?: Record<string, unknown>) => {
    timings.totalMs = Number((performance.now() - totalStart).toFixed(2))
    logger.debug('AI description API timing', {
      status,
      durations: Object.fromEntries(
        Object.entries(timings).map(([key, value]) => [key, Number(value.toFixed(2))])
      ),
      linesCount: (extra?.linesCount as number) ?? undefined,
      ...extra
    })
  }

  try {
    // Basic body size guard to mitigate abuse
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 25_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const parseStart = performance.now()
    const body = await request.json()
    timings.bodyParseMs = performance.now() - parseStart
    const {
      // Vehicle Identity
      vehicleType,
      make,
      customMake,
      model,
      customModel,
      trim,
      year,
      registrationYear,

      // Core Specifications
      condition,
      engineCapacity,
      fuelType,
      transmission,
      mileage,

      // Visual & Details
      color,
      interiorColor,

      // Ownership & History
      previousOwners,
      vehicleConditionDetails,
      serviceRecordsAvailable,

      // Pricing
      pricingType,
      price,
      negotiable,
      financeType,
      outstandingBalance,
      monthlyPayment,
      remainingTerm,
      askingPrice,

      // Location
      district,
      city,

      // Features
      features,

      // Additional
      title,
      recaptchaToken
    } = body

    // reCAPTCHA verification (enable via RECAPTCHA_ENABLED=true)
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const captchaStart = performance.now()
    const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
    timings.captchaMs = performance.now() - captchaStart
    if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
      status = 'captcha_fail'
      logTimings({ recaptcha: { success: captcha.success, score: captcha.score ?? null } })
      return captchaGuardFailJson(0.3)
    }

    // Get field configuration for the vehicle type
    const fieldConfig = getFieldConfig(vehicleType || '')
    
    // Validate required fields based on vehicle category
    const missingFields: string[] = []
    
    if (!make) {
      missingFields.push('make')
    }
    
    if (fieldConfig.modelRequired && !model) {
      missingFields.push('model')
    }
    
    if (fieldConfig.yearRequired && !year) {
      missingFields.push('year')
    }
    
    if (fieldConfig.mileageRequired && !mileage) {
      missingFields.push('mileage')
    }
    
    if (missingFields.length > 0) {
      status = 'validation_error'
      logTimings()
      const fieldNames = missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')
      return NextResponse.json(
        { error: `Required fields missing: ${fieldNames}` },
        { status: 400 }
      )
    }

    const buildStart = performance.now()
    const { description, linesCount } = buildListingDescription({
      title,
      vehicleType,
      make,
      customMake,
      model,
      customModel,
      trim,
      year,
      registrationYear,
      condition,
      engineCapacity,
      fuelType,
      transmission,
      mileage,
      color,
      interiorColor,
      previousOwners,
      vehicleConditionDetails,
      serviceRecordsAvailable,
      pricingType,
      price,
      negotiable,
      financeType,
      outstandingBalance,
      monthlyPayment,
      remainingTerm,
      askingPrice,
      district,
      city,
      features
    })
    timings.buildMs = performance.now() - buildStart

    incr('ai.description.request')

    status = 'success'
    logTimings({ linesCount })
    return NextResponse.json({ description, linesCount })
  } catch (error) {
    logger.error('AI Description Error', error as Error)
    incr('ai.description.error')
    await incrTrend('ai.description.error')
    status = 'error'
    logTimings()
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}
