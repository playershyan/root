import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// API endpoints for user bin management (restore deleted items)

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's bin items
    const { data: binItems, error: binError } = await supabase
      .rpc('get_user_bin_items', { p_user_id: user.id })

    if (binError) {
      console.error('Error fetching bin items:', binError)
      return NextResponse.json(
        { error: 'Failed to fetch bin items', details: binError.message },
        { status: 500 }
      )
    }

    // Group items by type for easier frontend handling
    const groupedItems = {
      listings: binItems?.filter(item => item.item_type === 'listing') || [],
      wanted_requests: binItems?.filter(item => item.item_type === 'wanted_request') || [],
      messages: binItems?.filter(item => item.item_type === 'message') || [],
    }

    const summary = {
      total_items: binItems?.length || 0,
      restorable_items: binItems?.filter(item => item.can_restore).length || 0,
      items_expiring_soon: binItems?.filter(item => 
        item.can_restore && item.days_until_permanent_deletion <= 7
      ).length || 0
    }

    return NextResponse.json({
      success: true,
      summary,
      items: groupedItems,
      all_items: binItems || [],
      user_id: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action, item_type, item_id } = body

    if (action !== 'restore') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!item_type || !item_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: item_type and item_id' 
      }, { status: 400 })
    }

    if (!['listing', 'wanted_request', 'message'].includes(item_type)) {
      return NextResponse.json({ error: 'Invalid item_type' }, { status: 400 })
    }

    // Restore the item
    const { data: restoreResult, error: restoreError } = await supabase
      .rpc('restore_user_item', {
        p_user_id: user.id,
        p_item_type: item_type,
        p_item_id: item_id
      })

    if (restoreError) {
      console.error('Error restoring item:', restoreError)
      return NextResponse.json(
        { error: 'Failed to restore item', details: restoreError.message },
        { status: 500 }
      )
    }

    const result = restoreResult?.[0]

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Restore failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      restored_status: result.restored_status,
      item_type,
      item_id,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      next_steps: getNextStepsMessage(item_type, result.restored_status)
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getNextStepsMessage(itemType: string, status: string): string {
  switch (itemType) {
    case 'listing':
      return status === 'pending' 
        ? 'Your listing has been restored but is currently pending. Please review and activate it in your listings management.'
        : 'Your listing has been restored.'
    
    case 'wanted_request':
      return status === 'paused'
        ? 'Your wanted request has been restored but is currently paused. Please review and activate it in your wanted requests management.'
        : 'Your wanted request has been restored.'
    
    case 'message':
      return 'Your message has been restored and is now visible in the conversation.'
    
    default:
      return 'Item has been restored successfully.'
  }
}