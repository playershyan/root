import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    let channel: any

    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUnreadCount(0)
        return
      }

      // Fetch unread count from conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('buyer_unread_count, seller_unread_count, buyer_id, seller_id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .eq('is_active', true)

      if (conversations) {
        const total = conversations.reduce((sum, conv) => {
          const count = conv.buyer_id === user.id 
            ? conv.buyer_unread_count 
            : conv.seller_unread_count
          return sum + (count || 0)
        }, 0)
        setUnreadCount(total)
      }
    }

    // Initial fetch
    fetchUnreadCount()

    // Set up real-time subscription
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Subscribe to both buyer and seller conversations separately
        channel = supabase
          .channel(`unread-${user.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `buyer_id=eq.${user.id}`
          }, () => {
            fetchUnreadCount()
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `seller_id=eq.${user.id}`
          }, () => {
            fetchUnreadCount()
          })
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'messages'
          }, () => {
            fetchUnreadCount()
          })
          .subscribe()
      }
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  return unreadCount
}