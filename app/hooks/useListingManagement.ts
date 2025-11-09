/**
 * Listing Management Hook
 * Centralized listing state and operations
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/services/apiClient'
import { Listing } from '@/lib/types'
import { logger } from '@/lib/utils/logger'

export interface LocalListingStatus extends Partial<Listing> {
  id: string
  title: string
  details: string
  price: number
  views: number
  status: 'active' | 'pending' | 'sold' | 'deleted'
  postedDate: string
  image?: string
  isReportedTakedown?: boolean
  takedownReason?: string
  reportCount?: number
  rejectionReason?: string
  pauseDate?: string
  isPaused?: boolean
}

type ListingStatusFilter = 'all' | 'active' | 'sold' | 'pending' | 'paused' | 'reported'

interface UseListingManagementReturn {
  listings: LocalListingStatus[]
  loading: boolean
  statusFilter: ListingStatusFilter
  setStatusFilter: (filter: ListingStatusFilter) => void

  // CRUD operations
  fetchListings: () => Promise<void>
  markAsSold: (listingId: string) => Promise<{ success: boolean; error?: string }>
  renewListing: (listingId: string) => Promise<{ success: boolean; error?: string }>
  pauseListing: (listingId: string) => Promise<{ success: boolean; error?: string }>
  resumeListing: (listingId: string) => Promise<{ success: boolean; error?: string }>
  deleteListing: (listingId: string) => Promise<{ success: boolean; error?: string }>
}

export function useListingManagement(userId?: string): UseListingManagementReturn {
  const [listings, setListings] = useState<LocalListingStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>('all')

  // Fetch user listings
  const fetchListings = useCallback(async () => {
    if (!userId) {
      setListings([])
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Error fetching user listings', error as Error)
        setListings([])
      } else {
        const transformedListings: LocalListingStatus[] = data?.map(listing => ({
          id: listing.id,
          title: listing.title || 'Untitled Listing',
          details: listing.description || listing.details || '',
          price: listing.price || 0,
          views: listing.views || 0,
          status: listing.status || 'pending',
          postedDate: listing.created_at || new Date().toISOString().split('T')[0],
          image: listing.primary_image_url || listing.image_urls?.[0] || listing.image_url,
          primary_image_url: listing.primary_image_url,
          image_url: listing.image_url,
          image_urls: listing.image_urls,
          isReportedTakedown: listing.is_reported_takedown || false,
          takedownReason: listing.takedown_reason,
          reportCount: listing.report_count || 0,
          rejectionReason: listing.rejection_reason,
          isPaused: listing.is_paused || false,
          pauseDate: listing.pause_date
        })) || []

        setListings(transformedListings)
      }
    } catch (error) {
      logger.error('Error loading listings', error as Error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Mark listing as sold
  const markAsSold = useCallback(async (listingId: string) => {
    const response = await api.post('/api/listings/mark-sold', { listingId })

    if (response.success) {
      // Update local state
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, status: 'sold' as const }
            : listing
        )
      )
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to mark listing as sold'
    }
  }, [])

  // Renew listing
  const renewListing = useCallback(async (listingId: string) => {
    const response = await api.post('/api/listings/renew', { listingId })

    if (response.success) {
      await fetchListings()
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to renew listing'
    }
  }, [fetchListings])

  // Pause listing
  const pauseListing = useCallback(async (listingId: string) => {
    const response = await api.post('/api/listings/pause', { listingId })

    if (response.success) {
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, isPaused: true, pauseDate: new Date().toISOString() }
            : listing
        )
      )
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to pause listing'
    }
  }, [])

  // Resume listing
  const resumeListing = useCallback(async (listingId: string) => {
    const { data, error } = await supabase
      .from('listings')
      .update({ is_paused: false, pause_date: null })
      .eq('id', listingId)
      .select()
      .single()

    if (!error && data) {
      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, isPaused: false, pauseDate: undefined }
            : listing
        )
      )
      return { success: true }
    }

    return {
      success: false,
      error: error?.message || 'Failed to resume listing'
    }
  }, [])

  // Delete listing (soft delete)
  const deleteListing = useCallback(async (listingId: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', listingId)

    if (!error) {
      setListings(prev => prev.filter(listing => listing.id !== listingId))
      return { success: true }
    }

    return {
      success: false,
      error: error?.message || 'Failed to delete listing'
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  return {
    listings,
    loading,
    statusFilter,
    setStatusFilter,
    fetchListings,
    markAsSold,
    renewListing,
    pauseListing,
    resumeListing,
    deleteListing
  }
}
