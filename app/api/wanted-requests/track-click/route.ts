import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()
    console.log('[track-click] Request received:', requestId)

    if (!requestId) {
      console.error('[track-click] No requestId provided')
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabaseClient()

    // Increment the clicks count using RPC function
    console.log('[track-click] Calling RPC function with:', requestId)
    const { data, error } = await supabase.rpc('increment_wanted_request_clicks', {
      request_id: requestId
    })

    if (error) {
      console.error('[track-click] RPC Error:', error)
      return NextResponse.json(
        { error: 'Failed to track click', details: error.message },
        { status: 500 }
      )
    }

    console.log('[track-click] Success:', data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[track-click] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
