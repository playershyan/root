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
      delay,
      entityType = 'listing',
      entityId
    } = body

    // Use entityId if provided, otherwise fall back to listingId
    const targetId = entityId || listingId

    // Validate required fields
    if (!targetId || !promotionTypes || !customerEmail || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId/entityId, promotionTypes, customerEmail, customerName, customerPhone' },
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

    // Verify ownership based on entity type
    if (entityType === 'wanted') {
      const { data: wantedRequest, error: wantedError } = await supabase
        .from('wanted_requests')
        .select('id, user_id')
        .eq('id', targetId)
        .single()

      if (wantedError || !wantedRequest) {
        return NextResponse.json(
          { error: 'Wanted request not found' },
          { status: 404 }
        )
      }

      if (wantedRequest.user_id !== user.id) {
        return NextResponse.json(
          { error: 'You do not have permission to promote this wanted request' },
          { status: 403 }
        )
      }
    } else {
      // Verify listing ownership
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, user_id')
        .eq('id', targetId)
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

      // Check for existing active promotions on listing
      const { data: activePromotions, error: promotionError } = await supabase
        .from('promotions')
        .select('id, promotion_type')
        .eq('listing_id', targetId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (promotionError) {
        logger.error('Error checking active promotions', promotionError as Error)
        return NextResponse.json(
          { error: 'Failed to check existing promotions' },
          { status: 500 }
        )
      }

      if (activePromotions && activePromotions.length > 0) {
        const activeFeatureNames = activePromotions.map(p => p.promotion_type).join(', ')
        return NextResponse.json(
          {
            error: 'This listing already has active paid features',
            detail: `Active features: ${activeFeatureNames}. Only one paid feature can be active at a time.`
          },
          { status: 409 }
        )
      }
    }

    // Process sandbox payment with authenticated client
    const result = await SandboxPaymentService.processPayment({
      listingId: targetId,
      promotionTypes: promotionTypes as PromotionType[],
      customerEmail,
      customerName,
      customerPhone,
      scenario,
      delay,
      entityType: entityType as 'listing' | 'wanted'
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

