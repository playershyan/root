import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface UserProfileData {
  id: string
  fullName: string
  phone: string
  phoneVerified: boolean
  phoneVerifiedAt?: string
  tempPhone?: string
  email: string
  membershipType: 'basic' | 'gold' | 'platinum'
  accountType: 'individual' | 'business'
  avatar?: string
  country: string
  businessProfile?: {
    id: string
    businessName: string
    description: string
    phone?: string
    whatsapp?: string
  }
}

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch user profile from database
      // Using !left join to get profile even if no business profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          business_profile:business_profiles!left(*)
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.user_metadata?.name
          })
          // Retry fetch after creation
          const { data: newProfileData } = await supabase
            .from('profiles')
            .select(`
              *,
              business_profile:business_profiles(*)
            `)
            .eq('id', user.id)
            .single()
          
          if (newProfileData) {
            setProfile({
              id: user.id,
              fullName: newProfileData.name || '',
              phone: newProfileData.phone || user.phone || '',
              phoneVerified: newProfileData.phone_verified || false,
              phoneVerifiedAt: newProfileData.phone_verified_at,
              tempPhone: newProfileData.temp_phone,
              email: user.email || '',
              membershipType: newProfileData.membership_type || 'basic',
              accountType: newProfileData.account_type || 'individual',
              country: newProfileData.location || 'LK',
              businessProfile: newProfileData.business_profile && newProfileData.business_profile.is_active ? {
                id: newProfileData.business_profile.id,
                businessName: newProfileData.business_profile.business_name || '',
                description: newProfileData.business_profile.description || '',
                phone: newProfileData.business_profile.phone || '',
                whatsapp: newProfileData.business_profile.whatsapp || ''
              } : undefined
            })
          }
        } else {
          throw profileError
        }
      } else if (profileData) {
        setProfile({
          id: user.id,
          fullName: profileData.name || '',
          phone: profileData.phone || user.phone || '',
          phoneVerified: profileData.phone_verified || false,
          phoneVerifiedAt: profileData.phone_verified_at,
          tempPhone: profileData.temp_phone,
          email: user.email || '',
          membershipType: profileData.membership_type || 'basic',
          accountType: profileData.account_type || 'individual',
          country: profileData.location || 'LK',
          businessProfile: profileData.business_profile && profileData.business_profile.is_active ? {
            id: profileData.business_profile.id,
            businessName: profileData.business_profile.business_name || '',
            description: profileData.business_profile.description || '',
            phone: profileData.business_profile.phone || '',
            whatsapp: profileData.business_profile.whatsapp || ''
          } : undefined
        })
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user])

  const getPhoneNumber = (): string => {
    if (!profile) return ''
    
    // Only use business profile phone if it exists AND is active
    // This ensures deleted business profiles don't affect phone retrieval
    if (profile.businessProfile?.phone) {
      return profile.businessProfile.phone
    }
    
    // Always fall back to personal phone
    return profile.phone || ''
  }

  const getWhatsAppNumber = (): string => {
    if (!profile) return ''
    
    // Only use business profile WhatsApp if business profile exists AND is active
    if (profile.businessProfile?.whatsapp) {
      return profile.businessProfile.whatsapp
    }
    
    // Fall back to business phone (if active), then personal phone
    return profile.businessProfile?.phone || profile.phone || ''
  }

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    getPhoneNumber,
    getWhatsAppNumber
  }
}