import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getNotifications } from './utils/getNotifications'
import NotificationsPageClient from './NotificationsPageClient'

// Enable ISR with 10-second revalidation (more frequent for notifications)
export const revalidate = 10

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
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

  const { notifications, unreadCount, totalCount, hasMore } = await getNotifications(
    user.id,
    currentPage,
    20
  )

  return (
    <NotificationsPageClient
      notifications={notifications}
      unreadCount={unreadCount}
      totalCount={totalCount}
      hasMore={hasMore}
      currentPage={currentPage}
    />
  )
}
