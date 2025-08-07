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

// Search locations (both districts and cities)
export function searchLocations(query: string): { districts: District[], cities: City[] } {
  const lowerQuery = query.toLowerCase()
  
  const matchingDistricts = DISTRICTS.filter(d => 
    d.name.toLowerCase().includes(lowerQuery)
  )
  
  const matchingCities = CITIES.filter(c => 
    c.name.toLowerCase().includes(lowerQuery)
  )
  
  return { districts: matchingDistricts, cities: matchingCities }
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