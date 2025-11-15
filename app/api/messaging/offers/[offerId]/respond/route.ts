import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { action, responseMessage } = await request.json()
    if (!['accepted', 'declined'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('id, conversation_id, sender_id, status, message_id')
      .eq('id', params.offerId)
      .single()

    if (offerError || !offer) {
      logger.error('Offer respond - offer not found', offerError as Error, { offerId: params.offerId })
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', offer.conversation_id)
      .single()

    if (conversationError || !conversation) {
      logger.error('Offer respond - conversation missing', conversationError as Error, {
        offerId: offer.id,
        conversationId: offer.conversation_id
      })
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.seller_id !== user.id) {
      return NextResponse.json({ error: 'Only the listing owner can respond to offers' }, { status: 403 })
    }

    if (offer.status === action) {
      return NextResponse.json({ success: true, status: action })
    }

    const { data: updatedOffer, error: updateOfferError } = await supabase
      .from('offers')
      .update({
        status: action,
        response_message: responseMessage || null,
        responded_at: new Date().toISOString(),
        responded_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', offer.id)
      .select('id, status, message_id, response_message, responded_at')
      .single()

    if (updateOfferError || !updatedOffer) {
      logger.error('Offer respond - failed to update offer', updateOfferError as Error, { offerId: offer.id })
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    if (updatedOffer.message_id) {
      const { data: messageRecord, error: messageFetchError } = await supabase
        .from('messages')
        .select('offer_data')
        .eq('id', updatedOffer.message_id)
        .single()

      if (messageFetchError) {
        logger.error('Offer respond - failed to fetch message', messageFetchError as Error, {
          offerId: offer.id,
          messageId: updatedOffer.message_id
        })
      } else if (messageRecord?.offer_data) {
        const updatedOfferData = {
          ...messageRecord.offer_data,
          status: action,
          responseMessage: responseMessage || null,
          respondedAt: updatedOffer.responded_at
        }

        const { error: messageUpdateError } = await supabase
          .from('messages')
          .update({
            offer_data: updatedOfferData,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedOffer.message_id)

        if (messageUpdateError) {
          logger.error('Offer respond - failed to update message offer data', messageUpdateError as Error, {
            messageId: updatedOffer.message_id,
            offerId: offer.id
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: action,
      offerId: offer.id
    })
  } catch (error) {
    logger.error('Offer respond - unexpected error', error as Error, { offerId: params.offerId })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

