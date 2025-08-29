export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  business_type: 'Auto Dealer' | 'Car Showroom' | 'Vehicle Importer' | 'Auto Parts' | 'Service Center' | 'Other'
  description: string
  logo_url?: string
  website?: string
  address?: string
  phone?: string
  operating_hours?: string
  is_verified: boolean
  is_active: boolean
  is_paused: boolean
  created_at: string
  updated_at: string
  paused_at?: string
  deleted_at?: string
}

export interface CreateBusinessProfileData {
  business_name: string
  business_type: string
  description: string
  website?: string
  address?: string
  phone?: string
  operating_hours?: string
  logo_url?: string
}

export interface UpdateBusinessProfileData extends Partial<CreateBusinessProfileData> {
  is_paused?: boolean
}