import { NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { TemplateProcessor, FormDataForTemplate } from '@/lib/services/templateProcessor'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { incr, incrTrend } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  const totalStart = performance.now()
  const timings: Record<string, number> = {}
  let status: 'success' | 'captcha_fail' | 'validation_error' | 'error' = 'error'
  let templateId: number | null = null

  const logTimings = (extra?: Record<string, unknown>) => {
    timings.totalMs = Number((performance.now() - totalStart).toFixed(2))
    logger.debug('AI description API timing', {
      status,
      durations: Object.fromEntries(
        Object.entries(timings).map(([key, value]) => [key, Number(value.toFixed(2))])
      ),
      templateId,
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
      includingFinanceCompanies,
      style,
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

    if (!make || !model || !year) {
      status = 'validation_error'
      logTimings()
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      )
    }

    // Prepare form data for template processing
    const formData: FormDataForTemplate = {
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
      includingFinanceCompanies
    }

    // Generate description using template system
    const templateStart = performance.now()
    const result = await TemplateProcessor.generateDescription(formData)
    timings.templateMs = performance.now() - templateStart
    templateId = result.id

    incr('ai.description.request')
    incr('template.usage.total')

    status = 'success'
    logTimings()
    return NextResponse.json({
      description: result.content,
      templateId: result.id,
      usageCount: result.usageCount
    })
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
