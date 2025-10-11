import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Increment the clicks count using RPC function
    const { error } = await supabase.rpc('increment_wanted_request_clicks', {
      request_id: requestId
    })

    if (error) {
      console.error('Error tracking click:', error)
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in track-click API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
