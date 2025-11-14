import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getBusinessProfile } from './utils/getBusinessProfile'
import BusinessPageClient from './BusinessPageClient'

// Enable ISR with 60-second revalidation
export const revalidate = 60

export default async function BusinessPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { profile, hasProfile } = await getBusinessProfile(user.id)

  return (
    <BusinessPageClient 
      profile={profile}
      hasProfile={hasProfile}
    />
  )
}
