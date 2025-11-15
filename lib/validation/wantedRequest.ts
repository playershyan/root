/**
 * Validation utilities for wanted request creation and updates
 */

export interface WantedRequestInput {
  title?: string
  description?: string
  min_budget?: number | string
  max_budget?: number | string
  make?: string
  customMake?: string
  model?: string
  customModel?: string
  min_year?: number | string
  max_year?: number | string
  location?: string
  phone?: string
  whatsapp?: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number | string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

const MIN_YEAR = 1990
const MAX_DESCRIPTION_LENGTH = 500

/**
 * Get current year
 */
function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Sanitize string input
 */
function sanitizeString(input: string | undefined | null): string {
  if (!input) return ''
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Sanitize description
 */
function sanitizeDescription(input: string | undefined | null): string {
  if (!input) return ''
  const sanitized = sanitizeString(input)
  return sanitized.substring(0, MAX_DESCRIPTION_LENGTH)
}

/**
 * Validate and convert number input
 */
function parseNumber(value: number | string | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

/**
 * Validate and convert integer input
 */
function parseInteger(value: number | string | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  return isNaN(num) ? null : Math.floor(num)
}

/**
 * Validate Sri Lankan phone number format
 * Accepts: 0XXXXXXXXX (10 digits) or XXXXXXXXX (9 digits without leading 0)
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return false
  // Remove any whitespace and country code prefix
  const cleaned = phone.replace(/^\+94\s?/, '').replace(/\s+/g, '')
  // Sri Lankan phone numbers: exactly 10 digits starting with 0, or 9 digits without 0
  return /^0\d{9}$/.test(cleaned) || /^\d{9}$/.test(cleaned)
}

/**
 * Validate wanted request input
 */
export function validateWantedRequest(input: WantedRequestInput): ValidationResult {
  const errors: Record<string, string> = {}
  const currentYear = getCurrentYear()

  // Title/Make validation
  const actualMake = input.make === 'Other' ? input.customMake : input.make
  if (!actualMake || !sanitizeString(actualMake)) {
    errors.make = 'Vehicle make is required'
  } else if (sanitizeString(actualMake).length < 2) {
    errors.make = 'Make name must be at least 2 characters'
  } else if (sanitizeString(actualMake).length > 100) {
    errors.make = 'Make name must be less than 100 characters'
  }

  // Model validation
  const actualModel = input.model === 'Other' ? input.customModel : input.model
  if (!actualModel || !sanitizeString(actualModel)) {
    errors.model = 'Vehicle model is required'
  } else if (sanitizeString(actualModel).length < 2) {
    errors.model = 'Model name must be at least 2 characters'
  } else if (sanitizeString(actualModel).length > 100) {
    errors.model = 'Model name must be less than 100 characters'
  }

  // Budget validation
  const minBudget = parseNumber(input.min_budget)
  const maxBudget = parseNumber(input.max_budget)

  if (minBudget === null) {
    errors.min_budget = 'Minimum budget is required'
  } else if (minBudget < 0) {
    errors.min_budget = 'Budget cannot be negative'
  } else if (minBudget > 1000000000) {
    errors.min_budget = 'Budget exceeds maximum allowed value'
  }

  if (maxBudget === null) {
    errors.max_budget = 'Maximum budget is required'
  } else if (maxBudget < 0) {
    errors.max_budget = 'Budget cannot be negative'
  } else if (maxBudget > 1000000000) {
    errors.max_budget = 'Budget exceeds maximum allowed value'
  }

  if (minBudget !== null && maxBudget !== null && minBudget > maxBudget) {
    errors.max_budget = 'Maximum budget must be greater than minimum budget'
  }

  // Year validation
  const minYear = parseInteger(input.min_year)
  const maxYear = parseInteger(input.max_year)

  if (minYear === null) {
    errors.min_year = 'Minimum year is required'
  } else if (minYear < MIN_YEAR) {
    errors.min_year = `Year cannot be earlier than ${MIN_YEAR}`
  } else if (minYear > currentYear) {
    errors.min_year = `Year cannot be later than ${currentYear}`
  }

  if (maxYear === null) {
    errors.max_year = 'Maximum year is required'
  } else if (maxYear < MIN_YEAR) {
    errors.max_year = `Year cannot be earlier than ${MIN_YEAR}`
  } else if (maxYear > currentYear) {
    errors.max_year = `Year cannot be later than ${currentYear}`
  }

  if (minYear !== null && maxYear !== null && minYear > maxYear) {
    errors.max_year = 'Maximum year must be greater than or equal to minimum year'
  }

  // Phone validation
  if (!input.phone || !sanitizeString(input.phone)) {
    errors.phone = 'Phone number is required'
  } else if (!isValidPhone(input.phone)) {
    errors.phone = 'Invalid phone number format'
  }

  // Location validation (optional but if provided, validate format)
  if (input.location && sanitizeString(input.location).length > 255) {
    errors.location = 'Location must be less than 255 characters'
  }

  // Description validation (optional)
  if (input.description && sanitizeDescription(input.description).length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
  }

  // Fuel type validation
  if (input.fuel_type && !['Petrol', 'Diesel', 'Hybrid', 'Electric'].includes(input.fuel_type)) {
    errors.fuel_type = 'Invalid fuel type'
  }

  // Transmission validation
  if (input.transmission && !['Automatic', 'Manual'].includes(input.transmission)) {
    errors.transmission = 'Invalid transmission type'
  }

  // Max mileage validation (optional)
  if (input.max_mileage !== undefined && input.max_mileage !== null && input.max_mileage !== '') {
    const mileage = parseInteger(input.max_mileage)
    if (mileage !== null && mileage < 0) {
      errors.max_mileage = 'Mileage cannot be negative'
    } else if (mileage !== null && mileage > 1000000) {
      errors.max_mileage = 'Mileage exceeds maximum allowed value'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize wanted request input
 */
export function sanitizeWantedRequest(input: WantedRequestInput): WantedRequestInput {
  return {
    title: sanitizeString(input.title),
    description: sanitizeDescription(input.description),
    make: sanitizeString(input.make),
    customMake: sanitizeString(input.customMake),
    model: sanitizeString(input.model),
    customModel: sanitizeString(input.customModel),
    location: sanitizeString(input.location),
    phone: sanitizeString(input.phone),
    whatsapp: sanitizeString(input.whatsapp) || undefined,
    fuel_type: sanitizeString(input.fuel_type) || undefined,
    transmission: sanitizeString(input.transmission) || undefined,
    // Numbers are parsed and validated, not sanitized
    min_budget: input.min_budget,
    max_budget: input.max_budget,
    min_year: input.min_year,
    max_year: input.max_year,
    max_mileage: input.max_mileage
  }
}

/**
 * Format phone number to Sri Lankan international format
 * Input: 0XXXXXXXXX or XXXXXXXXX
 * Output: +94 XX XXX XXXX
 */
export function formatPhoneNumber(phone: string, countryCode: string = '94'): string {
  if (!phone) return ''

  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')

  let formattedPhone = cleanPhone

  // Remove leading 0 if present
  if (formattedPhone.startsWith('0')) {
    formattedPhone = formattedPhone.substring(1)
  }

  // Format as +94 XX XXX XXXX
  if (formattedPhone.length >= 9) {
    const areaCode = formattedPhone.substring(0, 2)
    const firstPart = formattedPhone.substring(2, 5)
    const secondPart = formattedPhone.substring(5, 9)
    return `+94 ${areaCode} ${firstPart} ${secondPart}`
  }

  return `+94 ${formattedPhone}`
}

/**
 * Generate title from make, model, and year
 */
export function generateWantedRequestTitle(input: WantedRequestInput): string {
  const actualMake = input.make === 'Other' ? input.customMake : input.make
  const actualModel = input.model === 'Other' ? input.customModel : input.model
  
  const makeModel = [actualMake, actualModel].filter(Boolean).join(' ')
  
  const minYear = parseInteger(input.min_year)
  const maxYear = parseInteger(input.max_year)
  
  let yearRange = ''
  if (minYear && maxYear) {
    yearRange = ` ${minYear}-${maxYear}`
  } else if (minYear) {
    yearRange = ` ${minYear} onwards`
  } else if (maxYear) {
    yearRange = ` up to ${maxYear}`
  }
  
  return `${makeModel}${yearRange}`.trim()
}

