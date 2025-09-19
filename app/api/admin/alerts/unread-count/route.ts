import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('view_dashboard')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { count, error } = await supabase
      .from('system_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)

    if (error) {
      console.error('Error counting unread alerts:', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error) {
    console.error('Get unread alerts count error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}