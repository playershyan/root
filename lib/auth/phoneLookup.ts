/**
 * Phone Lookup Helper - DEPRECATED / UNUSED
 *
 * This file was previously used to lookup users by phone number during login flow.
 * It has been deprecated because:
 *
 * 1. Phone OTP is now only used for phone number updates (not authentication)
 * 2. Authentication flows have been disabled and will be reimplemented using Supabase native providers
 * 3. Login no longer requires phone-based user lookup
 *
 * This file is kept for reference only and should not be imported in active code.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'

interface UserLookupResult {
  user: any | null
  error?: string
}
export async function findUserByPhone(
  adminClient: SupabaseClient,
  phoneNumber: string
): Promise<UserLookupResult> {
  try {
    // Normalize to canonical format
    const normalizedPhone = normalizeSriLankaPhone(phoneNumber)

    if (!normalizedPhone) {
      logger.debug('Invalid phone number format', { phoneNumber })
      return { user: null, error: 'Invalid phone number' }
    }

    logger.debug('Looking up user by phone', {
      original: phoneNumber,
      normalized: normalizedPhone
    })

    const { data, error } = await adminClient.auth.admin.listUsers()
    if (error) {
      logger.error('Error listing users for phone lookup', error as Error, {
        phoneNumber,
        normalizedPhone
      })
      return { user: null, error: 'Failed to list users' }
    }

    const users = data?.users || []

    // Match by canonical format - Supabase Admin API strips + prefix
    // So it stores 94XXXXXXXXX, not +94XXXXXXXXX
    const matchingUser = users.find((user: any) => {
      return user.phone === normalizedPhone
    })

    if (!matchingUser) {
      logger.debug('No auth user found by phone', {
        phoneNumber,
        normalizedPhone,
        totalUsers: users.length
      })
      return { user: null, error: 'User not found' }
    }

    logger.debug('Found user by phone', {
      userId: matchingUser.id,
      phone: matchingUser.phone
    })

    return { user: matchingUser }
  } catch (err) {
    logger.error('Unexpected error in findUserByPhone', err as Error, {
      phoneNumber
    })
    return { user: null, error: 'Lookup failed' }
  }
}


