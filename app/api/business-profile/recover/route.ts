import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// GET - Check if business profile can be recovered
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check recovery eligibility
    const { data: recoveryInfo, error } = await supabase
      .rpc('check_business_profile_recovery', { p_user_id: user.id })

    if (error) {
      logger.error('Error checking business profile recovery', error as Error)
      return NextResponse.json({
        error: 'Failed to check recovery status'
      }, { status: 500 })
    }

    return NextResponse.json({
      canRecover: recoveryInfo?.can_recover || false,
      businessName: recoveryInfo?.business_name,
      deletedAt: recoveryInfo?.deleted_at,
      recoveryDeadline: recoveryInfo?.recovery_deadline,
      daysRemaining: recoveryInfo?.days_remaining,
      deletionReason: recoveryInfo?.deletion_reason
    })

  } catch (error) {
    logger.error('Unexpected error in business profile recovery check', error as Error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - Recover deleted business profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get confirmation from request body
    const body = await request.json()
    const { confirm } = body

    if (!confirm) {
      return NextResponse.json({ 
        error: 'Confirmation required to recover business profile' 
      }, { status: 400 })
    }

    // Attempt to recover the business profile
    const { data: result, error } = await supabase
      .rpc('recover_business_profile', { p_user_id: user.id })

    if (error) {
      logger.error('Error recovering business profile', error as Error)
      return NextResponse.json({
        error: 'Failed to recover business profile'
      }, { status: 500 })
    }

    if (!result?.success) {
      return NextResponse.json({
        error: result?.error || 'Recovery failed'
      }, { status: 400 })
    }

    // Log the recovery for audit purposes
    logger.audit('Business profile recovered', {
      userId: user.id,
      businessName: result.business_name
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      profileId: result.profile_id,
      businessName: result.business_name
    })

  } catch (error) {
    logger.error('Unexpected error during recovery', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}