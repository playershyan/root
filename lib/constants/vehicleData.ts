import vehicleData from '@/data/vehicles.json'

export interface VehicleModel {
  id: string
  name: string
  models: string[]
}

export interface VehicleCategory {
  label: string
  description: string
  icon: string
  makes: VehicleModel[]
}

export interface VehicleData {
  categories: Record<string, VehicleCategory>
}

// Export the full vehicle data
export const VEHICLE_DATA: VehicleData = vehicleData

// Helper function to get makes by category
export const getMakesByCategory = (category: string): VehicleModel[] => {
  return VEHICLE_DATA.categories[category]?.makes || []
}

// Helper function to get models by make and category
export const getModelsByMake = (category: string, makeId: string): string[] => {
  const makes = getMakesByCategory(category)
  const make = makes.find(m => m.id === makeId)
  return make?.models || []
}

// Helper function to get all vehicle categories
export const getVehicleCategories = () => {
  return Object.entries(VEHICLE_DATA.categories).map(([key, value]) => ({
    value: key,
    label: value.label,
    description: value.description,
    icon: value.icon
  }))
}

// Helper function to get category info
export const getCategoryInfo = (category: string): VehicleCategory | null => {
  return VEHICLE_DATA.categories[category] || null
}

// Export vehicle type as union of category keys
export type VehicleType = keyof typeof VEHICLE_DATA.categories

// Export all categories as a constant
export const VEHICLE_CATEGORIES = Object.keys(VEHICLE_DATA.categories) as VehicleType[]