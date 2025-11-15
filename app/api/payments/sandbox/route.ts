import { NextRequest, NextResponse } from 'next/server'
import { SandboxPaymentService } from '@/lib/payments/sandboxPaymentService'
import { logger } from '@/lib/utils/logger'
import { PromotionType } from '@/lib/services/promotionService'

export async function POST(request: NextRequest) {
  try {
    // Check if sandbox mode is enabled
    if (!SandboxPaymentService.isSandboxMode()) {
      return NextResponse.json(
        { error: 'Sandbox mode is not enabled. Set PAYMENT_SANDBOX_MODE=true in your environment.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      listingId,
      promotionTypes,
      customerEmail,
      customerName,
      customerPhone,
      scenario = 'success',
      delay
    } = body

    // Validate required fields
    if (!listingId || !promotionTypes || !customerEmail || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, promotionTypes, customerEmail, customerName, customerPhone' },
        { status: 400 }
      )
    }

    // Validate promotion types
    const validPromotionTypes: PromotionType[] = ['featured', 'top_spot', 'boost', 'urgent']
    const invalidTypes = promotionTypes.filter((type: string) => !validPromotionTypes.includes(type as PromotionType))
    
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid promotion types: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Process sandbox payment
    const result = await SandboxPaymentService.processPayment({
      listingId,
      promotionTypes: promotionTypes as PromotionType[],
      customerEmail,
      customerName,
      customerPhone,
      scenario,
      delay
    })

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error: any) {
    logger.error('Sandbox payment API error', error as Error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

