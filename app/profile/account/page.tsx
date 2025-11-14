import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAccountInfo } from './utils/getAccountInfo'
import AccountPageClient from './AccountPageClient'

// Enable ISR with 60-second revalidation
export const revalidate = 60

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { profile, preferences, stats, email } = await getAccountInfo(user.id)

  return (
    <AccountPageClient 
      initialProfile={profile}
      stats={stats}
      email={email}
    />
  )
}
