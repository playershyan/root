import { NextRequest, NextResponse } from 'next/server'
import { SandboxPaymentService } from '@/lib/payments/sandboxPaymentService'
import { PromotionService, PromotionType } from '@/lib/services/promotionService'
import { logger } from '@/lib/utils/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { listingId, features, amount, useSandbox } = body

    if (!listingId || !features || !Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, features' },
        { status: 400 }
      )
    }

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to promote this listing' },
        { status: 403 }
      )
    }

    // Check if sandbox mode should be used
    const shouldUseSandbox = useSandbox === true || SandboxPaymentService.isSandboxMode()

    if (shouldUseSandbox) {
      // Process sandbox payment
      const result = await SandboxPaymentService.processPayment({
        listingId,
        promotionTypes: features as PromotionType[],
        customerEmail: user.email || '',
        customerName: user.user_metadata?.name || user.email || 'User',
        customerPhone: user.user_metadata?.phone || '',
        scenario: 'success'
      })

      if (result.success) {
        return NextResponse.json({
          success: true,
          orderId: result.orderId,
          transactionId: result.transactionId,
          message: result.message
        })
      } else {
        return NextResponse.json(
          { 
            error: result.message,
            activationFailed: true 
          },
          { status: 400 }
        )
      }
    } else {
      // Real payment flow - this would integrate with PayHere/Stripe
      // For now, we'll create promotions directly (assuming payment was processed externally)
      const { error: promoError } = await PromotionService.createPromotionBundle(
        listingId,
        features as PromotionType[],
        `PAYMENT-${Date.now()}`
      )

      if (promoError) {
        logger.error('Failed to create promotions', promoError as Error)
        return NextResponse.json(
          { 
            error: 'Failed to activate promotions',
            activationFailed: true 
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Promotions activated successfully'
      })
    }
  } catch (error: any) {
    logger.error('Payment completion error', error as Error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

