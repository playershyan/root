import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getBinItems } from './utils/getBinItems'
import BinPageClient from './BinPageClient'

// Enable ISR with 30-second revalidation
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function BinPage({ searchParams }: PageProps) {
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
  const currentPage = parseInt(params.page || '1')

  // Fetch bin items (server-side, paginated)
  const { items, totalCount, hasMore } = await getBinItems(
    user.id,
    currentPage,
    20
  )

  return (
    <BinPageClient
      items={items}
      totalCount={totalCount}
      hasMore={hasMore}
      currentPage={currentPage}
    />
  )
}
