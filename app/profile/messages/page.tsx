import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getConversations } from './utils/getConversations'
import MessagesPageClient from './MessagesPageClient'

// Enable ISR with 10-second revalidation (more frequent for messages)
export const revalidate = 10

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function MessagesPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const currentPage = parseInt(params.page || '1')

  const { conversations, totalCount, unreadCount, hasMore } = await getConversations(
    user.id,
    currentPage,
    20
  )

  return (
    <MessagesPageClient
      conversations={conversations}
      totalCount={totalCount}
      unreadCount={unreadCount}
      hasMore={hasMore}
      currentPage={currentPage}
    />
  )
}
