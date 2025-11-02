'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  User, Settings, Car, Heart, MessageSquare, Search,
  Bell, Trash2, Shield, Crown, Check, ChevronDown,
  Upload, Edit, Share2, RefreshCw, Clock, MoreVertical,
  Camera, MapPin, Phone, Mail, Calendar, Eye, X,
  AlertTriangle, CheckCircle, Building2, Globe, Star, Zap,
  ChevronRight, ArrowLeft, Send, HeartOff, Pause, Play, RotateCcw
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSessionManager } from '@/app/hooks/useSessionManager'
import PhoneVerificationModal from '../components/PhoneVerificationModal'
import { formatPhoneForStorage, formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
import { sampleListings } from '@/data/sampleListingsData'
import { sampleConversations } from '@/data/sampleMessagesData'
import ListingStatusBadge from '@/app/components/listings/ListingStatusBadge'
import ListingActions from '@/app/components/listings/ListingActions'
import ListingStatusMessage from '@/app/components/listings/ListingStatusMessage'
import { filterListingsByStatus } from '@/lib/utils/listingStatus'
import WantedRequestStatusBadge from '@/app/components/wantedRequests/WantedRequestStatusBadge'
import WantedRequestActions from '@/app/components/wantedRequests/WantedRequestActions'
import WantedRequestStatusMessage from '@/app/components/wantedRequests/WantedRequestStatusMessage'
import { ConversationData, MessageData } from '@/lib/utils/messageUtils'
import { Listing } from '@/lib/types'
import { BusinessProfile, CreateBusinessProfileData, UpdateBusinessProfileData } from '@/lib/types/businessProfile'
import MobileProfileTabs from '@/app/components/mobile/MobileProfileTabs'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

// Lazy load tab components for better performance (Phase 2 optimization)
const MessagesTab = dynamic(() => import('@/app/components/messages/MessagesTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const FavoritesTab = dynamic(() => import('@/app/components/favorites/FavoritesTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const BusinessProfileManagement = dynamic(() => import('@/app/components/profile/BusinessProfileManagement'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const CreateBusinessProfile = dynamic(() => import('@/app/components/profile/CreateBusinessProfile'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const BusinessPageTab = dynamic(() => import('@/app/components/profile/BusinessPageTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const BinTab = dynamic(() => import('@/app/components/bin/BinTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const SecurityTab = dynamic(() => import('@/app/components/security/SecurityTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const NotificationsTab = dynamic(() => import('@/app/components/notifications/NotificationsTab'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})
const BusinessProfileRecovery = dynamic(() => import('@/app/components/profile/BusinessProfileRecovery'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
})

// Types
interface UserProfile {
  id: string
  fullName: string
  phone: string
  phoneVerified?: boolean
  phoneVerifiedAt?: string
  tempPhone?: string
  avatar?: string
  country: string
}

// Using main Listing type from @/lib/types
interface LocalListingStatus {
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
  pauseDate?: string // Track when ad was paused to preserve renewal countdown
  isPaused?: boolean // Distinguish between paused and under review
}

interface WantedRequest {
  id: string
  title: string
  description: string
  budget: number
  status: 'active' | 'paused' | 'closed' | 'deleted' | 'fulfilled'
  postedDate: string
  clicks: number
  location: string
  isReportedTakedown?: boolean
  rejectionReason?: string
}

interface Favorite {
  id: string
  title: string
  description?: string
  price: number
  location: string
  image?: string
  postedDate?: string
  seller?: string
}

interface DeletedItem {
  id: string
  title: string
  type: 'listing' | 'message' | 'wanted'
  details: string
  deletedDate: string
  meta?: string
}



export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toasts, showSuccess, showError, removeToast } = useToast()
  
  // Debug: Check what happened during auth
  useEffect(() => {
    const authDebug = sessionStorage.getItem('authDebug')
    if (authDebug) {
      const debug = JSON.parse(authDebug)
      console.error('AUTH REDIRECT DEBUG:', debug)
      alert(`AUTH DEBUG (URL Params Method):\nReturn URL from prop: ${debug.returnUrl}\nRedirect To: ${debug.redirectTo}\nSource: ${debug.source}\n\nIf returnUrl was empty, the URL param wasn't passed correctly!`)
      sessionStorage.removeItem('authDebug')
    }
  }, [])
  
  // Initialize activeTab from URL parameter
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('tab') || 'profile'
    }
    return 'profile'
  }
  
  const [activeTab, setActiveTab] = useState(getInitialTab())
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [emailVerified, setEmailVerified] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailUpdateLoading, setEmailUpdateLoading] = useState(false)
  const [emailUpdateSuccess, setEmailUpdateSuccess] = useState(false)
  
  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [phoneToVerify, setPhoneToVerify] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')
  
  // Messaging states
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Get search params from URL
  const searchParams = useSearchParams()

  // Handle URL parameters for tab and conversation
  useEffect(() => {
    const tab = searchParams.get('tab')
    const conversationId = searchParams.get('conversation')

    if (tab) {
      setActiveTab(tab)
    }

    if (conversationId && tab === 'messages') {
      setSelectedConversation(conversationId)
    }
  }, [searchParams])

  // Handle payment success/failure notifications
  useEffect(() => {
    const payment = searchParams.get('payment')
    const features = searchParams.get('features')
    const error = searchParams.get('error')
    const itemType = searchParams.get('type') // 'listing' or 'wanted'

    if (payment === 'success' && features) {
      // Parse features (could be comma-separated for multiple features)
      const featureList = features.split(',')

      // Show success message for each feature
      featureList.forEach(feature => {
        let message = ''
        switch (feature) {
          case 'featured':
            message = 'Congratulations! Your ad is now featured'
            break
          case 'top-spot':
            message = 'Congratulations! Your ad now has a top spot'
            break
          case 'boost':
            message = itemType === 'wanted'
              ? 'Congratulations! Your request is now high priority'
              : 'Congratulations! Your ad is now boosted'
            break
          case 'urgent':
            message = 'Congratulations! Your ad is now marked as urgent'
            break
          case 'high-priority':
            message = 'Congratulations! Your request is now high priority'
            break
          default:
            message = 'Congratulations! Your paid feature has been activated'
        }
        showSuccess(message, 3000)
      })

      // Clear URL parameters after showing notification
      const newUrl = window.location.pathname + (searchParams.get('tab') ? `?tab=${searchParams.get('tab')}` : '')
      window.history.replaceState({}, '', newUrl)
    } else if (payment === 'failed') {
      showError('Payment failed. Please try again', 4000)

      // Clear URL parameters
      const newUrl = window.location.pathname + (searchParams.get('tab') ? `?tab=${searchParams.get('tab')}` : '')
      window.history.replaceState({}, '', newUrl)
    } else if (error === 'activation-failed') {
      showError('Payment processed but feature activation failed. Contact support', 4000)

      // Clear URL parameters
      const newUrl = window.location.pathname + (searchParams.get('tab') ? `?tab=${searchParams.get('tab')}` : '')
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, showSuccess, showError])

  // Calculate dropdown position before rendering to prevent flicker
  const getDropdownPosition = (elementId: string) => {
    if (typeof window === 'undefined') return { openUp: false }
    
    const button = document.querySelector(`[data-dropdown-id="${elementId}"]`)
    if (!button) return { openUp: false }
    
    const buttonRect = button.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 200 // Approximate dropdown height
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top
    
    return {
      openUp: spaceBelow < dropdownHeight && spaceAbove > spaceBelow
    }
  }

  
  // Business profile state
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  
  // Tab configurations - dynamic based on business profile state
  const tabs = [
    { 
      id: 'profile', 
      label: 'My Profile', 
      icon: User 
    },
    // Show business page tab only if business profile exists and is active
    ...(businessProfile && businessProfile.is_active ? [{
      id: 'business',
      label: 'Business Page',
      icon: Building2
    }] : []),
    { id: 'listings', label: 'My Listings', icon: Car },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'wanted', label: 'My Wanted Requests', icon: Search },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Account Settings', icon: Shield },
    { id: 'bin', label: 'Bin', icon: Trash2 }
  ]
  
  // Form states
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    fullName: '',
    phone: '',
    phoneVerified: false,
    country: 'LK' // Default to Sri Lanka
  })


  // Listings data
  const [listings, setListings] = useState<LocalListingStatus[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)
  const [listingStatusFilter, setListingStatusFilter] = useState<'all' | 'active' | 'sold' | 'pending' | 'paused' | 'reported'>('all')
  
  // Wanted requests data
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>([])
  const [wantedRequestsLoading, setWantedRequestsLoading] = useState(true)
  
  // Favorites data
  const [favoritedAds, setFavoritedAds] = useState<Favorite[]>([])
  const [favoritedWantedRequests, setFavoritedWantedRequests] = useState<Favorite[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  const [notifications, setNotifications] = useState({
    emailNewMatches: true,
    emailPriceDrops: true,
    emailMessages: false,
    emailListingUpdates: true,
    smsUrgent: true,
    smsSecurity: false,
    marketingNewsletter: true,
    marketingPromotions: false
  })

  // Bin data
  const [binItems, setBinItems] = useState<any[]>([])
  const [binLoading, setBinLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  // Session management
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refreshSessions,
    revokeSession,
    revokeAllOtherSessions
  } = useSessionManager()

  // Authentication provider detection for password management
  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'phone'>('email')

  // Detect authentication providers on mount
  useEffect(() => {
    const detectAuthProviders = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser?.identities) {
          const providers = authUser.identities.map(i => i.provider)
          const hasEmailProvider = providers.includes('email')
          setHasExistingPassword(hasEmailProvider)

          // Set primary provider
          if (providers.includes('google')) {
            setAuthProvider('google')
          } else if (providers.includes('phone')) {
            setAuthProvider('phone')
          } else {
            setAuthProvider('email')
          }
        }
      } catch (error) {
        console.error('Error detecting auth providers:', error)
      }
    }

    if (user) {
      detectAuthProviders()
    }
  }, [user])

  // Load bin items - moved here to follow Rules of Hooks
  const loadBinItems = useCallback(async () => {
    if (!user) return

    setBinLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/bin', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to load bin items')

      const data = await response.json()
      setBinItems(data.all_items || [])
    } catch (error) {
      console.error('Error loading bin items:', error)
      alert('Failed to load bin items')
    } finally {
      setBinLoading(false)
    }
  }, [user])

  // Handle URL tab parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [])

  // Load business profile on mount
  useEffect(() => {
    if (user) {
      fetchBusinessProfile()
    }
  }, [user])

  // Function to handle tab navigation with URL update
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const url = new URL(window.location.href)
    if (tabId === 'profile') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tabId)
    }
    window.history.pushState({}, '', url)
  }

  // Load user listings from database
  useEffect(() => {
    const loadListings = async () => {
      if (!user) {
        setListingsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching user listings:', error)
          setListings([])
        } else {
          console.log('Raw listings from database:', data)
          console.log('First listing raw data:', data?.[0])
          // Transform database format to profile page format
          const transformedListings = data?.map(listing => ({
            id: listing.id,
            title: listing.title || 'Untitled Listing',
            details: listing.description || listing.details || '',
            price: listing.price || 0,
            views: listing.views || 0,
            status: listing.status || 'pending',
            postedDate: listing.created_at || new Date().toISOString().split('T')[0],
            image: listing.primary_image_url || listing.image_urls?.[0] || listing.image_url,
            isReportedTakedown: listing.is_reported_takedown || false,
            takedownReason: listing.takedown_reason,
            reportCount: listing.report_count || 0,
            rejectionReason: listing.rejection_reason,
            isPaused: listing.is_paused || false
          })) || []

          console.log('Transformed listings:', transformedListings)
          setListings(transformedListings)
        }
      } catch (error) {
        console.error('Error loading listings:', error)
        setListings([])
      } finally {
        setListingsLoading(false)
      }
    }
    
    loadListings()
  }, [user])

  // Load user wanted requests from database
  useEffect(() => {
    const loadWantedRequests = async () => {
      if (!user) return

      try {
        const { data: wantedRequests, error } = await supabase
          .from('wanted_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching wanted requests:', error)
          setWantedRequests([])
        } else {
          const formattedRequests = wantedRequests?.map(request => ({
            id: request.id,
            title: request.title,
            description: request.description,
            budget: request.budget,
            status: request.status,
            postedDate: new Date(request.created_at).toLocaleDateString(),
            clicks: request.clicks || 0,
            location: request.location,
            isReportedTakedown: request.is_reported || false,
            rejectionReason: request.rejection_reason || undefined
          })) || []

          setWantedRequests(formattedRequests)
        }
      } catch (error) {
        console.error('Error loading wanted requests:', error)
        setWantedRequests([])
      } finally {
        setWantedRequestsLoading(false)
      }
    }
    
    if (!loading && user) {
      loadWantedRequests()
    }
  }, [user, loading])

  // Load user favorites from database and localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return

      try {
        // Fetch favorited listings from API
        const response = await fetch('/api/favorites/listings')
        if (response.ok) {
          const data = await response.json()
          const formattedAds: Favorite[] = data.listings.map((listing: any) => ({
            id: listing.id,
            title: listing.title,
            description: '',
            price: listing.price,
            image: listing.image_urls?.[0] || listing.image_url || '/api/placeholder/400/300',
            location: listing.location,
            postedDate: new Date(listing.created_at).toLocaleDateString(),
            seller: 'View Details'
          }))
          setFavoritedAds(formattedAds)
        } else {
          // Fallback to empty array if API fails
          setFavoritedAds([])
        }

        // Load wanted requests from localStorage
        loadWantedRequestsFromLocalStorage()
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setFavoritesLoading(false)
      }
    }

    const loadWantedRequestsFromLocalStorage = async () => {
      if (typeof window === 'undefined') return

      try {
        const savedIds = localStorage.getItem('savedWantedRequests')
        if (!savedIds) {
          setFavoritedWantedRequests([])
          return
        }

        const requestIds = JSON.parse(savedIds)
        if (!Array.isArray(requestIds) || requestIds.length === 0) {
          setFavoritedWantedRequests([])
          return
        }

        // Fetch full data for each saved wanted request
        const requests = await Promise.all(
          requestIds.map(async (id: string) => {
            try {
              const { data, error } = await supabase
                .from('wanted_requests')
                .select('*')
                .eq('id', id)
                .single()

              if (error || !data) return null

              return {
                id: data.id,
                title: data.title,
                description: data.description || '',
                price: data.max_budget || data.min_budget || 0,
                location: data.location,
                postedDate: new Date(data.created_at).toLocaleDateString()
              }
            } catch (err) {
              console.error('Error fetching wanted request:', id, err)
              return null
            }
          })
        )

        // Filter out null values and update state
        const validRequests = requests.filter((req): req is {
          id: string;
          title: string;
          description: string;
          price: number;
          location: string;
          postedDate: string;
        } => req !== null)
        setFavoritedWantedRequests(validRequests)
      } catch (error) {
        console.error('Error loading wanted requests from localStorage:', error)
        setFavoritedWantedRequests([])
      }
    }

    // Listen for storage changes (from other tabs or same tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedWantedRequests') {
        loadWantedRequestsFromLocalStorage()
      }
    }

    const handleWantedFavoritesUpdate = () => {
      loadWantedRequestsFromLocalStorage()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('wanted-favorites-updated', handleWantedFavoritesUpdate)

    if (!loading && user) {
      loadFavorites()
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('wanted-favorites-updated', handleWantedFavoritesUpdate)
    }
  }, [user, loading])

  // Load user profile data
  const loadProfile = async () => {
      console.log('Profile page - User state:', user)
      console.log('Profile page - Loading state:', loading)
      
      if (!user) {
        console.log('No user found, redirecting to home...')
        router.push('/')
        return
      }

      try {
        // Fetch user profile from database
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            *,
            business_profile:business_profiles!left(*)
          `)
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            id: user.id,
            fullName: profileData.name || '',
            phone: profileData.phone || user.phone || '',
            phoneVerified: profileData.phone_verified || false,
            phoneVerifiedAt: profileData.phone_verified_at,
            avatar: profileData.avatar_url || '',
            tempPhone: profileData.temp_phone,
            country: profileData.location || 'LK'
          })
          setOriginalPhone(profileData.phone || user.phone || '')
          
          // Check email verification status
          setEmailVerified(profileData.email_verified !== false)

          // Check if user has active business profile
          if (profileData.business_profile && profileData.business_profile.is_active) {
            setBusinessProfile({
              id: profileData.business_profile.id,
              user_id: profileData.business_profile.user_id || user.id,
              business_name: profileData.business_profile.business_name || '',
              description: profileData.business_profile.description || '',
              logo_url: profileData.business_profile.logo_url || '',
              banner_url: profileData.business_profile.banner_url || '',
              profile_image_url: profileData.business_profile.profile_image_url || '',
              website: profileData.business_profile.website || '',
              address: profileData.business_profile.address || '',
              phone: profileData.business_profile.phone || '',
              whatsapp: profileData.business_profile.whatsapp || '',
              operating_hours: profileData.business_profile.operating_hours || '',
              is_verified: profileData.business_profile.is_verified || false,
              is_active: profileData.business_profile.is_active || true,
              created_at: profileData.business_profile.created_at || new Date().toISOString(),
              updated_at: profileData.business_profile.updated_at || new Date().toISOString()
            })
          }
        } else {
          // Create profile if it doesn't exist
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.user_metadata?.name
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

  useEffect(() => {
    if (!loading) {
      loadProfile()
    }
  }, [user, loading, router])

  // Refresh wanted requests data when returning from edit
  useEffect(() => {
    // Only set up the listener when on the wanted tab
    if (activeTab !== 'wanted') return

    const handleFocus = async () => {
      // Reload wanted requests data when page gets focus
      // This will refresh the list after editing
      if (!user) return

      setWantedRequestsLoading(true)
      try {
        const { data: wantedRequests, error } = await supabase
          .from('wanted_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching wanted requests:', error)
          setWantedRequests([])
        } else {
          const formattedRequests = wantedRequests?.map(request => ({
            id: request.id,
            title: request.title,
            description: request.description,
            budget: request.budget,
            status: request.status,
            postedDate: new Date(request.created_at).toLocaleDateString(),
            clicks: request.clicks || 0,
            location: request.location,
            isReportedTakedown: request.is_reported || false,
            rejectionReason: request.rejection_reason || undefined
          })) || []

          setWantedRequests(formattedRequests)
        }
      } catch (error) {
        console.error('Error refreshing wanted requests:', error)
      } finally {
        setWantedRequestsLoading(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab])

  // Load bin items when bin tab is active
  useEffect(() => {
    if (activeTab === 'bin') {
      loadBinItems()
    }
  }, [activeTab, loadBinItems])

  // Message handlers - OPTIMIZED VERSION
  const fetchConversations = async () => {
    try {
      if (!user) return

      // Use optimized API endpoint - single query with JOINs
      const response = await fetch('/api/messaging/conversations-optimized?limit=50&offset=0')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const { conversations: conversationsData } = await response.json()

      // Transform to match ConversationData interface
      const transformedConversations = conversationsData?.map((conv: any) => ({
        id: conv.id,
        listing_id: conv.listing_id,
        listing_title: conv.listing_title,
        listing_price: conv.listing_price,
        listing_image_url: conv.listing_image_url,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview || '',
        unread_count: conv.buyer_id === user.id ? conv.buyer_unread_count : conv.seller_unread_count,
        is_archived: conv.buyer_id === user.id ? conv.buyer_archived : conv.seller_archived,
        current_user_role: (conv.buyer_id === user.id ? 'buyer' : 'seller') as 'buyer' | 'seller',
        buyer: {
          profiles: {
            name: conv.buyer_name || 'Unknown User',
            avatar_url: conv.buyer_avatar_url || ''
          }
        },
        seller: {
          profiles: {
            name: conv.seller_name || 'Unknown User',
            avatar_url: conv.seller_avatar_url || ''
          }
        }
      })) || []

      setConversations(transformedConversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    }
  }

  const handleFetchMessages = async (conversationId: string): Promise<MessageData[]> => {
    try {
      // Use optimized API endpoint - single query with JOINs, auto mark-as-read
      const response = await fetch(
        `/api/messaging/messages-optimized/${conversationId}?limit=100&markAsRead=true`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const { messages: messagesData } = await response.json()

      // Transform to match MessageData interface
      const transformedMessages = messagesData?.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        is_read: msg.is_read,
        created_at: msg.created_at,
        message_type: msg.message_type,
        offer_data: msg.offer_data,
        sender: {
          id: msg.sender_id,
          email: '', // Not needed for display
          profiles: {
            name: msg.sender_name || 'Unknown User',
            avatar_url: msg.sender_avatar_url || ''
          }
        }
      })) || []

      return transformedMessages
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const fetchedMessages = await handleFetchMessages(conversationId)
      setMessages(fetchedMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    }
  }

  // Business Profile Functions
  const fetchBusinessProfile = async () => {
    try {
      setBusinessLoading(true)
      const response = await fetch('/api/business-profile')
      if (response.ok) {
        const { profile } = await response.json()
        setBusinessProfile(profile)
      }
    } catch (error) {
      console.error('Error fetching business profile:', error)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleCreateBusinessProfile = async (data: CreateBusinessProfileData) => {
    console.log('Creating business profile with data:', data)
    setBusinessLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create business profile')
      }

      const { profile } = await response.json()
      setBusinessProfile(profile)
      setShowCreateProfile(false)
      alert('Business profile created successfully!')
    } catch (error) {
      console.error('Error creating business profile:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create business profile'}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleUpdateBusinessProfile = async (data: UpdateBusinessProfileData) => {
    setBusinessLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update business profile')
      }

      const { profile } = await response.json()
      setBusinessProfile(profile)
      alert('Business profile updated successfully!')
    } catch (error) {
      console.error('Error updating business profile:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update business profile'}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handlePauseBusinessProfile = async () => {
    setBusinessLoading(true)
    try {
      const response = await fetch('/api/business-profile/pause', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to pause business profile')
      }

      const { profile } = await response.json()
      setBusinessProfile(profile)
      alert('Business profile paused successfully!')
    } catch (error) {
      console.error('Error pausing business profile:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to pause business profile'}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleResumeBusinessProfile = async () => {
    setBusinessLoading(true)
    try {
      const response = await fetch('/api/business-profile/resume', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resume business profile')
      }

      const { profile } = await response.json()
      setBusinessProfile(profile)
      alert('Business profile resumed successfully!')
    } catch (error) {
      console.error('Error resuming business profile:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to resume business profile'}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleDeleteBusinessProfile = async () => {
    setBusinessLoading(true)
    try {
      const response = await fetch('/api/business-profile', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete business profile')
      }

      setBusinessProfile(null)
      alert('Business profile deleted successfully!')
    } catch (error) {
      console.error('Error deleting business profile:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete business profile'}`)
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', {
      name: profile.fullName,
      phone: profile.phone,
      location: profile.country,
    })
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.fullName,
          phone: profile.phone,
          location: profile.country,
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('API Result:', result)
      if (result.success) {
        alert('Profile updated successfully!')
        // Refresh the profile data
        await loadProfile()
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert(`Failed to update profile: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format listing date/time
  const formatListingDate = (dateString: string): string => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)

    return `${hours}:${minutes} ${day}/${month}/${year}`
  }

  // Load conversations when messages tab is active
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchConversations()
      
      // Set up real-time subscription
      const channel = supabase
        .channel('conversations')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations'
        }, () => {
          fetchConversations()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeTab])

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`conversation-${selectedConversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`
        }, () => {
          fetchMessages(selectedConversation)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation])

  // Show loading state while authentication is being checked
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Handle item restoration
  const handleRestoreItem = async (itemType: string, itemId: string) => {
    if (!user) return

    setRestoring(itemId)
    try {
      // Extract actual item_id from the composite id (format: 'listing-UUID' or 'wanted-UUID')
      const actualItemId = itemId.includes('-') ? itemId.split('-').slice(1).join('-') : itemId

      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/bin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          item_type: itemType,
          item_id: actualItemId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore item')
      }

      const data = await response.json()
      showSuccess(`${data.message}\n\n${data.next_steps}`)

      // Reload bin items to reflect changes
      await loadBinItems()

    } catch (error) {
      console.error('Error restoring item:', error)
      showError(error instanceof Error ? error.message : 'Failed to restore item')
    } finally {
      setRestoring(null)
    }
  }

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Get current session for the API call
      const { data: { session } } = await supabase.auth.getSession()
      
      // Call backend logout API for cleanup (optional)
      if (session?.access_token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
        } catch (apiError) {
          // Don't block logout if API call fails
          console.warn('Backend logout API call failed:', apiError)
        }
      }
      
      // Sign out from Supabase (this is the main logout)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Error signing out:', error)
        alert('Failed to sign out. Please try again.')
        return
      }
      
      // Redirect to home page
      router.push('/')
      
      // Optional: Show success message
      // alert('You have been signed out successfully')
      
    } catch (error) {
      console.error('Unexpected error during logout:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  // Action handlers
  const handleMarkAsSold = async (listingId: string) => {
    console.log('Marking listing as sold with ID:', listingId)
    console.log('Current user:', user?.id)
    console.log('All listings:', listings.map(l => ({ id: l.id, title: l.title })))

    try {
      const response = await fetch('/api/listings/mark-sold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark listing as sold')
      }

      // Update local state
      setListings(prevListings =>
        prevListings.map(listing =>
          listing.id === listingId
            ? { ...listing, status: 'sold' as const }
            : listing
        )
      )

      showSuccess(data.message || 'Listing marked as sold successfully')
    } catch (error) {
      console.error('Error marking as sold:', error)
      showError(error instanceof Error ? error.message : 'Failed to mark listing as sold')
    }
  }
  
  const handleRelist = async (listingId: string) => {
    try {
      const response = await fetch('/api/listings/relist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to relist')
      }

      // Update local state - set to pending (under review)
      setListings(prevListings =>
        prevListings.map(listing =>
          listing.id === listingId
            ? { ...listing, status: 'pending' as const }
            : listing
        )
      )

      showSuccess(data.message || 'Listing relisted successfully')
    } catch (error) {
      console.error('Error relisting:', error)
      showError(error instanceof Error ? error.message : 'Failed to relist the item')
    }
  }

  const calculateDaysSincePosted = (postedDate: string) => {
    const posted = new Date(postedDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - posted.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const canRenewListing = (postedDate: string) => {
    const daysSincePosted = calculateDaysSincePosted(postedDate)
    return daysSincePosted >= 18
  }

  const getDaysUntilRenew = (postedDate: string) => {
    const daysSincePosted = calculateDaysSincePosted(postedDate)
    const daysUntilRenew = 18 - daysSincePosted
    return daysUntilRenew > 0 ? daysUntilRenew : 0
  }

  const handleRenewListing = async (listingId: string) => {
    try {
      // Call API to renew listing
      const response = await fetch('/api/listings/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew listing')
      }

      // Update local state on success
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, postedDate: new Date().toISOString().split('T')[0] }
            : listing
        )
      )

      alert(data.message || 'Listing renewed successfully!')
      
      // Close the action menu
      setShowActionMenu(null)
    } catch (error: any) {
      console.error('Error renewing listing:', error)
      alert(error.message || 'Failed to renew listing. Please try again.')
    }
  }

  const handlePauseAd = async (listingId: string) => {
    console.log('Pausing listing with ID:', listingId)
    console.log('Current user:', user?.id)

    try {
      const response = await fetch('/api/listings/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId, action: 'pause' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pause ad')
      }

      // Update local state
      setListings(prevListings =>
        prevListings.map(listing =>
          listing.id === listingId
            ? {
                ...listing,
                status: 'pending' as const,
                isPaused: true,
                pauseDate: new Date().toISOString()
              }
            : listing
        )
      )

      showSuccess(data.message || 'Listing paused successfully')
      setShowActionMenu(null)
    } catch (error) {
      console.error('Error pausing ad:', error)
      showError(error instanceof Error ? error.message : 'Failed to pause ad. Please try again.')
    }
  }

  const handleResumeAd = async (listingId: string) => {
    try {
      const response = await fetch('/api/listings/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId, action: 'resume' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume ad')
      }

      // Update local state
      setListings(prevListings =>
        prevListings.map(listing =>
          listing.id === listingId
            ? {
                ...listing,
                status: 'active' as const,
                isPaused: false,
                pauseDate: undefined
              }
            : listing
        )
      )

      showSuccess(data.message || 'Listing resumed successfully')
      setShowActionMenu(null)
    } catch (error) {
      console.error('Error resuming ad:', error)
      showError(error instanceof Error ? error.message : 'Failed to resume ad. Please try again.')
    }
  }

  const handleShare = (listingId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this vehicle',
        url: `/listings/${listingId}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/listings/${listingId}`)
      alert('Link copied to clipboard!')
    }
  }

  const handleDelete = async (itemId: string, itemType: 'listing' | 'wanted request' | 'message') => {
    if (!confirm(`Are you sure you want to move this ${itemType} to bin?`)) {
      return
    }

    try {
      let endpoint: string
      let bodyKey: string

      if (itemType === 'listing') {
        endpoint = '/api/listings/delete'
        bodyKey = 'listingId'
      } else if (itemType === 'wanted request') {
        endpoint = '/api/wanted-requests/delete'
        bodyKey = 'requestId'
      } else { // message
        endpoint = '/api/messages/delete'
        bodyKey = 'conversationId'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [bodyKey]: itemId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete ${itemType}`)
      }

      // Update local state based on item type
      if (itemType === 'listing') {
        setListings(prevListings =>
          prevListings.map(listing =>
            listing.id === itemId
              ? { ...listing, status: 'deleted' as const }
              : listing
          )
        )
      } else if (itemType === 'wanted request') {
        setWantedRequests(prevRequests =>
          prevRequests.map(request =>
            request.id === itemId
              ? { ...request, status: 'deleted' as const }
              : request
          )
        )
      } else if (itemType === 'message') {
        // Remove conversation from list
        setConversations(prevConversations =>
          prevConversations.filter(conversation => conversation.id !== itemId)
        )
      }

      showSuccess(data.message || `${itemType} moved to bin successfully`)
      setShowActionMenu(null)
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error)
      showError(error instanceof Error ? error.message : `Failed to delete ${itemType}`)
    }
  }

  const handleRestore = (itemId: string) => {
    console.log('Restoring:', itemId)
    // Implementation here
  }


  // Wanted request action handlers
  const handlePauseResumeWantedRequest = async (requestId: string, action: 'pause' | 'resume') => {
    try {
      const response = await fetch('/api/wanted-requests/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} wanted request`)
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: action === 'pause' ? 'paused' as const : 'active' as const }
            : request
        )
      )

      showSuccess(data.message || `Wanted request ${action}d successfully`)
    } catch (error) {
      console.error(`Error ${action}ing wanted request:`, error)
      showError(error instanceof Error ? error.message : `Failed to ${action} wanted request`)
    }
  }

  const handleCloseWantedRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to close this wanted request? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/wanted-requests/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close wanted request')
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'closed' as const }
            : request
        )
      )

      showSuccess(data.message || 'Wanted request closed successfully')
    } catch (error) {
      console.error('Error closing wanted request:', error)
      showError(error instanceof Error ? error.message : 'Failed to close wanted request')
    }
  }

  const handleRenewWantedRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/wanted-requests/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew wanted request')
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'active' as const, postedDate: new Date().toLocaleDateString() }
            : request
        )
      )

      showSuccess(data.message || 'Wanted request renewed successfully')
    } catch (error) {
      console.error('Error renewing wanted request:', error)
      showError(error instanceof Error ? error.message : 'Failed to renew wanted request')
    }
  }

  const handleMarkAsFulfilled = async (requestId: string) => {
    try {
      const response = await fetch('/api/wanted-requests/mark-fulfilled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark wanted request as fulfilled')
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'fulfilled' as const }
            : request
        )
      )

      showSuccess(data.message || 'Wanted request marked as fulfilled successfully')
    } catch (error) {
      console.error('Error marking wanted request as fulfilled:', error)
      showError(error instanceof Error ? error.message : 'Failed to mark wanted request as fulfilled')
    }
  }

  // Helper function to calculate days until renewal for wanted requests
  const getDaysUntilWantedRequestRenewal = (postedDate: string) => {
    const posted = new Date(postedDate)
    const now = new Date()
    const daysSincePosted = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))
    const daysUntilRenewal = 18 - daysSincePosted
    return daysUntilRenewal > 0 ? daysUntilRenewal : 0
  }

  const handleShareWantedRequest = (requestId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this wanted request',
        url: `/wanted/${requestId}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/wanted/${requestId}`)
      alert('Link copied to clipboard!')
    }
  }

  // Favorites action handlers
  const handleRemoveFromFavorites = async (itemId: string, type: 'ad' | 'wanted') => {
    if (confirm('Remove this item from your favorites?')) {
      if (type === 'ad') {
        // Optimistically update UI
        setFavoritedAds(prevAds => prevAds.filter(ad => ad.id !== itemId))
        
        try {
          // Call API to remove from database
          const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listingId: itemId,
              action: 'remove'
            })
          })
          
          if (!response.ok) {
            // Revert on error
            const loadFavorites = async () => {
              const res = await fetch('/api/favorites/listings')
              if (res.ok) {
                const data = await res.json()
                const formattedAds: Favorite[] = data.listings.map((listing: any) => ({
                  id: listing.id,
                  title: listing.title,
                  description: '',
                  price: listing.price,
                  image: listing.image_urls?.[0] || listing.image_url || '/api/placeholder/400/300',
                  location: listing.location,
                  postedDate: new Date(listing.created_at).toLocaleDateString(),
                  seller: 'View Details'
                }))
                setFavoritedAds(formattedAds)
              }
            }
            loadFavorites()
            alert('Failed to remove from favorites')
          }
        } catch (error) {
          console.error('Error removing favorite:', error)
          alert('Failed to remove from favorites')
        }
      } else {
        // Optimistically update UI
        setFavoritedWantedRequests(prevRequests => prevRequests.filter(request => request.id !== itemId))

        try {
          // Remove from localStorage
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('savedWantedRequests')
            if (saved) {
              const savedSet = new Set(JSON.parse(saved))
              savedSet.delete(itemId)
              localStorage.setItem('savedWantedRequests', JSON.stringify(Array.from(savedSet)))

              // Trigger update event for other components
              window.dispatchEvent(new Event('wanted-favorites-updated'))
            }
          }
        } catch (error) {
          console.error('Error removing wanted request from localStorage:', error)
        }
      }
      alert('Removed from favorites successfully!')
    }
  }

  const handleShareFavorite = (itemId: string, type: 'ad' | 'wanted') => {
    const url = type === 'ad' ? `/listings/${itemId}` : `/wanted/${itemId}`
    if (navigator.share) {
      navigator.share({
        title: `Check out this ${type === 'ad' ? 'vehicle' : 'wanted request'}`,
        url
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}${url}`)
      alert('Link copied to clipboard!')
    }
  }

  // Message handlers



  const handleSendMessage = async (conversationId: string, content: string) => {
    try {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      // API call to archive conversation
      // For now, just simulate the action
      console.log('Archiving conversation:', conversationId)
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }

  const handleMoveConversationToBin = async (conversationId: string) => {
    await handleDelete(conversationId, 'message')
  }

  const handleMarkConversationAsRead = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/mark-read`, {
        method: 'PATCH'
      })
      
      if (!response.ok) {
        throw new Error('Failed to mark as read')
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
  }

  const handleEmailUpdate = async () => {
    if (!newEmail || !confirmEmail) {
      alert('Please fill in both email fields')
      return
    }

    if (newEmail !== confirmEmail) {
      alert('Email addresses do not match')
      return
    }

    if (newEmail === user?.email) {
      alert('This is already your current email')
      return
    }

    setEmailUpdateLoading(true)
    try {
      // Update email in Supabase Auth
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      })

      if (error) throw error

      // Update profile to mark email as unverified
      await supabase
        .from('profiles')
        .update({ 
          email: newEmail,
          email_verified: false 
        })
        .eq('id', user!.id)

      setEmailVerified(false)
      setEmailUpdateSuccess(true)
      setNewEmail('')
      setConfirmEmail('')
      
      // Send verification email (Supabase handles this automatically)
      alert('Email updated! Please check your inbox for a verification link.')
    } catch (error) {
      console.error('Error updating email:', error)
      alert('Failed to update email. Please try again.')
    } finally {
      setEmailUpdateLoading(false)
    }
  }

  // Password update handler
  const handlePasswordUpdate = async (data: {
    currentPassword?: string
    newPassword: string
    confirmPassword: string
  }) => {
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update password')
      }

      // Update hasExistingPassword if this was a password creation
      if (!hasExistingPassword) {
        setHasExistingPassword(true)
      }

      return response.json()
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  // Phone verification functions
  const handlePhoneChange = (newPhone: string) => {
    console.log('Phone changed:', { newPhone, originalPhone, changed: newPhone !== originalPhone })
    setProfile({...profile, phone: newPhone})
    
    // If phone number changed from original, trigger verification
    if (newPhone !== originalPhone && newPhone.length > 0) {
      const formattedPhone = formatPhoneForStorage(newPhone)
      console.log('Triggering phone verification for:', formattedPhone)
      setPhoneToVerify(formattedPhone)
      handleSendPhoneOtp(formattedPhone)
    }
  }

  const handleSendPhoneOtp = async (phoneNumber: string) => {
    console.log('Sending OTP to:', phoneNumber)
    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber
        }),
      })

      console.log('OTP response status:', response.status)
      const data = await response.json()
      console.log('OTP response data:', data)

      if (data.success) {
        console.log('Setting phone verification modal to true')
        setShowPhoneVerification(true)
      } else {
        console.error('OTP failed:', data.error)
        alert(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert('Network error. Please try again.')
    }
  }

  const handleVerificationSuccess = async () => {
    // Reload profile data to get updated verification status
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          phone: profileData.phone,
          phoneVerified: profileData.phone_verified,
          phoneVerifiedAt: profileData.phone_verified_at,
          tempPhone: profileData.temp_phone
        }))
        setOriginalPhone(profileData.phone)
      }
    } catch (error) {
      console.error('Error reloading profile:', error)
    }
  }

  const handlePhoneNumberEdit = () => {
    setShowPhoneVerification(false)
    // Focus back on phone input
    document.getElementById('phone-input')?.focus()
  }

  const handleVerifyPhoneClick = () => {
    if (profile.phone) {
      setPhoneToVerify(profile.phone)
      handleSendPhoneOtp(profile.phone)
    }
  }

  // Filter listings based on selected status
  const filteredListings = filterListingsByStatus(listings, listingStatusFilter)

  // Stats calculation
  const stats = {
    activeListings: listings.filter(l => l.status === 'active').length,
    totalViews: listings.reduce((sum, l) => sum + l.views, 0),
    inquiries: 23,
    soldThisMonth: 2
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Mobile Tabs - Only on Mobile */}
      <MobileProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        listingsCount={listings.length}
        favoritesCount={favoritedAds.length + favoritedWantedRequests.length}
        wantedCount={wantedRequests.length}
      />

      {/* Breadcrumb - Desktop Only */}
      <div className="hidden md:block bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">My Profile</span>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-20">
              {/* Profile Header */}
              <div className="p-6 text-center border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.fullName || 'User'}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {profile.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{profile.fullName}</h3>
                <p className="text-sm text-gray-600">{profile.phone}</p>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gray-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">
                      {tab.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Mobile: No white background for primary tabs, Desktop: white background */}
            <div className={`${
              ['listings', 'favorites', 'wanted', 'messages'].includes(activeTab)
                ? 'md:bg-white md:rounded-lg md:shadow-sm'
                : 'bg-white rounded-lg shadow-sm'
            }`}>
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">My Profile</h1>
                  </div>
                  <div className="p-6">
                    {/* Personal Profile Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="flex items-center justify-center mb-8">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                            {profile.avatar ? (
                              <Image
                                src={profile.avatar}
                                alt={profile.fullName || 'User'}
                                width={96}
                                height={96}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              user?.user_metadata?.full_name
                                ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                                : profile.fullName
                                  ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                                  : 'U'
                            )}
                          </div>
                          <button
                            type="button"
                            className="absolute bottom-0 right-0 bg-white border-2 border-gray-300 rounded-full p-1 hover:bg-gray-50"
                          >
                            <Camera className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={profile.fullName}
                            onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            disabled
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-medium">
                            🇱🇰 Sri Lanka
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>

                    {/* Business Profile Management Section */}
                    <div className="mt-12 border-t pt-8">
                      <h3 className="text-lg font-semibold mb-4">Business Profile</h3>
                      <BusinessProfileManagement
                        businessProfile={businessProfile}
                        onCreateProfile={() => setShowCreateProfile(true)}
                        onPauseProfile={handlePauseBusinessProfile}
                        onResumeProfile={handleResumeBusinessProfile}
                        onDeleteProfile={handleDeleteBusinessProfile}
                        loading={isLoading}
                      />
                    </div>

                    {/* Create Business Profile Modal */}
                    {showCreateProfile && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                          <CreateBusinessProfile
                            onSubmit={handleCreateBusinessProfile}
                            onCancel={() => setShowCreateProfile(false)}
                            loading={businessLoading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Business Page Tab */}
              {businessProfile && activeTab === 'business' && (
                <BusinessPageTab 
                  businessProfile={businessProfile} 
                  onUpdate={handleUpdateBusinessProfile}
                  loading={businessLoading}
                />
              )}

              {/* Business Profile Recovery - Show when no business profile but recovery is possible */}
              {!businessProfile && activeTab === 'business' && (
                <div className="p-6">
                  <h1 className="text-2xl font-semibold mb-6">Business Profile</h1>
                  
                  {/* Business Profile Recovery Component */}
                  <BusinessProfileRecovery 
                    onRecovered={(businessName) => {
                      console.log(`Business profile "${businessName}" recovered`)
                      // Refresh business profile data
                      fetchBusinessProfile()
                    }}
                    className="mb-6"
                  />
                  
                  {/* Existing Create Business Profile Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Business Profile</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Set up your business profile to showcase your dealership, manage your listings, and build trust with customers.
                      </p>
                      <button
                        onClick={() => setShowCreateProfile(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Create Business Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}


              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <>
                  <div className="p-4 md:p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-semibold">My Listings</h1>
                    <select
                      value={listingStatusFilter}
                      onChange={(e) => setListingStatusFilter(e.target.value as any)}
                      className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Listings</option>
                      <option value="active">Active</option>
                      <option value="sold">Sold</option>
                      <option value="pending">Under Review</option>
                      <option value="paused">Paused</option>
                      <option value="reported">Reported</option>
                    </select>
                  </div>
                  <div className="p-4 md:p-6">

                    {/* Listings Table */}
                    {listingsLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your listings...</p>
                      </div>
                    ) : filteredListings.length === 0 ? (
                      <div className="text-center py-12">
                        <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-900 mb-1">
                          {listingStatusFilter === 'all' ? 'No listings yet' : `No ${listingStatusFilter === 'pending' ? 'under review' : listingStatusFilter === 'reported' ? 'reported' : listingStatusFilter} listings`}
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          {listingStatusFilter === 'all' ? 'Start selling by posting your first vehicle' : 'Try selecting a different filter'}
                        </p>
                        <Link
                          href="/post"
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block"
                        >
                          Post Your First Ad
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vehicle</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Price</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Views</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Posted</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredListings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                                    <Camera className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <Link
                                      href={`/listings/${listing.id}`}
                                      className="font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      {listing.title}
                                    </Link>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">Rs. {listing.price?.toLocaleString() || '0'}</td>
                              <td className="px-4 py-4">{listing.views}</td>
                              <td className="px-4 py-4">
                                <ListingStatusBadge listing={listing} showReason={true} />
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">{formatListingDate(listing.postedDate)}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  {listing.status === 'active' && (
                                    <>
                                      <button
                                        onClick={() => handleMarkAsSold(listing.id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 font-medium shadow-sm transition-all whitespace-nowrap h-9"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Sold
                                      </button>
                                      <Link 
                                        href={`/post/paid-features?listing=${listing.id}`}
                                        className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-amber-600 inline-flex items-center gap-2 font-medium shadow-sm transition-all h-9"
                                      >
                                        <Zap className="w-4 h-4 animate-pulse" />
                                        Boost
                                      </Link>
                                    </>
                                  )}
                                  
                                  {listing.status === 'sold' && (
                                    <>
                                      <button
                                        onClick={() => handleRelist(listing.id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 font-medium shadow-sm transition-all whitespace-nowrap h-9"
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                        Relist
                                      </button>
                                      <Link 
                                        href={`/post?edit=${listing.id}`}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 inline-flex items-center gap-2 font-medium shadow-sm transition-all h-9"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Edit
                                      </Link>
                                    </>
                                  )}
                                  
                                  {listing.status !== 'sold' && (
                                    <ListingActions
                                      listing={listing}
                                      onPause={handlePauseAd}
                                      onResume={handleResumeAd}
                                      onMarkAsSold={handleMarkAsSold}
                                      onDelete={(id) => handleDelete(id, 'listing')}
                                      onShare={handleShare}
                                      viewMode="mobile"
                                    />
                                  )}
                                </div>
                              </td>
                            </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4 relative">
                        {filteredListings.map((listing) => (
                          <div key={listing.id} className="bg-white border rounded-lg shadow-sm relative">
                            {/* Card Header with Image and Title */}
                            <div className="p-4">
                              <div className="flex gap-3">
                                <div className="min-w-[64px] w-16 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-500 flex-shrink-0">
                                  <Camera className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <Link
                                      href={`/listings/${listing.id}`}
                                      className="text-sm font-medium text-blue-600 hover:text-blue-700 block line-clamp-2 break-words"
                                    >
                                      {listing.title}
                                    </Link>
                                    <div className="flex-shrink-0">
                                      <ListingActions
                                        listing={listing}
                                        onPause={handlePauseAd}
                                        onResume={handleResumeAd}
                                        onMarkAsSold={handleMarkAsSold}
                                        onDelete={(id) => handleDelete(id, 'listing')}
                                        onShare={handleShare}
                                        viewMode="mobile"
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <span className="text-base font-semibold text-gray-900">Rs. {listing.price?.toLocaleString() || '0'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Info */}
                            <div className="px-4 pb-4">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  {listing.views} views
                                </span>
                                <span>{formatListingDate(listing.postedDate)}</span>
                              </div>

                              {/* Status */}
                              <div className="mb-3">
                                <ListingStatusBadge listing={listing} showReason={true} />
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2">
                                {listing.status === 'active' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleMarkAsSold(listing.id)}
                                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-all"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Mark as Sold
                                    </button>
                                    <Link 
                                      href={`/post/paid-features?listing=${listing.id}`}
                                      className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-amber-600 flex items-center justify-center gap-2 font-medium transition-all"
                                    >
                                      <Zap className="w-4 h-4" />
                                      Boost
                                    </Link>
                                  </div>
                                )}

                                <ListingStatusMessage listing={listing} />
                                
                                {listing.status === 'sold' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRelist(listing.id)}
                                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2 font-medium transition-all"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                      Relist
                                    </button>
                                    <Link 
                                      href={`/post?edit=${listing.id}`}
                                      className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-all"
                                    >
                                      <Edit className="w-4 h-4" />
                                      Edit
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Favorites Tab */}
              {activeTab === 'favorites' && (
                <FavoritesTab
                  favoriteAds={favoritedAds.map(ad => ({
                    id: ad.id,
                    title: ad.title,
                    description: ad.description,
                    price: ad.price,
                    location: ad.location,
                    image: ad.image,
                    postedDate: ad.postedDate,
                    seller: ad.seller
                  }))}
                  favoriteWanted={favoritedWantedRequests.map(request => ({
                    id: request.id,
                    title: request.title,
                    description: request.description || '',
                    budget: request.price,
                    location: request.location,
                    postedDate: request.postedDate || new Date().toISOString()
                  }))}
                  onRemoveAdFromFavorites={(id) => handleRemoveFromFavorites(id, 'ad')}
                  onRemoveWantedFromFavorites={(id) => handleRemoveFromFavorites(id, 'wanted')}
                  onShareAd={(id) => handleShareFavorite(id, 'ad')}
                  onShareWanted={(id) => handleShareFavorite(id, 'wanted')}
                  loading={favoritesLoading}
                />
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <MessagesTab
                  conversations={conversations}
                  currentUserId={user?.id}
                  onFetchConversations={fetchConversations}
                  onFetchMessages={handleFetchMessages}
                  onSendMessage={handleSendMessage}
                  onArchiveConversation={handleArchiveConversation}
                  onMoveConversationToBin={handleMoveConversationToBin}
                  onMarkConversationAsRead={handleMarkConversationAsRead}
                />
              )}

              {/* Wanted Requests Tab */}
              {activeTab === 'wanted' && (
                <>
                  <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">Wanted Requests</h1>
                    <Link
                      href="/wanted/post"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                    >
                      <span>+</span> Publish a Request
                    </Link>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-6">
                      Tell the community what vehicle you're looking for and let sellers come to you.
                      <Link href="#" className="text-blue-600 hover:text-blue-700 ml-1">Learn more</Link>
                    </p>

                    {/* Wanted Requests Table/Cards */}
                    {wantedRequestsLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your wanted requests...</p>
                      </div>
                    ) : wantedRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-900 mb-1">No wanted requests yet</p>
                        <p className="text-sm text-gray-600 mb-4">Create your first wanted request to find your ideal vehicle</p>
                        <Link
                          href="/wanted/post"
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block"
                        >
                          Post Your First Request
                        </Link>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Request</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Budget</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clicks</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Posted</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {wantedRequests.map((request) => (
                              <tr key={request.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  <div>
                                    <Link 
                                      href={`/wanted/${request.id}`}
                                      className="font-medium text-blue-600 hover:text-blue-700"
                                    >
                                      {request.title}
                                    </Link>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {request.location}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">Rs. {request.budget?.toLocaleString() || '0'}</td>
                                <td className="px-4 py-4">{request.clicks}</td>
                                <td className="px-4 py-4">
                                  <WantedRequestStatusBadge request={request} />
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">{formatListingDate(request.postedDate)}</td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    {request.status === 'active' && (
                                      <>
                                        <button
                                          onClick={() => handleCloseWantedRequest(request.id)}
                                          className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1 font-medium transition-all"
                                        >
                                          <X className="w-3 h-3" />
                                          Close
                                        </button>
                                        <Link 
                                          href={`/wanted-request/paid-features?request=${request.id}`}
                                          className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600 inline-flex items-center gap-1 font-medium shadow-sm transition-all"
                                        >
                                          <Zap className="w-3 h-3 animate-pulse" />
                                          Boost
                                        </Link>
                                      </>
                                    )}

                                    {request.status === 'paused' && (
                                      <>
                                        <button
                                          onClick={() => handlePauseResumeWantedRequest(request.id, 'resume')}
                                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1 font-medium transition-all"
                                        >
                                          <Play className="w-3 h-3" />
                                          Resume
                                        </button>
                                        <button
                                          onClick={() => handleCloseWantedRequest(request.id)}
                                          className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1 font-medium transition-all"
                                        >
                                          <X className="w-3 h-3" />
                                          Close
                                        </button>
                                      </>
                                    )}

                                    <WantedRequestActions
                                      request={request}
                                      onPause={(id) => handlePauseResumeWantedRequest(id, 'pause')}
                                      onResume={(id) => handlePauseResumeWantedRequest(id, 'resume')}
                                      onClose={handleCloseWantedRequest}
                                      onDelete={(id) => handleDelete(id, 'wanted request')}
                                      onShare={handleShareWantedRequest}
                                      viewMode="mobile"
                                    />
                                  </div>
                                </td>
                              </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 relative">
                          {wantedRequests.map((request) => (
                            <div key={request.id} className="bg-white border rounded-lg shadow-sm relative">
                              {/* Card Header */}
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <Link
                                    href={`/wanted/${request.id}`}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 block line-clamp-2 break-words flex-1 min-w-0"
                                  >
                                    {request.title}
                                  </Link>
                                  <div className="relative flex-shrink-0">
                                    <button
                                      data-dropdown-id={request.id}
                                      onClick={() => setShowActionMenu(showActionMenu === request.id ? null : request.id)}
                                      className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </button>
                                    
                                    {showActionMenu === request.id && (
                                      <div className={`absolute right-0 bg-white border rounded-lg shadow-lg py-2 z-50 w-48 ${
                                        getDropdownPosition(request.id).openUp 
                                          ? 'bottom-full mb-1' 
                                          : 'top-full mt-1'
                                      }`}>
                                        <button 
                                          onClick={() => handleShareWantedRequest(request.id)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Share2 className="w-4 h-4" />
                                          Share Request
                                        </button>
                                        <Link
                                          href={`/wanted/post?edit=${request.id}`}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit Request
                                        </Link>
                                        
                                        {(request.status === 'active' || request.status === 'paused') && (
                                          <>
                                            <hr className="my-2" />
                                            {request.status === 'active' ? (
                                              <>
                                                <button
                                                  onClick={() => handlePauseResumeWantedRequest(request.id, 'pause')}
                                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                  <Pause className="w-4 h-4" />
                                                  Pause Request
                                                </button>

                                                <button
                                                  onClick={() => handleRenewWantedRequest(request.id)}
                                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                                                    getDaysUntilWantedRequestRenewal(request.postedDate) > 0
                                                      ? 'text-gray-400 cursor-not-allowed'
                                                      : 'text-gray-900'
                                                  }`}
                                                  disabled={getDaysUntilWantedRequestRenewal(request.postedDate) > 0}
                                                  title={
                                                    getDaysUntilWantedRequestRenewal(request.postedDate) > 0
                                                      ? `${getDaysUntilWantedRequestRenewal(request.postedDate)} days to renew`
                                                      : 'Renew request to boost visibility'
                                                  }
                                                >
                                                  <RefreshCw className="w-4 h-4" />
                                                  {getDaysUntilWantedRequestRenewal(request.postedDate) > 0
                                                    ? `${getDaysUntilWantedRequestRenewal(request.postedDate)} days to renew`
                                                    : 'Renew Request'
                                                  }
                                                </button>
                                              </>
                                            ) : request.status === 'paused' ? (
                                              <button
                                                onClick={() => handlePauseResumeWantedRequest(request.id, 'resume')}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                              >
                                                <Play className="w-4 h-4" />
                                                Resume Request
                                              </button>
                                            ) : null}
                                          </>
                                        )}

                                        {(request.status === 'active' || request.status === 'paused') && (
                                          <>
                                            <hr className="my-2" />
                                            <button
                                              onClick={() => handleMarkAsFulfilled(request.id)}
                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                            >
                                              <CheckCircle className="w-4 h-4" />
                                              Mark as Fulfilled
                                            </button>
                                          </>
                                        )}

                                        <hr className="my-2" />
                                        <button 
                                          onClick={() => handleDelete(request.id, 'wanted request')}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Move to Bin
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Card Info */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-base font-semibold text-gray-900">Rs. {request.budget?.toLocaleString() || '0'}</span>
                                    <span className="text-xs text-gray-600">{request.clicks} clicks</span>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {request.location}
                                    </span>
                                    <span>{formatListingDate(request.postedDate)}</span>
                                  </div>

                                  {/* Status */}
                                  <div className="flex items-center justify-between">
                                    <WantedRequestStatusBadge request={request} />
                                  </div>

                                  <WantedRequestStatusMessage request={request} />
                                  
                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-2">
                                    {request.status === 'active' && (
                                      <>
                                        <button
                                          onClick={() => handleCloseWantedRequest(request.id)}
                                          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-all"
                                        >
                                          <X className="w-4 h-4" />
                                          Close
                                        </button>
                                        <Link 
                                          href={`/wanted-request/paid-features?request=${request.id}`}
                                          className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-lg text-sm hover:bg-amber-600 flex items-center justify-center gap-2 font-medium transition-all"
                                        >
                                          <Zap className="w-4 h-4" />
                                          Boost
                                        </Link>
                                      </>
                                    )}

                                    {request.status === 'paused' && (
                                      <>
                                        <button
                                          onClick={() => handlePauseResumeWantedRequest(request.id, 'resume')}
                                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-all"
                                        >
                                          <Play className="w-4 h-4" />
                                          Resume
                                        </button>
                                        <button
                                          onClick={() => handleCloseWantedRequest(request.id)}
                                          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-all"
                                        >
                                          <X className="w-4 h-4" />
                                          Close
                                        </button>
                                      </>
                                    )}
                                    {request.status === 'deleted' && request.isReportedTakedown && (
                                      <Link
                                        href={`/wanted/edit/${request.id}`}
                                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-2 font-medium transition-all"
                                      >
                                        <Edit className="w-4 h-4" />
                                        Edit & Resubmit
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <NotificationsTab
                  preferences={notifications}
                  onUpdate={async (newPreferences) => {
                    setNotifications(newPreferences)
                    // Here you would typically save to backend
                    console.log('Saving notification preferences:', newPreferences)
                  }}
                  loading={false}
                />
              )}



              {/* Security Tab */}
              {activeTab === 'security' && (
                <SecurityTab
                  emailData={{
                    currentEmail: user?.email || '',
                    newEmail: '',
                    confirmEmail: '',
                    isVerified: emailVerified
                  }}
                  twoFactorData={{
                    isEnabled: false,
                    method: 'sms'
                  }}
                  sessions={sessions}
                  hasExistingPassword={hasExistingPassword}
                  authProvider={authProvider}
                  onEmailUpdate={async (data) => {
                    await handleEmailUpdate()
                  }}
                  onPasswordUpdate={handlePasswordUpdate}
                  onTwoFactorUpdate={async (data) => {
                    console.log('2FA update:', data)
                    // Handle 2FA update
                  }}
                  onSessionUpdate={async (data) => {
                    if (data.action === 'refresh') {
                      await refreshSessions()
                    } else if (data.action === 'revoke' && data.sessionId) {
                      await revokeSession(data.sessionId)
                    } else if (data.action === 'revokeAll') {
                      await revokeAllOtherSessions()
                    }
                  }}
                  onLogout={async () => {
                    await supabase.auth.signOut()
                    router.push('/browse')
                  }}
                  loading={sessionsLoading}
                />
              )}

              {/* Bin Tab */}
              {activeTab === 'bin' && (
                <BinTab
                  binItems={binItems}
                  onRestoreItem={handleRestoreItem}
                  restoringItemId={restoring}
                  loading={binLoading}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowActionMenu(null)}
        />
      )}

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        phoneNumber={phoneToVerify}
        onPhoneNumberEdit={handlePhoneNumberEdit}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  )
}