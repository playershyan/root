import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getFavorites } from './utils/getFavorites'
import FavoritesPageClient from './FavoritesPageClient'

// Enable ISR with 30-second revalidation
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function FavoritesPage({ searchParams }: PageProps) {
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

  // Fetch favorites (server-side, paginated)
  const { favorites, totalCount, hasMore } = await getFavorites(
    user.id,
    currentPage,
    20
  )

  return (
    <FavoritesPageClient
      favorites={favorites}
      totalCount={totalCount}
      hasMore={hasMore}
      currentPage={currentPage}
    />
  )
}
