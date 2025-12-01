/**
 * Listing validation - rebuilt from scratch
 * Clean, simple, bulletproof validation logic
 */

export interface ListingInput {
  title?: string
  description?: string
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
  color?: string
  engineCapacity?: number | string
  trim?: string
  grade?: string
  price?: number | string
  pricingType?: 'cash' | 'finance'
  negotiable?: boolean

  // Finance fields
  financeType?: string
  outstandingBalance?: number | string
  monthlyPayment?: number | string
  remainingTerm?: string
  askingPrice?: number | string

  // Location
  district?: string
  city?: string

  // Contact
  phone?: string
  whatsapp?: string
  email?: string

  // Images
  imageUrls?: string[]

  // Additional info
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

/**
 * Clean string - remove HTML, trim whitespace
 */
function clean(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  return str.replace(/<[^>]*>/g, '') // Remove HTML tags
}

/**
 * Parse to integer safely
 */
function toInt(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return isNaN(num) ? null : Math.floor(num)
}

/**
 * Parse to float safely
 */
function toFloat(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? null : num
}

/**
 * Check if string is non-empty after cleaning
 */
function hasValue(value: any): boolean {
  return clean(value).length > 0
}

/**
 * Validate phone number (Sri Lankan format)
 */
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\+]/g, '')
  // Accept: 0771234567, 771234567, 940771234567, +940771234567
  return /^(0|94)?[1-9]\d{8}$/.test(cleaned)
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Special privilege UID - bypasses validation and OTP requirements
const PRIVILEGED_USER_ID = '9b288153-3836-45ff-8f0b-8a196e423477'

/**
 * Main validation function
 */
export function validateListing(input: ListingInput, userId?: string): ValidationResult {
  // Bypass all validation for privileged user
  if (userId === PRIVILEGED_USER_ID) {
    return { isValid: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  const currentYear = new Date().getFullYear()

  // Title - required, 5-200 chars
  const title = clean(input.title)
  if (!hasValue(input.title)) {
    errors.title = 'Title is required'
  } else if (title.length < 5) {
    errors.title = 'Title must be at least 5 characters'
  } else if (title.length > 200) {
    errors.title = 'Title is too long (max 200 characters)'
  }

  // Vehicle type - required
  if (!hasValue(input.vehicleType)) {
    errors.vehicleType = 'Vehicle type is required'
  }

  // Make - required
  const actualMake = input.make === 'Other' ? input.customMake : input.make
  if (!hasValue(actualMake)) {
    errors.make = 'Make is required'
  }

  // Model - required
  const actualModel = input.model === 'Other' ? input.customModel : input.model
  if (!hasValue(actualModel)) {
    errors.model = 'Model is required'
  }

  // Year - required, 1990-2026
  const year = toInt(input.year)
  if (year === null) {
    errors.year = 'Year is required'
  } else if (year < 1990 || year > currentYear + 1) {
    errors.year = `Year must be between 1990 and ${currentYear + 1}`
  }

  // Condition - required
  if (!hasValue(input.condition)) {
    errors.condition = 'Condition is required'
  } else if (!['New', 'Used', 'Refurbished'].includes(input.condition)) {
    errors.condition = 'Invalid condition'
  }

  // District - required
  if (!hasValue(input.district)) {
    errors.district = 'District is required'
  }

  // City - required
  if (!hasValue(input.city)) {
    errors.city = 'City is required'
  }

  // Price - required, positive number
  const price = toFloat(input.price)
  if (price === null) {
    errors.price = 'Price is required'
  } else if (price < 0) {
    errors.price = 'Price cannot be negative'
  } else if (price > 1000000000) {
    errors.price = 'Price is too high'
  }

  // Finance validation
  if (input.pricingType === 'finance') {
    const asking = toFloat(input.askingPrice)
    if (asking === null || asking < 0) {
      errors.askingPrice = 'Valid asking price is required'
    }
  }

  // Phone - required, valid format
  if (!hasValue(input.phone)) {
    errors.phone = 'Phone number is required'
  } else if (!isValidPhone(input.phone)) {
    errors.phone = 'Invalid phone number'
  }

  // Email - optional, but must be valid if provided
  if (hasValue(input.email) && !isValidEmail(input.email)) {
    errors.email = 'Invalid email address'
  }

  // Images - at least 1 required
  if (!input.imageUrls || input.imageUrls.length === 0) {
    errors.imageUrls = 'At least one image is required'
  } else if (input.imageUrls.length > 10) {
    errors.imageUrls = 'Maximum 10 images allowed'
  }

  // Optional validations
  if (input.mileage !== undefined && input.mileage !== null && input.mileage !== '') {
    const mileage = toInt(input.mileage)
    if (mileage !== null && (mileage < 0 || mileage > 10000000)) {
      errors.mileage = 'Invalid mileage'
    }
  }

  if (input.engineCapacity !== undefined && input.engineCapacity !== null && input.engineCapacity !== '') {
    const capacity = toInt(input.engineCapacity)
    if (capacity !== null && (capacity < 50 || capacity > 10000)) {
      errors.engineCapacity = 'Invalid engine capacity'
    }
  }

  if (input.registrationYear !== undefined && input.registrationYear !== null && input.registrationYear !== '') {
    const regYear = toInt(input.registrationYear)
    if (regYear !== null && (regYear < 1990 || regYear > currentYear)) {
      errors.registrationYear = `Registration year must be between 1990 and ${currentYear}`
    }
  }

  if (input.previousOwners !== undefined && input.previousOwners !== null && input.previousOwners !== '') {
    const owners = toInt(input.previousOwners)
    if (owners !== null && (owners < 0 || owners > 50)) {
      errors.previousOwners = 'Invalid previous owners count'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize listing input - clean all strings
 */
export function sanitizeListing(input: ListingInput): ListingInput {
  return {
    title: clean(input.title),
    description: clean(input.description)?.substring(0, 5000) || undefined,
    vehicleType: clean(input.vehicleType),
    make: clean(input.make),
    customMake: clean(input.customMake),
    model: clean(input.model),
    customModel: clean(input.customModel),
    year: input.year,
    mileage: input.mileage,
    condition: clean(input.condition),
    fuelType: clean(input.fuelType),
    transmission: clean(input.transmission),
    color: clean(input.color),
    engineCapacity: input.engineCapacity,
    trim: clean(input.trim),
    grade: clean(input.grade),
    price: input.price,
    pricingType: input.pricingType,
    negotiable: input.negotiable,
    financeType: clean(input.financeType),
    outstandingBalance: input.outstandingBalance,
    monthlyPayment: input.monthlyPayment,
    remainingTerm: clean(input.remainingTerm),
    askingPrice: input.askingPrice,
    district: clean(input.district),
    city: clean(input.city),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: clean(input.email),
    imageUrls: input.imageUrls,
    interiorColor: clean(input.interiorColor),
    registrationYear: input.registrationYear,
    vehicleConditionDetails: clean(input.vehicleConditionDetails),
    previousOwners: input.previousOwners,
    serviceRecordsAvailable: input.serviceRecordsAvailable
  }
}

/**
 * Generate title from listing data
 */
export function generateListingTitle(input: ListingInput): string {
  const make = input.make === 'Other' ? input.customMake : input.make
  const model = input.model === 'Other' ? input.customModel : input.model
  const year = input.year

  const parts = [year, make, model].filter(v => v !== undefined && v !== null && String(v).trim() !== '')
  return parts.join(' ') || 'Vehicle Listing'
}
