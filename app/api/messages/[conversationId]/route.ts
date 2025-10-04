import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('GET Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('GET Authenticated user:', user.id, 'for conversation:', params.conversationId)

    const conversationId = params.conversationId

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id(id, email, profiles(name, avatar_url)),
        seller:seller_id(id, email, profiles(name, avatar_url))
      `)
      .eq('id', conversationId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, profiles(name, avatar_url))
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark messages as read
    const unreadMessages = messages?.filter(msg => 
      msg.sender_id !== user.id && !msg.is_read
    ) || []

    if (unreadMessages.length > 0) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadMessages.map(msg => msg.id))

      if (updateError) {
        console.error('Error marking messages as read:', updateError)
      }

      // Reset unread count
      const updateField = conversation.buyer_id === user.id 
        ? 'buyer_unread_count' 
        : 'seller_unread_count'
      
      await supabase
        .from('conversations')
        .update({ [updateField]: 0 })
        .eq('id', conversationId)
    }

    return NextResponse.json({ 
      conversation: {
        ...conversation,
        current_user_role: conversation.buyer_id === user.id ? 'buyer' : 'seller'
      },
      messages 
    })
  } catch (error) {
    console.error('Error in GET /api/messages/[conversationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('POST Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('POST Authenticated user:', user.id, 'sending message to conversation:', params.conversationId)

    const conversationId = params.conversationId
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', conversationId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create message
    console.log('Creating message for conversation:', conversationId)
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        sender:sender_id(id, email, profiles(name, avatar_url))
      `)
      .single()

    if (msgError) {
      console.error('Error creating message:', msgError)
      return NextResponse.json({ error: `Failed to send message: ${msgError.message}` }, { status: 500 })
    }

    // Create notification for the recipient
    const recipientId = conversation.buyer_id === user.id 
      ? conversation.seller_id 
      : conversation.buyer_id

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${senderProfile?.name || 'Someone'} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        conversation_id: conversationId
      })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error in POST /api/messages/[conversationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}