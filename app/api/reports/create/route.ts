import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { logger } from '@/lib/utils/logger'

const VALID_REASONS = [
  'inappropriate_content',
  'fraud_scam', 
  'duplicate_listing',
  'wrong_category',
  'spam_advertising'
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, wantedRequestId, reason, description, recaptchaToken } = await request.json()

    // reCAPTCHA verification for abuse-prone reporting
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
    if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
      return captchaGuardFailJson(0.3)
    }

    // Validate input
    if (!listingId && !wantedRequestId) {
      return NextResponse.json({ 
        error: 'Either listing ID or wanted request ID is required' 
      }, { status: 400 })
    }

    if (listingId && wantedRequestId) {
      return NextResponse.json({ 
        error: 'Cannot report both listing and wanted request' 
      }, { status: 400 })
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ 
        error: 'Invalid report reason' 
      }, { status: 400 })
    }

    // Check if user already reported this item
    const existingReportQuery = supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)

    if (listingId) {
      existingReportQuery.eq('listing_id', listingId)
    } else {
      existingReportQuery.eq('wanted_request_id', wantedRequestId)
    }

    const { data: existingReport } = await existingReportQuery.single()

    if (existingReport) {
      return NextResponse.json({ 
        error: 'You have already reported this item' 
      }, { status: 400 })
    }

    // Prevent users from reporting their own content
    if (listingId) {
      const { data: listing } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single()

      if (listing?.user_id === user.id) {
        return NextResponse.json({ 
          error: 'You cannot report your own listing' 
        }, { status: 400 })
      }
    } else {
      const { data: wantedRequest } = await supabase
        .from('wanted_requests')
        .select('user_id')
        .eq('id', wantedRequestId)
        .single()

      if (wantedRequest?.user_id === user.id) {
        return NextResponse.json({ 
          error: 'You cannot report your own wanted request' 
        }, { status: 400 })
      }
    }

    // Create the report
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        listing_id: listingId || null,
        wanted_request_id: wantedRequestId || null,
        reason,
        description: description || null
      })

    if (insertError) {
      logger.error('Error creating report', insertError as Error)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully. We will review it shortly.' 
    })

  } catch (error) {
    logger.error('Create report error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
