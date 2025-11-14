import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getUserWantedRequests, type WantedRequestStatus } from './utils/getWantedRequests'
import WantedPageClient from './WantedPageClient'

// Enable ISR with 30-second revalidation
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function WantedPage({ searchParams }: PageProps) {
  // Get authenticated user
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Parse URL parameters
  const params = await searchParams
  const statusFilter = (params.status || 'all') as WantedRequestStatus
  const currentPage = parseInt(params.page || '1')

  // Fetch wanted requests (server-side, filtered, paginated)
  const { requests, totalCount, hasMore } = await getUserWantedRequests(
    user.id,
    statusFilter,
    currentPage,
    20
  )

  return (
    <WantedPageClient
      requests={requests}
      totalCount={totalCount}
      hasMore={hasMore}
      statusFilter={statusFilter}
      currentPage={currentPage}
    />
  )
}
