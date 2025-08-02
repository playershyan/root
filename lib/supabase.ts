import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Type definitions for our database
export type Listing = {
  id: string
  title: string
  description: string | null
  price: number
  make: string
  model: string
  year: number
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  location: string
  phone: string
  whatsapp: string | null
  email: string | null
  image_url: string | null
  image_urls: string[] | null
  ai_generated_description: string | null
  ai_summary: string | null
  is_featured: boolean
  is_sold: boolean
  views: number
  created_at: string
  updated_at: string
}

export type WantedRequest = {
  id: string
  title: string
  description: string | null
  min_budget: number | null
  max_budget: number | null
  make: string | null
  model: string | null
  min_year: number | null
  max_year: number | null
  fuel_type: string | null
  transmission: string | null
  location: string
  phone: string
  whatsapp: string | null
  email: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
