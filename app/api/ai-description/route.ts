import { NextResponse } from 'next/server'
import { TemplateProcessor, FormDataForTemplate } from '@/lib/services/templateProcessor'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { incr, incrTrend } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    // Basic body size guard to mitigate abuse
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 25_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const body = await request.json()
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
    const result = await TemplateProcessor.generateDescription(formData)

    incr('ai.description.request')
    incr('template.usage.total')

    return NextResponse.json({
      description: result.content,
      templateId: result.id,
      usageCount: result.usageCount
    })
  } catch (error) {
    logger.error('AI Description Error', error as Error)
    incr('ai.description.error')
    await incrTrend('ai.description.error')
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}
