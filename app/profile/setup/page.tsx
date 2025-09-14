'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import ProfileSetup from '../../components/profile/ProfileSetup'
import { Loader2 } from 'lucide-react'

export default function ProfileSetupPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking profile:', error)
          return
        }

        // If profile exists and has required fields, redirect to main profile
        if (profile && profile.name && profile.phone) {
          setHasProfile(true)
          router.push('/profile')
          return
        }

        setHasProfile(false)
      } catch (error) {
        console.error('Error in profile check:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/')
        return
      }
      checkProfile()
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (hasProfile) {
    return null // Will redirect to profile
  }

  return (
    <ProfileSetup
      initialData={{
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || ''
      }}
    />
  )
}