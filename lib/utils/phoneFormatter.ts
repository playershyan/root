/**
 * Formats phone numbers for display
 * For Sri Lankan numbers: "+94 XX XXX XXXX" format
 * For other countries: "+[code] [number]"
 * Example: "0771234567" becomes "+94 77 123 4567" (for Sri Lanka)
 * Example: "+94771234567" becomes "+94 77 123 4567"
 */

export function formatPhoneDisplay(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Extract the phone number without country code
  let phoneWithoutCode: string
  
  if (cleanPhone.startsWith(countryCode)) {
    phoneWithoutCode = cleanPhone.substring(countryCode.length)
  } else if (cleanPhone.startsWith('0')) {
    phoneWithoutCode = cleanPhone.substring(1)
  } else {
    phoneWithoutCode = cleanPhone
  }
  
  // Format based on country
  if (countryCode === '94') {
    // Sri Lankan formatting: +94 XX XXX XXXX
    if (phoneWithoutCode.length >= 9) {
      const areaCode = phoneWithoutCode.substring(0, 2)
      const firstPart = phoneWithoutCode.substring(2, 5)
      const secondPart = phoneWithoutCode.substring(5, 9)
      return `+94 ${areaCode} ${firstPart} ${secondPart}`
    }
    return `+94 ${phoneWithoutCode}`
  } else {
    // Other countries: just combine with space
    return `+${countryCode} ${phoneWithoutCode}`
  }
}

/**
 * Normalizes a Sri Lankan phone number to a canonical storage format.
 *
 * Returns digits only, always starting with country code 94, e.g.:
 * - "0771234567"   -> "94771234567"
 * - "771234567"    -> "94771234567"
 * - "+94771234567" -> "94771234567"
 * - "94771234567"  -> "94771234567"
 *
 * CANONICAL FORMAT: 94XXXXXXXXX (11 digits total, no plus, no leading zero)
 * This is the SINGLE SOURCE OF TRUTH for all phone normalization.
 */
export function normalizeSriLankaPhone(input: string): string {
  if (!input) return ''

  // Keep digits only
  const digits = input.replace(/\D/g, '')

  if (!digits) return ''

  // Already in canonical format: 94XXXXXXXXX (11 digits)
  if (digits.startsWith('94') && digits.length === 11) {
    return digits
  }

  // Starts with 0 -> remove leading 0 and prepend 94
  if (digits.startsWith('0') && digits.length === 10) {
    return `94${digits.substring(1)}`
  }

  // Just 9 digits (mobile without prefix) -> prepend 94
  if (digits.length === 9 && !digits.startsWith('0')) {
    return `94${digits}`
  }

  // Already has 94 but wrong length -> try to extract 9 digits after 94
  if (digits.startsWith('94') && digits.length > 11) {
    return digits.substring(0, 11)
  }

  // 10 digits starting with non-zero (possibly already has partial prefix)
  if (digits.length === 10 && !digits.startsWith('0')) {
    // Could be 94XXXXXXXX (missing one digit) or country code + 9 digits
    // Assume it's missing the last digit of country code
    return `94${digits.substring(2)}`
  }

  // As a last resort, if we have at least 9 digits, take the last 9 and prepend 94
  if (digits.length >= 9) {
    const lastNine = digits.substring(digits.length - 9)
    return `94${lastNine}`
  }

  // Invalid - return empty to trigger validation error
  return ''
}

/**
 * Validates that a phone number is in correct format.
 * Use AFTER normalization to verify the result is valid.
 *
 * @param normalizedPhone - Phone number that has been through normalizeSriLankaPhone()
 * @returns true if valid Sri Lankan phone number in canonical format
 */
export function isValidSriLankanPhone(normalizedPhone: string): boolean {
  // Must be exactly 11 digits starting with 94
  return /^94[0-9]{9}$/.test(normalizedPhone)
}

/**
 * Converts normalized phone (94XXXXXXXXX) to E.164 format (+94XXXXXXXXX)
 * Use this before all Supabase auth API calls.
 *
 * @param normalizedPhone - Phone in canonical format (94XXXXXXXXX)
 * @returns E.164 format (+94XXXXXXXXX)
 */
export function toE164(normalizedPhone: string): string {
  if (!normalizedPhone) return ''
  // If already has +, return as-is
  if (normalizedPhone.startsWith('+')) return normalizedPhone
  // Add + prefix
  return `+${normalizedPhone}`
}

/**
 * Formats phone number for WhatsApp URL
 * Removes spaces and ensures country code is present
 */
export function formatPhoneForWhatsApp(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // If already has country code
  if (cleanPhone.startsWith(countryCode)) {
    return cleanPhone
  }
  
  // Remove leading zero if present and add country code
  const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone
  return `${countryCode}${phoneWithoutZero}`
}

/**
 * Formats phone number for storage in database
 * Stores as: country code + number without zero
 */
export function formatPhoneForStorage(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // If already has country code
  if (cleanPhone.startsWith(countryCode)) {
    return cleanPhone
  }
  
  // Remove leading zero if present and add country code
  const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone
  return `${countryCode}${phoneWithoutZero}`
}

/**
 * Formats phone number for tel: links
 */
export function formatPhoneForTel(phone: string, countryCode: string = '94'): string {
  const formatted = formatPhoneForStorage(phone, countryCode)
  return `+${formatted}`
}

/**
 * Parses a stored phone number back to display format with country code separated
 */
export function parseStoredPhone(phone: string): { countryCode: string; number: string } {
  if (!phone) return { countryCode: '', number: '' }
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Try to detect country code (assuming 1-3 digits)
  // Sri Lanka = 94, US = 1, UK = 44, etc.
  if (cleanPhone.startsWith('94')) {
    return { countryCode: '94', number: cleanPhone.substring(2) }
  } else if (cleanPhone.startsWith('1')) {
    // US/Canada
    return { countryCode: '1', number: cleanPhone.substring(1) }
  } else if (cleanPhone.startsWith('44')) {
    // UK
    return { countryCode: '44', number: cleanPhone.substring(2) }
  } else if (cleanPhone.startsWith('91')) {
    // India
    return { countryCode: '91', number: cleanPhone.substring(2) }
  }
  
  // Default to treating first 2 digits as country code
  if (cleanPhone.length > 10) {
    return { countryCode: cleanPhone.substring(0, 2), number: cleanPhone.substring(2) }
  }
  
  // If no country code detected, return as is
  return { countryCode: '', number: cleanPhone }
}