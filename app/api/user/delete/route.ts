import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// API endpoint for soft-deleting user items (move to bin)

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
    const { item_type, item_id } = body

    if (!item_type || !item_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: item_type and item_id' 
      }, { status: 400 })
    }

    // Validate item_type
    const validTypes = ['listing', 'wanted_request', 'message']
    if (!validTypes.includes(item_type)) {
      return NextResponse.json({ 
        error: `Invalid item_type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Determine table name
    const tableName = item_type === 'listing' ? 'listings' : 
                      item_type === 'wanted_request' ? 'wanted_requests' : 
                      'messages'

    // First, verify the item belongs to the user
    const { data: item, error: fetchError } = await supabase
      .from(tableName)
      .select('id, user_id, status')
      .eq('id', item_id)
      .single()

    if (fetchError || !item) {
      logger.error('Error fetching item for deletion', fetchError as Error)
      return NextResponse.json({ 
        error: 'Item not found' 
      }, { status: 404 })
    }

    // Check ownership
    if (item.user_id !== user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to delete this item' 
      }, { status: 403 })
    }

    // Check if already deleted
    if (item.status === 'deleted') {
      return NextResponse.json({ 
        error: 'Item is already in the bin' 
      }, { status: 400 })
    }

    // Soft delete the item
    const { error: deleteError } = await supabase
      .from(tableName)
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', item_id)
      .eq('user_id', user.id)

    if (deleteError) {
      logger.error('Error deleting item', deleteError as Error, {
        item_type,
        item_id,
        user_id: user.id
      })
      return NextResponse.json({ 
        error: 'Failed to delete item',
        details: deleteError.message
      }, { status: 500 })
    }

    logger.info('Item moved to bin successfully', {
      item_type,
      item_id,
      user_id: user.id
    })

    return NextResponse.json({
      success: true,
      message: `${item_type === 'listing' ? 'Listing' : item_type === 'wanted_request' ? 'Wanted request' : 'Message'} moved to bin successfully`,
      item_type,
      item_id,
      user_id: user.id,
      deleted_at: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in POST delete item', error as Error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

