import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

interface DashboardRequestContext {
  userId: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const context: DashboardRequestContext = { userId: user.id }
    const requestStart = Date.now()
    logger.api.request('GET', '/api/user/dashboard', context)

    const favoritesPromise = supabase
      .from('favorites')
      .select(
        `
          listing_id,
          created_at,
          listings (
            id,
            title,
            price,
            location,
            image_url,
            image_urls,
            created_at
          )
        `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const conversationsPromise = supabase
      .from('conversation_details')
      .select(
        `
          id,
          listing_id,
          listing_title,
          listing_price,
          listing_image_url,
          buyer_id,
          seller_id,
          last_message_at,
          last_message_preview,
          buyer_unread_count,
          seller_unread_count,
          buyer_archived,
          seller_archived,
          buyer_name,
          buyer_avatar_url,
          seller_name,
          seller_avatar_url
        `,
        { count: 'exact' }
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
      .limit(5)

    const wantedPromise = supabase
      .from('wanted_requests')
      .select('status, is_active, new_matches_count')
      .eq('user_id', user.id)
      .neq('status', 'deleted')

    const matchNotificationPromise = supabase
      .from('listing_wanted_notifications')
      .select('*', { count: 'exact', head: true })
      .is('dismissed_at', null)

    const [
      { data: favoriteRows, count: favoritesCount, error: favoritesError },
      { data: conversationRows, count: conversationCount, error: conversationsError },
      { data: wantedRows, error: wantedError },
      { count: activeMatchNotifications, error: matchNotificationsError }
    ] = await Promise.all([
      favoritesPromise,
      conversationsPromise,
      wantedPromise,
      matchNotificationPromise
    ])

    if (favoritesError) {
      logger.error('Dashboard favorites query failed', favoritesError as Error, context)
    }

    if (conversationsError) {
      logger.error('Dashboard conversations query failed', conversationsError as Error, context)
    }

    if (wantedError) {
      logger.error('Dashboard wanted requests query failed', wantedError as Error, context)
    }

    if (matchNotificationsError) {
      logger.error(
        'Dashboard match notifications query failed',
        matchNotificationsError as Error,
        context
      )
    }

    const recentFavorites =
      favoriteRows
        ?.map(fav => {
          const listing = fav.listings
          if (!listing) return null
          return {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            location: listing.location,
            imageUrl: listing.image_urls?.[0] || listing.image_url || null,
            favoritedAt: fav.created_at
          }
        })
        .filter(Boolean) ?? []

    const messagingStats = {
      unreadMessages: 0,
      unreadConversations: 0,
      recent: [] as Array<{
        id: string
        listingTitle: string
        listingPrice: number
        listingImageUrl: string | null
        lastMessageAt: string | null
        lastMessagePreview: string | null
        unreadCount: number
        participant: {
          role: 'buyer' | 'seller'
          name: string
          avatarUrl: string | null
        }
      }>
    }

    if (conversationRows) {
      conversationRows.forEach(conv => {
        const isBuyer = conv.buyer_id === user.id
        const unread = isBuyer ? conv.buyer_unread_count ?? 0 : conv.seller_unread_count ?? 0
        if (unread > 0) {
          messagingStats.unreadMessages += unread
          messagingStats.unreadConversations += 1
        }

        messagingStats.recent.push({
          id: conv.id,
          listingTitle: conv.listing_title,
          listingPrice: conv.listing_price,
          listingImageUrl: conv.listing_image_url,
          lastMessageAt: conv.last_message_at,
          lastMessagePreview: conv.last_message_preview,
          unreadCount: unread,
          participant: {
            role: isBuyer ? 'seller' : 'buyer',
            name: isBuyer ? conv.seller_name || 'Unknown User' : conv.buyer_name || 'Unknown User',
            avatarUrl: isBuyer ? conv.seller_avatar_url : conv.buyer_avatar_url
          }
        })
      })
    }

    const wantedStats = {
      total: 0,
      active: 0,
      pending: 0,
      paused: 0,
      closed: 0,
      totalNewMatches: 0
    }

    if (wantedRows) {
      wantedRows.forEach(req => {
        wantedStats.total += 1
        const status = (req.status || '').toLowerCase()
        switch (status) {
          case 'active':
            wantedStats.active += 1
            break
          case 'pending':
            wantedStats.pending += 1
            break
          case 'paused':
            wantedStats.paused += 1
            break
          case 'closed':
          case 'archived':
            wantedStats.closed += 1
            break
          default:
            break
        }

        if (typeof req.new_matches_count === 'number') {
          wantedStats.totalNewMatches += req.new_matches_count
        }
      })
    }

    const responsePayload = {
      favorites: {
        total: favoritesCount ?? recentFavorites.length,
        recent: recentFavorites
      },
      messaging: {
        total: conversationCount ?? messagingStats.recent.length,
        unreadMessages: messagingStats.unreadMessages,
        unreadConversations: messagingStats.unreadConversations,
        recent: messagingStats.recent
      },
      wantedRequests: wantedStats,
      notifications: {
        activeMatchNotifications: activeMatchNotifications ?? 0
      }
    }

    logger.api.success('GET', '/api/user/dashboard', Date.now() - requestStart, {
      ...context,
      favorites: responsePayload.favorites.total,
      conversations: responsePayload.messaging.total
    })

    return NextResponse.json(responsePayload)
  } catch (error) {
    logger.error('GET /api/user/dashboard failed', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

