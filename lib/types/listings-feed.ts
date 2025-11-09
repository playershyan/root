export interface ListingsFeedFilters {
  vehicleType?: string | null
  make?: string | null
  model?: string | null
  minYear?: number | null
  maxYear?: number | null
  minPrice?: number | null
  maxPrice?: number | null
  fuelTypes?: string[] | null
  transmissionTypes?: string[] | null
  urgentOnly?: boolean | null
  search?: string | null
  sort?: 'recent' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'mileage_low'
  page?: number | null
  pageSize?: number | null
}

export interface ListingSummary {
  id: string
  title: string
  price: number
  make: string | null
  model: string | null
  year: number | null
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  vehicle_type: string | null
  location: string | null
  city: string | null
  district: string | null
  image_url: string | null
  image_urls: string[]
  primary_image_url: string | null
  pricing_type: string | null
  negotiable: boolean | null
  asking_price?: number | null
  monthly_payment?: number | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  created_at: string | null
  is_featured: boolean | null
  is_top_spot: boolean | null
  is_boosted: boolean | null
  is_urgent: boolean | null
  boost_score: number | null
  user_id: string | null
}

export interface ListingsFeedResult {
  items: ListingSummary[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PromotedSlots {
  featured: ListingSummary[]
  top_spot: ListingSummary[]
  boosted: ListingSummary[]
  urgent: ListingSummary[]
}

