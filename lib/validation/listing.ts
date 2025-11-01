/**
 * Validation utilities for listing creation and updates
 */

export interface ListingInput {
  title?: string
  description?: string
  details?: string
  vehicleType?: string
  make?: string
  customMake?: string
  model?: string
  customModel?: string
  year?: number | string
  mileage?: number | string
  condition?: string
  fuelType?: string
  transmission?: string
  bodyType?: string
  color?: string
  engineCapacity?: number | string
  trim?: string
  grade?: string
  price?: number | string
  pricingType?: 'cash' | 'finance'
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: number | string
  monthlyPayment?: number | string
  remainingTerm?: string
  askingPrice?: number | string
  district?: string
  city?: string
  location?: string
  phone?: string
  whatsapp?: string
  email?: string
  imageUrls?: string[]
  interiorColor?: string
  registrationYear?: number | string
  vehicleConditionDetails?: string
  previousOwners?: number | string
  serviceRecordsAvailable?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

const MIN_YEAR = 1990
const MAX_YEAR = new Date().getFullYear() + 1 // Allow next year models
const MAX_DESCRIPTION_LENGTH = 5000
const MAX_TITLE_LENGTH = 255
const MIN_PRICE = 0
const MAX_PRICE = 1000000000 // 1 billion
const MAX_MILEAGE = 10000000 // 10 million km
const MIN_ENGINE_CAPACITY = 50
const MAX_ENGINE_CAPACITY = 10000 // 10L

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
 * Validate phone number format
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return false
  // Remove country code prefix if present
  const cleaned = phone.replace(/^\+94\s?/, '').replace(/\s+/g, '')
  // Sri Lankan phone numbers: 9 digits after removing leading 0
  return /^\d{9}$/.test(cleaned) || /^0\d{9}$/.test(cleaned)
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate listing input
 */
export function validateListing(input: ListingInput): ValidationResult {
  const errors: Record<string, string> = {}
  const currentYear = getCurrentYear()

  // Title validation
  if (!input.title || !sanitizeString(input.title)) {
    errors.title = 'Title is required'
  } else {
    const title = sanitizeString(input.title)
    if (title.length < 5) {
      errors.title = 'Title must be at least 5 characters'
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`
    }
  }

  // Vehicle Type validation
  if (!input.vehicleType || !sanitizeString(input.vehicleType)) {
    errors.vehicleType = 'Vehicle type is required'
  }

  // Make validation
  const actualMake = input.make === 'Other' ? input.customMake : input.make
  if (!actualMake || !sanitizeString(actualMake)) {
    errors.make = 'Vehicle make is required'
  } else {
    const make = sanitizeString(actualMake)
    if (make.length < 2) {
      errors.make = 'Make name must be at least 2 characters'
    } else if (make.length > 100) {
      errors.make = 'Make name must be less than 100 characters'
    }
  }

  // Model validation
  const actualModel = input.model === 'Other' ? input.customModel : input.model
  if (!actualModel || !sanitizeString(actualModel)) {
    errors.model = 'Vehicle model is required'
  } else {
    const model = sanitizeString(actualModel)
    if (model.length < 2) {
      errors.model = 'Model name must be at least 2 characters'
    } else if (model.length > 100) {
      errors.model = 'Model name must be less than 100 characters'
    }
  }

  // Year validation
  const year = parseInteger(input.year)
  if (year === null) {
    errors.year = 'Year is required'
  } else if (year < MIN_YEAR) {
    errors.year = `Year cannot be earlier than ${MIN_YEAR}`
  } else if (year > MAX_YEAR) {
    errors.year = `Year cannot be later than ${MAX_YEAR}`
  }

  // Mileage validation (optional but if provided, must be valid)
  if (input.mileage !== undefined && input.mileage !== null && input.mileage !== '') {
    const mileage = parseInteger(input.mileage)
    if (mileage === null) {
      errors.mileage = 'Invalid mileage format'
    } else if (mileage < 0) {
      errors.mileage = 'Mileage cannot be negative'
    } else if (mileage > MAX_MILEAGE) {
      errors.mileage = `Mileage exceeds maximum allowed value (${MAX_MILEAGE.toLocaleString()} km)`
    }
  }

  // Price validation
  const price = parseNumber(input.price)
  if (price === null) {
    errors.price = 'Price is required'
  } else if (price < MIN_PRICE) {
    errors.price = 'Price cannot be negative'
  } else if (price > MAX_PRICE) {
    errors.price = `Price exceeds maximum allowed value (Rs. ${MAX_PRICE.toLocaleString()})`
  }

  // Finance validation (if pricingType is 'finance')
  if (input.pricingType === 'finance') {
    if (!input.financeType || !sanitizeString(input.financeType)) {
      errors.financeType = 'Finance type is required'
    }

    if (!input.outstandingBalance) {
      errors.outstandingBalance = 'Outstanding balance is required'
    } else {
      const balance = parseNumber(input.outstandingBalance)
      if (balance === null || balance < 0) {
        errors.outstandingBalance = 'Outstanding balance must be a valid positive number'
      }
    }

    if (!input.askingPrice) {
      errors.askingPrice = 'Asking price is required'
    } else {
      const askingPrice = parseNumber(input.askingPrice)
      if (askingPrice === null || askingPrice < 0) {
        errors.askingPrice = 'Asking price must be a valid positive number'
      }
    }

    if (!input.monthlyPayment) {
      errors.monthlyPayment = 'Monthly payment is required'
    } else {
      const monthly = parseNumber(input.monthlyPayment)
      if (monthly === null || monthly < 0) {
        errors.monthlyPayment = 'Monthly payment must be a valid positive number'
      }
    }

    if (!input.remainingTerm || !sanitizeString(input.remainingTerm)) {
      errors.remainingTerm = 'Remaining term is required'
    }
  }

  // Location validation
  if (!input.district || !sanitizeString(input.district)) {
    errors.district = 'District is required'
  }

  if (!input.city || !sanitizeString(input.city)) {
    errors.city = 'City is required'
  }

  // Description validation (optional but if provided, validate length)
  if (input.description && sanitizeDescription(input.description).length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`
  }

  // Phone validation
  if (!input.phone || !sanitizeString(input.phone)) {
    errors.phone = 'Phone number is required'
  } else if (!isValidPhone(input.phone)) {
    errors.phone = 'Invalid phone number format'
  }

  // WhatsApp validation (optional but if provided, must be valid)
  if (input.whatsapp && !isValidPhone(input.whatsapp)) {
    errors.whatsapp = 'Invalid WhatsApp number format'
  }

  // Email validation (optional but if provided, must be valid)
  if (input.email && !isValidEmail(input.email)) {
    errors.email = 'Invalid email format'
  }

  // Fuel type validation (if provided)
  if (input.fuelType && !['Petrol', 'Diesel', 'Hybrid', 'Electric'].includes(input.fuelType)) {
    errors.fuelType = 'Invalid fuel type'
  }

  // Transmission validation (if provided)
  if (input.transmission && !['Automatic', 'Manual'].includes(input.transmission)) {
    errors.transmission = 'Invalid transmission type'
  }

  // Condition validation
  if (!input.condition || !sanitizeString(input.condition)) {
    errors.condition = 'Vehicle condition is required'
  } else if (!['New', 'Used', 'Refurbished'].includes(input.condition)) {
    errors.condition = 'Invalid condition value'
  }

  // Engine capacity validation (optional but if provided, must be valid)
  if (input.engineCapacity !== undefined && input.engineCapacity !== null && input.engineCapacity !== '') {
    const capacity = parseInteger(input.engineCapacity)
    if (capacity === null) {
      errors.engineCapacity = 'Invalid engine capacity format'
    } else if (capacity < MIN_ENGINE_CAPACITY) {
      errors.engineCapacity = `Engine capacity must be at least ${MIN_ENGINE_CAPACITY}cc`
    } else if (capacity > MAX_ENGINE_CAPACITY) {
      errors.engineCapacity = `Engine capacity exceeds maximum allowed value (${MAX_ENGINE_CAPACITY}cc)`
    }
  }

  // Registration year validation (optional but if provided, must be valid)
  if (input.registrationYear !== undefined && input.registrationYear !== null && input.registrationYear !== '') {
    const regYear = parseInteger(input.registrationYear)
    if (regYear === null) {
      errors.registrationYear = 'Invalid registration year format'
    } else if (regYear < MIN_YEAR || regYear > currentYear) {
      errors.registrationYear = `Registration year must be between ${MIN_YEAR} and ${currentYear}`
    }
  }

  // Previous owners validation (optional but if provided, must be valid)
  if (input.previousOwners !== undefined && input.previousOwners !== null && input.previousOwners !== '') {
    const owners = parseInteger(input.previousOwners)
    if (owners === null) {
      errors.previousOwners = 'Invalid previous owners format'
    } else if (owners < 0) {
      errors.previousOwners = 'Previous owners cannot be negative'
    } else if (owners > 50) {
      errors.previousOwners = 'Previous owners exceeds maximum allowed value'
    }
  }

  // Image URLs validation (at least 1 image required)
  if (!input.imageUrls || input.imageUrls.length === 0) {
    errors.imageUrls = 'At least one image is required'
  } else {
    // Validate each image URL format
    input.imageUrls.forEach((url, index) => {
      if (!url || !sanitizeString(url)) {
        errors[`imageUrls[${index}]`] = 'Invalid image URL'
      } else if (!isValidUrl(url)) {
        errors[`imageUrls[${index}]`] = 'Image URL format is invalid'
      }
    })

    if (input.imageUrls.length > 15) {
      errors.imageUrls = 'Maximum 15 images allowed'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize listing input
 */
export function sanitizeListing(input: ListingInput): ListingInput {
  return {
    title: sanitizeString(input.title),
    description: sanitizeDescription(input.description),
    details: sanitizeDescription(input.details),
    vehicleType: sanitizeString(input.vehicleType),
    make: sanitizeString(input.make),
    customMake: sanitizeString(input.customMake),
    model: sanitizeString(input.model),
    customModel: sanitizeString(input.customModel),
    condition: sanitizeString(input.condition),
    fuelType: sanitizeString(input.fuelType),
    transmission: sanitizeString(input.transmission),
    bodyType: sanitizeString(input.bodyType),
    color: sanitizeString(input.color),
    trim: sanitizeString(input.trim),
    grade: sanitizeString(input.grade),
    district: sanitizeString(input.district),
    city: sanitizeString(input.city),
    location: sanitizeString(input.location),
    phone: sanitizeString(input.phone),
    whatsapp: sanitizeString(input.whatsapp),
    email: sanitizeString(input.email),
    financeType: sanitizeString(input.financeType),
    remainingTerm: sanitizeString(input.remainingTerm),
    interiorColor: sanitizeString(input.interiorColor),
    vehicleConditionDetails: sanitizeDescription(input.vehicleConditionDetails),
    // Numbers are parsed and validated, not sanitized
    year: input.year,
    mileage: input.mileage,
    engineCapacity: input.engineCapacity,
    price: input.price,
    outstandingBalance: input.outstandingBalance,
    monthlyPayment: input.monthlyPayment,
    askingPrice: input.askingPrice,
    registrationYear: input.registrationYear,
    previousOwners: input.previousOwners,
    // Booleans and arrays passed through
    negotiable: input.negotiable,
    pricingType: input.pricingType,
    serviceRecordsAvailable: input.serviceRecordsAvailable,
    imageUrls: input.imageUrls
  }
}

/**
 * Generate title from listing input
 */
export function generateListingTitle(input: ListingInput): string {
  const actualMake = input.make === 'Other' ? input.customMake : input.make
  const actualModel = input.model === 'Other' ? input.customModel : input.model
  const year = parseInteger(input.year) || ''
  
  const parts = [year, actualMake, actualModel].filter(Boolean)
  return parts.join(' ').trim()
}

