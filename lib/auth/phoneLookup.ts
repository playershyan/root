import { SupabaseClient } from '@supabase/supabase-js'
import { normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'

interface UserLookupResult {
  user: any | null
  error?: string
}

/**
 * Helper to find a Supabase auth user by phone number using the admin client.
 *
 * - Normalizes the input phone to canonical format (94XXXXXXXXX)
 * - Converts to E.164 format for Supabase auth lookup (+94XXXXXXXXX)
 * - Matches ONLY E.164 format in auth.users table (standardized format)
 */
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

    // Convert to E.164 for Supabase auth lookup
    const e164 = `+${normalizedPhone}` // +94XXXXXXXXX

    logger.debug('Looking up user by phone', {
      original: phoneNumber,
      normalized: normalizedPhone,
      e164
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

    // Match ONLY by E.164 format - standardized phone storage
    const matchingUser = users.find((user: any) => {
      return user.phone === e164
    })

    if (!matchingUser) {
      logger.debug('No auth user found by phone', {
        phoneNumber,
        normalizedPhone,
        e164,
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


