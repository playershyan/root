/**
 * Business Profile Hook
 * Centralized business profile state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/services/apiClient'
import {
  BusinessProfile,
  CreateBusinessProfileData,
  UpdateBusinessProfileData
} from '@/lib/types/businessProfile'

interface UseBusinessProfileReturn {
  businessProfile: BusinessProfile | null
  loading: boolean
  error: string | null

  // CRUD operations
  fetchBusinessProfile: () => Promise<void>
  createBusinessProfile: (data: CreateBusinessProfileData) => Promise<{ success: boolean; error?: string }>
  updateBusinessProfile: (data: UpdateBusinessProfileData) => Promise<{ success: boolean; error?: string }>
  deleteBusinessProfile: () => Promise<{ success: boolean; error?: string }>

  // Status operations
  pauseBusinessProfile: () => Promise<{ success: boolean; error?: string }>
  resumeBusinessProfile: () => Promise<{ success: boolean; error?: string }>
}

export function useBusinessProfile(): UseBusinessProfileReturn {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch business profile
  const fetchBusinessProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await api.get<BusinessProfile>('/api/business-profile')

    if (response.success && response.data) {
      setBusinessProfile(response.data)
    } else {
      // No business profile is not an error state
      setBusinessProfile(null)
      if (response.error && !response.error.includes('not found')) {
        setError(response.error)
      }
    }

    setLoading(false)
  }, [])

  // Create business profile
  const createBusinessProfile = useCallback(async (data: CreateBusinessProfileData) => {
    const response = await api.post<BusinessProfile>('/api/business-profile', data)

    if (response.success && response.data) {
      setBusinessProfile(response.data)
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to create business profile'
    }
  }, [])

  // Update business profile
  const updateBusinessProfile = useCallback(async (data: UpdateBusinessProfileData) => {
    const response = await api.patch<BusinessProfile>('/api/business-profile', data)

    if (response.success && response.data) {
      setBusinessProfile(response.data)
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to update business profile'
    }
  }, [])

  // Delete business profile
  const deleteBusinessProfile = useCallback(async () => {
    const response = await api.delete('/api/business-profile')

    if (response.success) {
      setBusinessProfile(null)
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to delete business profile'
    }
  }, [])

  // Pause business profile
  const pauseBusinessProfile = useCallback(async () => {
    const response = await api.post<BusinessProfile>('/api/business-profile/pause')

    if (response.success && response.data) {
      setBusinessProfile(response.data)
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to pause business profile'
    }
  }, [])

  // Resume business profile
  const resumeBusinessProfile = useCallback(async () => {
    const response = await api.post<BusinessProfile>('/api/business-profile/resume')

    if (response.success && response.data) {
      setBusinessProfile(response.data)
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to resume business profile'
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchBusinessProfile()
  }, [fetchBusinessProfile])

  return {
    businessProfile,
    loading,
    error,
    fetchBusinessProfile,
    createBusinessProfile,
    updateBusinessProfile,
    deleteBusinessProfile,
    pauseBusinessProfile,
    resumeBusinessProfile
  }
}
