/**
 * Messaging Authentication Layer
 * Handles user authentication and authorization for messaging operations
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { User } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  id: string
  email?: string
  user_metadata?: any
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: string | null
}

/**
 * Get authenticated user from request context
 * Provides consistent authentication across all messaging endpoints
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Authentication error:', error)
      return { user: null, error: 'Authentication failed' }
    }

    if (!user) {
      return { user: null, error: 'User not authenticated' }
    }

    // Return simplified user object
    return {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      },
      error: null
    }
  } catch (error) {
    console.error('Auth system error:', error)
    return { user: null, error: 'Authentication system error' }
  }
}

/**
 * Verify user has access to a specific conversation
 */
export async function verifyConversationAccess(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data, error } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single()

    if (error || !data) {
      return false
    }

    return data.buyer_id === userId || data.seller_id === userId
  } catch (error) {
    console.error('Conversation access verification error:', error)
    return false
  }
}

/**
 * Get user's role in a conversation (buyer or seller)
 */
export async function getUserConversationRole(
  conversationId: string,
  userId: string
): Promise<'buyer' | 'seller' | null> {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data, error } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single()

    if (error || !data) {
      return null
    }

    if (data.buyer_id === userId) return 'buyer'
    if (data.seller_id === userId) return 'seller'
    return null
  } catch (error) {
    console.error('User role verification error:', error)
    return null
  }
}