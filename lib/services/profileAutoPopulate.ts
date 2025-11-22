import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'

/**
 * Auto-populate profile contact fields from listing/wanted request data
 *
 * This function updates the user's profile with contact information from
 * their listing or wanted request, but ONLY if:
 * 1. The saveToProfile flag is true (user opted in)
 * 2. The profile field is currently empty
 *
 * @param userId - User ID
 * @param phone - Phone number from listing/request (any format)
 * @param whatsapp - WhatsApp number from listing/request (any format, optional)
 * @param saveToProfile - User opt-in preference (default: true)
 * @returns Object with success status and fields updated
 */
export async function autoPopulateProfileContacts(
  userId: string,
  phone: string,
  whatsapp: string | null | undefined,
  saveToProfile: boolean = true
): Promise<{ success: boolean; fieldsUpdated: string[]; error?: string }> {

  // If user opted out, skip
  if (!saveToProfile) {
    console.log('[AUTO-POPULATE] Skipped - saveToProfile disabled')
    return { success: true, fieldsUpdated: [] }
  }

  // Validate inputs
  if (!userId || !phone) {
    console.log('[AUTO-POPULATE] Skipped - missing userId or phone')
    return { success: false, fieldsUpdated: [], error: 'Missing required parameters' }
  }

  try {
    console.log('[AUTO-POPULATE] Starting profile auto-population check')
    console.log('  userId:', userId)
    console.log('  phone input:', phone)
    console.log('  whatsapp input:', whatsapp || 'NOT PROVIDED')

    // Fetch current profile using admin client
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('phone, whatsapp')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('[AUTO-POPULATE] Error fetching profile:', fetchError)
      logger.error('Failed to fetch profile for auto-populate', fetchError as Error, { userId })
      return { success: false, fieldsUpdated: [], error: 'Failed to fetch profile' }
    }

    console.log('[AUTO-POPULATE] Current profile state:')
    console.log('  currentPhone:', profile?.phone || 'EMPTY')
    console.log('  currentWhatsapp:', profile?.whatsapp || 'EMPTY')

    // Normalize phone numbers for storage
    const normalizedPhone = normalizeSriLankaPhone(phone)
    const normalizedWhatsApp = whatsapp ? normalizeSriLankaPhone(whatsapp) : null

    console.log('[AUTO-POPULATE] Normalized values:')
    console.log('  normalizedPhone:', normalizedPhone)
    console.log('  normalizedWhatsApp:', normalizedWhatsApp || 'NULL')

    // Prepare updates
    const profileUpdates: { phone?: string; whatsapp?: string } = {}
    let shouldUpdateProfile = false

    // Update phone if empty in profile
    const phoneIsEmpty = !profile?.phone || profile.phone.trim() === ''
    console.log('[AUTO-POPULATE] Phone check:')
    console.log('  phoneIsEmpty:', phoneIsEmpty)

    if (phoneIsEmpty) {
      profileUpdates.phone = normalizedPhone
      shouldUpdateProfile = true
      console.log('[AUTO-POPULATE] Will update phone field')
      console.log('  normalizedPhone:', normalizedPhone)
    } else {
      console.log('[AUTO-POPULATE] Phone field already populated, skipping')
    }

    // Update whatsapp if empty in profile
    // NOTE: Always update if provided, regardless of whether it equals phone
    // This fixes the bug where "WhatsApp same as phone" prevented updates
    const whatsappIsEmpty = !profile?.whatsapp || profile.whatsapp.trim() === ''
    console.log('[AUTO-POPULATE] WhatsApp check:')
    console.log('  whatsappIsEmpty:', whatsappIsEmpty)
    console.log('  whatsappProvided:', !!normalizedWhatsApp)

    if (whatsappIsEmpty && normalizedWhatsApp) {
      profileUpdates.whatsapp = normalizedWhatsApp
      shouldUpdateProfile = true
      console.log('[AUTO-POPULATE] Will update whatsapp field')
      console.log('  normalizedWhatsApp:', normalizedWhatsApp)
    } else if (!whatsappIsEmpty) {
      console.log('[AUTO-POPULATE] WhatsApp field already populated, skipping')
    } else {
      console.log('[AUTO-POPULATE] WhatsApp not provided, skipping')
    }

    // Perform update if needed
    if (shouldUpdateProfile) {
      console.log('[AUTO-POPULATE] Executing profile update')
      console.log('  updates:', JSON.stringify(profileUpdates))

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)

      if (updateError) {
        console.error('[AUTO-POPULATE] Failed to update profile contact fields')
        console.error('  error:', updateError)
        console.error('  errorCode:', (updateError as any).code)
        console.error('  errorMessage:', updateError.message)

        logger.error('Failed to update profile contact fields', updateError as Error, {
          userId,
          updates: profileUpdates,
          errorCode: (updateError as any).code
        })

        return {
          success: false,
          fieldsUpdated: [],
          error: updateError.message
        }
      }

      const fieldsUpdated = Object.keys(profileUpdates)
      console.log('[AUTO-POPULATE] SUCCESS - Profile contact fields updated')
      console.log('  fields:', JSON.stringify(fieldsUpdated))
      console.log('  values:', JSON.stringify(profileUpdates))

      logger.info('Profile contact fields auto-populated', {
        userId,
        fields: fieldsUpdated,
        values: profileUpdates
      })

      return { success: true, fieldsUpdated }
    } else {
      console.log('[AUTO-POPULATE] No update needed - profile fields already populated')
      return { success: true, fieldsUpdated: [] }
    }

  } catch (error: any) {
    console.error('[AUTO-POPULATE] Unexpected error:', error)
    logger.error('Unexpected error in auto-populate', error as Error, { userId })
    return {
      success: false,
      fieldsUpdated: [],
      error: error?.message || 'Unexpected error'
    }
  }
}
