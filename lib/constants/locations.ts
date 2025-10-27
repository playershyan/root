// lib/constants/locations.ts

// Import the JSON data - make sure these files are in your project
import districtsData from '@/data/districts.json'
import citiesData from '@/data/cities.json'

export interface District {
  id: number
  province_id: number
  name: string
  name_si: string
  name_ta: string
  province: string
}

export interface City {
  id: number
  name: string
  name_si: string | null
  name_ta: string | null
  sub_name_en: string | null
  sub_name_si: string | null
  sub_name_ta: string | null
  district_id: number
  postcode: string
  latitude: number
  longitude: number
}

// Export the raw data
export const DISTRICTS: District[] = districtsData
export const CITIES: City[] = Object.values(citiesData)
  .flat()
  .map((c: any) => ({ ...c, postcode: c.postcode ?? '' }));

// Helper functions
export function getCitiesByDistrictId(districtId: number): City[] {
  return CITIES.filter(city => city.district_id === districtId)
}

export function getCitiesByDistrictName(districtName: string): City[] {
  const district = DISTRICTS.find(d => 
    d.name.toLowerCase() === districtName.toLowerCase()
  )
  if (!district) return []
  return getCitiesByDistrictId(district.id)
}

export function getDistrictById(districtId: number): District | undefined {
  return DISTRICTS.find(d => d.id === districtId)
}

export function getDistrictByName(districtName: string): District | undefined {
  return DISTRICTS.find(d => 
    d.name.toLowerCase() === districtName.toLowerCase()
  )
}

// Get all district names sorted alphabetically
export function getDistrictNames(): string[] {
  return DISTRICTS.map(d => d.name).sort()
}

// Get all city names sorted alphabetically
export function getAllCityNames(): string[] {
  return CITIES.map(c => c.name).sort()
}

// Format location for display (e.g., "Colombo, Western Province")
export function formatLocationDisplay(location: string): string {
  // Check if it's a city
  const city = CITIES.find(c => c.name.toLowerCase() === location.toLowerCase())
  if (city) {
    const district = getDistrictById(city.district_id)
    return district ? `${city.name}, ${district.name}` : city.name
  }
  
  // Check if it's a district
  const district = DISTRICTS.find(d => d.name.toLowerCase() === location.toLowerCase())
  if (district) {
    return `${district.name} District`
  }
  
  return location
}

// Calculate similarity score for fuzzy matching
function calculateSimilarity(str: string, query: string): number {
  const lowerStr = str.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match
  if (lowerStr === lowerQuery) return 100

  // Starts with query
  if (lowerStr.startsWith(lowerQuery)) return 90

  // Contains query
  if (lowerStr.includes(lowerQuery)) return 70

  // Calculate character-based similarity for fuzzy matching
  let matches = 0
  let queryIndex = 0

  for (let i = 0; i < lowerStr.length && queryIndex < lowerQuery.length; i++) {
    if (lowerStr[i] === lowerQuery[queryIndex]) {
      matches++
      queryIndex++
    }
  }

  // If all query characters found in order
  if (queryIndex === lowerQuery.length) {
    const ratio = matches / lowerQuery.length
    return ratio * 50 // Max 50 for fuzzy matches
  }

  // Check character overlap (for typos like "Colmbo" -> "Colombo")
  const strChars = new Set(lowerStr)
  const queryChars = lowerQuery.split('')
  const overlap = queryChars.filter(char => strChars.has(char)).length
  const overlapRatio = overlap / lowerQuery.length

  // Only return non-zero score if significant overlap
  return overlapRatio > 0.6 ? overlapRatio * 30 : 0
}

// Search locations with fuzzy matching (both districts and cities)
export function searchLocations(query: string): { districts: District[], cities: City[] } {
  if (!query.trim()) {
    return { districts: [], cities: [] }
  }

  const lowerQuery = query.toLowerCase()

  // Score and filter districts
  const scoredDistricts = DISTRICTS.map(d => ({
    district: d,
    score: Math.max(
      calculateSimilarity(d.name, query),
      calculateSimilarity(d.name_si || '', query),
      calculateSimilarity(d.name_ta || '', query)
    )
  }))
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.district)

  // Score and filter cities
  const scoredCities = CITIES.map(c => ({
    city: c,
    score: Math.max(
      calculateSimilarity(c.name, query),
      calculateSimilarity(c.name_si || '', query),
      calculateSimilarity(c.name_ta || '', query)
    )
  }))
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 50) // Limit city results to 50 for performance
  .map(item => item.city)

  return { districts: scoredDistricts, cities: scoredCities }
}

// Get popular locations (customize this based on your needs)
export const POPULAR_LOCATIONS = [
  'Colombo',
  'Gampaha',
  'Kandy',
  'Galle',
  'Matara',
  'Kurunegala',
  'Negombo',
  'Jaffna',
  'Anuradhapura',
  'Ratnapura'
]

// Get popular location objects (both districts and cities)
export function getPopularLocations(): { districts: District[], cities: City[] } {
  const popularDistricts: District[] = []
  const popularCities: City[] = []

  POPULAR_LOCATIONS.forEach(name => {
    const district = DISTRICTS.find(d => d.name.toLowerCase() === name.toLowerCase())
    const city = CITIES.find(c => c.name.toLowerCase() === name.toLowerCase())

    if (district) {
      popularDistricts.push(district)
    } else if (city) {
      popularCities.push(city)
    }
  })

  return { districts: popularDistricts, cities: popularCities }
}

// Check if a location string matches any district or city
export function isValidLocation(location: string): boolean {
  const lowerLocation = location.toLowerCase()
  return DISTRICTS.some(d => d.name.toLowerCase() === lowerLocation) ||
         CITIES.some(c => c.name.toLowerCase() === lowerLocation)
}

// Get location type (district or city)
export function getLocationType(location: string): 'district' | 'city' | null {
  const lowerLocation = location.toLowerCase()

  if (DISTRICTS.some(d => d.name.toLowerCase() === lowerLocation)) {
    return 'district'
  }

  if (CITIES.some(c => c.name.toLowerCase() === lowerLocation)) {
    return 'city'
  }

  return null
}

// Calculate distance between two coordinates using Haversine formula (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Sort cities by proximity to given coordinates
export function sortCitiesByProximity(cities: City[], userLat: number, userLon: number): City[] {
  return [...cities].sort((a, b) => {
    const distanceA = calculateDistance(userLat, userLon, a.latitude, a.longitude)
    const distanceB = calculateDistance(userLat, userLon, b.latitude, b.longitude)
    return distanceA - distanceB
  })
}

// Get district center (approximate average of all cities in district)
export function getDistrictCenter(districtId: number): { latitude: number, longitude: number } | null {
  const cities = getCitiesByDistrictId(districtId)
  if (cities.length === 0) return null

  const avgLat = cities.reduce((sum, city) => sum + city.latitude, 0) / cities.length
  const avgLon = cities.reduce((sum, city) => sum + city.longitude, 0) / cities.length

  return { latitude: avgLat, longitude: avgLon }
}

// Sort districts by proximity to given coordinates (uses district center)
export function sortDistrictsByProximity(districts: District[], userLat: number, userLon: number): District[] {
  return [...districts].sort((a, b) => {
    const centerA = getDistrictCenter(a.id)
    const centerB = getDistrictCenter(b.id)

    if (!centerA && !centerB) return 0
    if (!centerA) return 1
    if (!centerB) return -1

    const distanceA = calculateDistance(userLat, userLon, centerA.latitude, centerA.longitude)
    const distanceB = calculateDistance(userLat, userLon, centerB.latitude, centerB.longitude)
    return distanceA - distanceB
  })
}

// Get user's current position (browser geolocation API)
export function getUserLocation(): Promise<{ latitude: number, longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      () => {
        resolve(null)
      },
      {
        timeout: 5000,
        maximumAge: 300000 // 5 minutes cache
      }
    )
  })
}