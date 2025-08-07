export interface WantedRequest {
    id: string
    title: string
    description?: string
    min_budget?: number
    max_budget?: number
    make?: string
    model?: string
    min_year?: number
    max_year?: number
    location: string
    phone: string
    fuel_type?: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
    transmission?: 'Automatic' | 'Manual'
    max_mileage?: number
    urgency?: 'high' | 'medium' | 'low'
    created_at: string
    updated_at?: string
    user_id?: string
    user_name?: string
    user_avatar?: string
    is_active: boolean
    view_count?: number
    response_count?: number
  }
  
  export interface FilterState {
    locations: string[]
    makes: string[]
    models: string[]
    minBudget: string
    maxBudget: string
    yearFrom: string
    yearTo: string
    fuelTypes: string[]
    transmissions: string[]
    urgencyLevels: string[]
  }
  
  export type SortOption = 'recent' | 'budget-high' | 'budget-low' | 'urgency' | 'location'