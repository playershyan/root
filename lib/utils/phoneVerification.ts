/**
 * Helper utilities for phone verification
 */

/**
 * Check if phone number has changed
 */
export function checkPhoneChanged(oldPhone: string | null | undefined, newPhone: string | null | undefined): boolean {
  if (!oldPhone && !newPhone) return false
  if (!oldPhone || !newPhone) return true
  
  // Normalize both numbers for comparison (remove spaces, dashes, etc.)
  const normalizePhone = (phone: string) => phone.replace(/[\s\-\(\)]/g, '').replace(/^\+94/, '94').replace(/^0/, '94')
  
  const normalizedOld = normalizePhone(oldPhone)
  const normalizedNew = normalizePhone(newPhone)
  
  return normalizedOld !== normalizedNew
}

/**
 * Format phone number for verification display
 */
export function formatPhoneForVerification(phone: string): string {
  if (!phone) return ''
  
  // Remove any non-digit characters
  const clean = phone.replace(/\D/g, '')
  
  // Format as +94 XX XXX XXXX for display
  if (clean.startsWith('94')) {
    const rest = clean.substring(2)
    if (rest.length >= 9) {
      return `+94 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 9)}`
    }
    return `+94 ${rest}`
  }
  
  if (clean.startsWith('0')) {
    const rest = clean.substring(1)
    if (rest.length >= 9) {
      return `+94 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5, 9)}`
    }
    return `+94 ${rest}`
  }
  
  return phone
}

/**
 * Check if phone number format is valid for Sri Lanka
 */
export function isValidSriLankanPhone(phone: string): boolean {
  if (!phone) return false
  
  const clean = phone.replace(/\D/g, '')
  
  // Must be 10 digits (with leading 0) or 9 digits (without leading 0)
  if (clean.length === 10 && clean.startsWith('0')) {
    return /^0\d{9}$/.test(clean)
  }
  
  if (clean.length === 9) {
    return /^\d{9}$/.test(clean)
  }
  
  // Check if it includes country code
  if (clean.length === 11 && clean.startsWith('94')) {
    return /^94\d{9}$/.test(clean)
  }
  
  return false
}

