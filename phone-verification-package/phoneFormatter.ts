/**
 * Formats phone numbers for display
 * For Sri Lankan numbers: "+94 XX XXX XXXX" format
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

  // 10 digits starting with non-zero
  if (digits.length === 10 && !digits.startsWith('0')) {
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
 */
export function isValidSriLankanPhone(normalizedPhone: string): boolean {
  // Must be exactly 11 digits starting with 94
  return /^94[0-9]{9}$/.test(normalizedPhone)
}

/**
 * Converts normalized phone (94XXXXXXXXX) to E.164 format (+94XXXXXXXXX)
 */
export function toE164(normalizedPhone: string): string {
  if (!normalizedPhone) return ''
  if (normalizedPhone.startsWith('+')) return normalizedPhone
  return `+${normalizedPhone}`
}

/**
 * Formats phone number for storage in database
 */
export function formatPhoneForStorage(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''
  
  const cleanPhone = phone.replace(/\D/g, '')
  
  if (cleanPhone.startsWith(countryCode)) {
    return cleanPhone
  }
  
  const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone
  return `${countryCode}${phoneWithoutZero}`
}

