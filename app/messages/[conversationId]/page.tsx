import { redirect, notFound } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import ConversationThreadClient from './ConversationThreadClient'
import { getConversationThread } from '../utils/getConversationThread'

export const revalidate = 0

interface ConversationPageProps {
  params: {
    conversationId: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const thread = await getConversationThread(user.id, params.conversationId)

  if (!thread) {
    notFound()
  }

  return (
    <ConversationThreadClient
      conversation={thread.conversation}
      initialMessages={thread.messages}
      currentUserId={user.id}
      initialHasMore={thread.hasMore}
      initialCursor={thread.nextCursor}
    />
  )
}

