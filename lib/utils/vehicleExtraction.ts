/**
 * Vehicle information extraction from user search queries
 * Extracts make, model, and year from arbitrary user input
 */

import { getVehicleCategories, getMakesByCategory, getModelsByMake } from '@/lib/constants/vehicleData'

export interface ExtractedVehicleInfo {
  make: string | null
  model: string | null
  year: number | null
  matchedMake: string | null
  matchedModel: string | null
}

/**
 * Sanitize user input
 * - Remove dangerous patterns
 * - Normalize whitespace
 * - Limit length
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Length limit
  if (input.length > 100) {
    input = input.slice(0, 100)
  }

  // Remove dangerous patterns
  const dangerousPatterns = [
    /(<script|<iframe|javascript:|onerror=|eval\()/gi,
    /(DROP|DELETE|INSERT|UPDATE)\s+(TABLE|FROM)/gi,
    /[\{\}`$]/g, // Template injection characters
    /<[^>]*>/g   // HTML tags
  ]

  for (const pattern of dangerousPatterns) {
    input = input.replace(pattern, '')
  }

  // Normalize whitespace
  input = input.trim().replace(/\s+/g, ' ')

  return input
}

/**
 * Extract year from search query
 * Matches 4-digit years between 1990 and current year + 1
 */
function extractYear(query: string): number | null {
  const currentYear = new Date().getFullYear()
  const yearPattern = /\b(199\d|20[0-2]\d)\b/g
  const matches = query.match(yearPattern)

  if (!matches) return null

  // Get the last year mentioned (most likely the relevant one)
  const year = parseInt(matches[matches.length - 1])

  // Validate year range
  if (year >= 1990 && year <= currentYear + 1) {
    return year
  }

  return null
}

/**
 * Extract make and model from search query
 * Uses known vehicle data to match against user input
 */
export function extractVehicleInfo(query: string): ExtractedVehicleInfo {
  const sanitized = sanitizeSearchInput(query)
  const lowerQuery = sanitized.toLowerCase()

  const result: ExtractedVehicleInfo = {
    make: null,
    model: null,
    year: null,
    matchedMake: null,
    matchedModel: null
  }

  // Extract year first
  result.year = extractYear(sanitized)

  // Get all makes from all vehicle categories
  const allMakes = new Set<string>()
  const vehicleCategories = getVehicleCategories()

  for (const category of vehicleCategories) {
    const makes = getMakesByCategory(category.value)
    makes.forEach(make => {
      if (make?.name) {
        allMakes.add(make.name.toLowerCase())
      }
    })
  }

  // Find matching make (case-insensitive, whole word match preferred)
  let matchedMake: string | null = null
  let longestMakeMatch = 0

  for (const make of allMakes) {
    const makeLower = make.toLowerCase()

    // Try whole word match first
    const wordBoundaryPattern = new RegExp(`\\b${makeLower}\\b`, 'i')
    if (wordBoundaryPattern.test(lowerQuery)) {
      if (makeLower.length > longestMakeMatch) {
        matchedMake = make
        longestMakeMatch = makeLower.length
      }
    }
    // Fallback to substring match
    else if (lowerQuery.includes(makeLower)) {
      if (makeLower.length > longestMakeMatch) {
        matchedMake = make
        longestMakeMatch = makeLower.length
      }
    }
  }

  if (!matchedMake) {
    return result
  }

  result.make = matchedMake
  result.matchedMake = matchedMake

  // Find matching model for this make
  // Try all vehicle categories to find the right models
  for (const category of vehicleCategories) {
    const makes = getMakesByCategory(category.value)
    const makeObj = makes.find(m => m?.name && m.name.toLowerCase() === matchedMake.toLowerCase())

    if (makeObj) {
      const models = getModelsByMake(category.value, makeObj.id)

      let matchedModel: string | null = null
      let longestModelMatch = 0

      for (const model of models) {
        if (!model || typeof model !== 'string') continue

        const modelLower = model.toLowerCase()

        // Skip "Other" as a valid match
        if (modelLower === 'other') continue

        // Try whole word match first
        const wordBoundaryPattern = new RegExp(`\\b${modelLower}\\b`, 'i')
        if (wordBoundaryPattern.test(lowerQuery)) {
          if (modelLower.length > longestModelMatch) {
            matchedModel = model
            longestModelMatch = modelLower.length
          }
        }
        // Fallback to substring match
        else if (lowerQuery.includes(modelLower)) {
          if (modelLower.length > longestModelMatch) {
            matchedModel = model
            longestModelMatch = modelLower.length
          }
        }
      }

      if (matchedModel) {
        result.model = matchedModel
        result.matchedModel = matchedModel
        break
      }
    }
  }

  return result
}

/**
 * Generate cache key for buying guide
 */
export function generateGuideCacheKey(make: string, model: string, year?: number | null): string {
  const makeKey = make.toLowerCase().replace(/[\s-]/g, '_')
  const modelKey = model.toLowerCase().replace(/[\s-]/g, '_')

  if (year) {
    return `guide:${makeKey}:${modelKey}:${year}`
  }

  return `guide:${makeKey}:${modelKey}:general`
}

/**
 * Get year generation for a vehicle
 * Groups years into 5-year generations for caching
 */
export function getYearGeneration(year: number): string {
  const startYear = Math.floor(year / 5) * 5
  const endYear = startYear + 4
  return `${startYear}-${endYear}`
}

/**
 * Get all possible cache keys for a vehicle query
 * Returns keys in priority order: specific year → generation → general
 */
export function getGuideCacheKeys(make: string, model: string, year?: number | null): string[] {
  const keys: string[] = []

  if (year) {
    // Try specific year first
    keys.push(generateGuideCacheKey(make, model, year))

    // Try generation range
    const generation = getYearGeneration(year)
    const makeKey = make.toLowerCase().replace(/[\s-]/g, '_')
    const modelKey = model.toLowerCase().replace(/[\s-]/g, '_')
    keys.push(`guide:${makeKey}:${modelKey}:gen_${generation}`)
  }

  // Fallback to general guide
  keys.push(generateGuideCacheKey(make, model))

  return keys
}
