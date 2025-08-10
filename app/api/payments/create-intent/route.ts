import { NextRequest, NextResponse } from 'next/server'
import { StripePaymentService } from '@/lib/payments/stripeService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, promotionTypes, customerEmail, customerName } = body

    // Validate required fields
    if (!listingId || !promotionTypes || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!Array.isArray(promotionTypes) || promotionTypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid promotion types' },
        { status: 400 }
      )
    }

    // Create payment intent
    const result = await StripePaymentService.createPaymentIntent({
      listingId,
      promotionTypes,
      customerEmail,
      customerName,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'