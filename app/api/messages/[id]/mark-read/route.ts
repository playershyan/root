/**
 * Mark Messages as Read API
 * Marks all unread messages in a conversation as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

/**
 * PATCH /api/messages/[id]/mark-read
 * Mark all messages in a conversation as read for the current user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const conversationId = params.id

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Use service role to bypass RLS for updates
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine if user is buyer or seller
    const isBuyer = conversation.buyer_id === user.id

    // Mark all unread messages from the other party as read
    const { error: updateMessagesError } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .eq('sender_id', isBuyer ? conversation.seller_id : conversation.buyer_id)
      .eq('is_read', false)

    if (updateMessagesError) {
      logger.error('Error marking messages as read', updateMessagesError as Error)
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }

    // Reset unread count for the current user
    const updateField = isBuyer ? 'buyer_unread_count' : 'seller_unread_count'
    const { error: updateConvError } = await supabaseAdmin
      .from('conversations')
      .update({
        [updateField]: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateConvError) {
      logger.error('Error updating conversation unread count', updateConvError as Error)
      return NextResponse.json(
        { error: 'Failed to update conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    })

  } catch (error) {
    logger.error('PATCH mark-read error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
