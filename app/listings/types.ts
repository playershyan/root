export type SortOption =
  | 'recent'
  | 'price_low'
  | 'price_high'
  | 'year_new'
  | 'year_old'
  | 'mileage_low'

export interface ListingsPageFilterState {
  search: string
  vehicleType: string
  location: string
  make: string
  model: string
  minYear: string
  maxYear: string
  minPrice: string
  maxPrice: string
  fuelTypes: string[]
  transmissionTypes: string[]
  urgentOnly: boolean
  sort: SortOption
}

export interface ListingsPagePaginationState {
  page: number
  total: number
  pageSize: number
  totalPages: number
}

