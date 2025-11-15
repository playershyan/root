import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
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

    // Authenticate user
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to process payments.' },
        { status: 401 }
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

    // Process sandbox payment with authenticated client
    const result = await SandboxPaymentService.processPayment({
      listingId,
      promotionTypes: promotionTypes as PromotionType[],
      customerEmail,
      customerName,
      customerPhone,
      scenario,
      delay
    }, supabase)

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

