export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  phone?: string
  name?: string
  location?: string
  language: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  business_name: string
  business_type: string
  description?: string
  logo_url?: string
  website?: string
  address?: string
  phone?: string
  operating_hours?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Listing {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  make: string
  model: string
  year: number
  mileage?: number
  fuel_type: string
  transmission: string
  body_type?: string
  engine_capacity?: string
  location: string
  phone?: string
  whatsapp?: string
  email?: string
  image_url?: string
  image_urls: string[]
  primary_image_url?: string
  posted_date?: string
  ai_generated_description?: string
  ai_summary?: string
  is_featured: boolean
  is_top_spot: boolean
  is_boosted: boolean
  is_urgent: boolean
  boost_score: number
  featured_until?: string
  top_spot_until?: string
  boosted_until?: string
  urgent_until?: string
  pricing_type: 'cash' | 'finance'
  negotiable: boolean
  finance_type?: string
  finance_provider?: string
  original_amount?: number
  outstanding_balance?: number
  monthly_payment?: number
  remaining_term?: number
  early_settlement?: number
  asking_price?: number
  is_sold: boolean
  views: number
  created_at: string
  updated_at: string
  posted_at?: string  // Legacy compatibility property
  image?: string      // Legacy compatibility property
  vehicle_type?: string
}

export interface WantedRequest {
  id: string
  user_id: string
  title: string
  description: string
  vehicle_type?: string
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  min_budget: number
  max_budget: number
  fuel_type?: string
  transmission?: string
  body_type?: string
  location?: string
  phone?: string
  whatsapp?: string
  email?: string
  urgency?: 'high'
  is_active: boolean
  status?: 'pending' | 'active' | 'paused' | 'deleted' | 'fulfilled'
  approved_at?: string
  approved_by?: string
  rejection_reason?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  listing_id: string
  promotion_type: 'featured' | 'top_spot' | 'boost' | 'urgent'
  started_at: string
  expires_at: string
  is_active: boolean
  last_boosted_at?: string
  payment_id?: string
  amount: number
  rotation_score: number
  impressions: number
  last_shown_at?: string
  rotation_group?: string
  created_at: string
  updated_at: string
}

export interface PromotionRotation {
  id: string
  promotion_id: string
  listing_id: string
  promotion_type: string
  rotation_slot: number
  rotation_cycle: number
  impressions_in_cycle: number
  last_rotated_at: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  listing_id?: string
  subject: string
  content: string
  is_read: boolean
  is_archived: boolean
  created_at: string
}

export interface PaymentData {
  amount: number
  currency: string
  description: string
  customer_email: string
  customer_phone?: string
  success_url: string
  cancel_url: string
  metadata?: Record<string, any>
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SearchFilters {
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  fuelType?: string
  transmission?: string
  bodyType?: string
  location?: string
  isFinance?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc' | 'created_at'
}

export interface VehicleFormData {
  title: string
  description: string
  make: string
  model: string
  year: number
  price: number
  mileage?: number
  fuel_type: string
  transmission: string
  body_type?: string
  engine_capacity?: string
  location: string
  phone?: string
  whatsapp?: string
  email?: string
  images: File[]
  pricing_type: 'cash' | 'finance'
  negotiable: boolean
  finance_type?: string
  finance_provider?: string
  original_amount?: number
  outstanding_balance?: number
  monthly_payment?: number
  remaining_term?: number
  early_settlement?: number
  asking_price?: number
}