import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getListings, type ListingStatus } from './utils/getListings'
import ListingsPageClient from './ListingsPageClient'

// Enable ISR with 30-second revalidation
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function ListingsPage({ searchParams }: PageProps) {
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
  const statusFilter = (params.status || 'all') as ListingStatus
  const currentPage = parseInt(params.page || '1')

  // Fetch listings (server-side, filtered, paginated)
  const { listings, totalCount, hasMore } = await getListings(
    user.id,
    statusFilter,
    currentPage,
    20
  )

  return (
    <ListingsPageClient
      listings={listings}
      totalCount={totalCount}
      hasMore={hasMore}
      statusFilter={statusFilter}
      currentPage={currentPage}
    />
  )
}
