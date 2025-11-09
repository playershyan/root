import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// POST - Resume business profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('business_profiles')
      .update({ is_paused: false })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      logger.error('Error resuming business profile', error as Error)
      return NextResponse.json({ error: 'Failed to resume business profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    logger.error('Unexpected error in resume business profile', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}