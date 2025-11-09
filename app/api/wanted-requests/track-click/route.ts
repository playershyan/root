import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()
    logger.debug('Track click - Request received', { requestId })

    if (!requestId) {
      logger.warn('Track click - No requestId provided')
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Increment the clicks count using RPC function
    logger.debug('Track click - Calling RPC function', { requestId })
    const { data, error } = await supabase.rpc('increment_wanted_request_clicks', {
      request_id: requestId
    })

    if (error) {
      logger.error('Track click - RPC Error', error as Error)
      return NextResponse.json(
        { error: 'Failed to track click', details: error.message },
        { status: 500 }
      )
    }

    logger.debug('Track click - Success', { data })
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Track click - Unexpected error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
