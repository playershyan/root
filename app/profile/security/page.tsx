import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getSecurityInfo } from './utils/getSecurityInfo'
import SecurityPageClient from './SecurityPageClient'

// Enable ISR with 60-second revalidation
export const revalidate = 60

export default async function SecurityPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { security } = await getSecurityInfo(user.id)

  return <SecurityPageClient user={user} security={security} />
}
