/**
 * Formats phone numbers to the standard format: [country code] & [phone number excluding the zero]
 * Example: "0771234567" becomes "94 & 771234567" (for Sri Lanka)
 * Example: "+94771234567" becomes "94 & 771234567"
 */

export function formatPhoneDisplay(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // If phone already starts with country code, extract it
  if (cleanPhone.startsWith(countryCode)) {
    const numberWithoutCode = cleanPhone.substring(countryCode.length)
    return `${countryCode} & ${numberWithoutCode}`
  }
  
  // If phone starts with 0, remove it
  const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone
  
  return `${countryCode} & ${phoneWithoutZero}`
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