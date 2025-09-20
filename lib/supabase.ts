import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a single supabase client for interacting with your database
export const supabase = createClientComponentClient()

// Note: Listing type moved to @/lib/types.ts for consistency

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
