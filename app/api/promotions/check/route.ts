import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing listingId parameter' },
        { status: 400 }
      )
    }

    // Check for active promotions
    const { data: activePromotions, error } = await supabase
      .from('promotions')
      .select('id, promotion_type, expires_at')
      .eq('listing_id', listingId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check promotions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasActivePromotions: activePromotions && activePromotions.length > 0,
      activePromotions: activePromotions || []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
