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