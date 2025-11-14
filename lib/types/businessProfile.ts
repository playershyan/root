export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  description: string
  logo_url?: string
  banner_url?: string
  profile_image_url?: string
  website?: string
  address?: string
  phone?: string
  whatsapp?: string
  operating_hours?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateBusinessProfileData {
  business_name: string
  description?: string
  website?: string
  address?: string
  phone?: string
  whatsapp?: string
  operating_hours?: string
  logo_url?: string
  banner_url?: string
  profile_image_url?: string
}

export interface UpdateBusinessProfileData extends Partial<CreateBusinessProfileData> {
  is_active?: boolean
}