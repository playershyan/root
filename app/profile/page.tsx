'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { sampleListings } from '@/data/sampleListingsData'
import { sampleConversations } from '@/data/sampleMessagesData'
import ListingStatusBadge from '@/app/components/listings/ListingStatusBadge'
import ListingActions from '@/app/components/listings/ListingActions'
import ListingStatusMessage from '@/app/components/listings/ListingStatusMessage'
import { filterListingsByStatus } from '@/lib/utils/listingStatus'
import WantedRequestStatusBadge from '@/app/components/wantedRequests/WantedRequestStatusBadge'
import WantedRequestActions from '@/app/components/wantedRequests/WantedRequestActions'
import WantedRequestStatusMessage from '@/app/components/wantedRequests/WantedRequestStatusMessage'
import MessagesTab from '@/app/components/messages/MessagesTab'
import FavoritesTab from '@/app/components/favorites/FavoritesTab'
import BinTab from '@/app/components/bin/BinTab'
import SecurityTab from '@/app/components/security/SecurityTab'
import NotificationsTab from '@/app/components/notifications/NotificationsTab'

// Types
interface UserProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  phoneVerified?: boolean
  phoneVerifiedAt?: string
  tempPhone?: string
  membershipType: 'basic' | 'gold' | 'platinum'
  accountType: 'individual' | 'business'
  avatar?: string
}

interface BusinessProfile {
  id: string
  businessName: string
  businessType: string
  description: string
  logoUrl?: string
  website?: string
  address?: string
  phone?: string
  operatingHours?: string
  isVerified: boolean
}

interface Listing {
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
  status: 'active' | 'paused' | 'closed' | 'deleted'
  postedDate: string
  responses: number
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

interface Conversation {
  id: string
  listing_id: string
  listing_title: string
  listing_price: number
  listing_image_url: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  last_message_preview: string
  unread_count: number
  is_archived: boolean
  current_user_role: 'buyer' | 'seller'
  buyer: {
    profiles: {
      name: string
      avatar_url: string
    }
  }
  seller: {
    profiles: {
      name: string
      avatar_url: string
    }
  }
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    email: string
    profiles: {
      name: string
      avatar_url: string
    }
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [profileLoading, setProfileLoading] = useState(true)
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  
  // Handle URL parameters for tab and conversation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    const conversationId = params.get('conversation')
    
    if (tab) {
      setActiveTab(tab)
    }
    
    if (conversationId && tab === 'messages') {
      setSelectedConversation(conversationId)
    }
  }, [])

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

  
  // Business profile toggle
  const [isBusinessProfile, setIsBusinessProfile] = useState(false)
  
  // Tab configurations - dynamic based on business profile state
  const tabs = [
    { 
      id: 'profile', 
      label: isBusinessProfile ? 'Business Profile' : 'My Profile', 
      icon: isBusinessProfile ? Building2 : User 
    },
    { id: 'listings', label: 'My Listings', icon: Car },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'wanted', label: 'My Wanted Requests', icon: Search },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'membership', label: 'AutoTrader Membership', icon: Crown, special: true },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'bin', label: 'Bin', icon: Trash2 }
  ]
  
  // Form states
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
    phoneVerified: false,
    membershipType: 'basic',
    accountType: 'individual'
  })

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    id: '',
    businessName: '',
    businessType: 'Auto Dealer',
    description: '',
    logoUrl: '',
    website: '',
    address: '',
    phone: '',
    operatingHours: '',
    isVerified: false
  })

  const [hasBusinessProfile, setHasBusinessProfile] = useState(false)
  const [businessLoading, setBusinessLoading] = useState(false)

  // Listings data
  const [listings, setListings] = useState<Listing[]>([])
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

  // Load bin items - moved here to follow Rules of Hooks
  const loadBinItems = useCallback(async () => {
    if (!user) return
    
    setBinLoading(true)
    try {
      // Sample data for testing the bin functionality
      const sampleBinData = [
        // Deleted Listings
        {
          id: 'listing-1',
          item_type: 'listing',
          title: '2019 Toyota Prius - Hybrid',
          deleted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          deletion_reason: 'Sold the vehicle',
          can_restore: true,
          days_until_permanent_deletion: 25,
          original_data: {
            price: 8500000,
            location: 'Colombo'
          }
        },
        {
          id: 'listing-2',
          item_type: 'listing',
          title: '2015 Honda Vezel RS',
          deleted_at: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
          deletion_reason: 'Listing expired',
          can_restore: true,
          days_until_permanent_deletion: 2, // Expiring soon!
          original_data: {
            price: 5200000,
            location: 'Kandy'
          }
        },
        
        // Deleted Messages
        {
          id: 'message-1',
          item_type: 'message',
          title: 'Inquiry about Toyota Aqua',
          deleted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          deletion_reason: 'Cleaned up conversation',
          can_restore: true,
          days_until_permanent_deletion: 20,
          original_data: {
            conversation_with: 'John Doe',
            last_message: 'Is the vehicle still available?'
          }
        },
        {
          id: 'message-2',
          item_type: 'message',
          title: 'Price negotiation for Nissan Leaf',
          deleted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          deletion_reason: 'Accidental deletion',
          can_restore: true,
          days_until_permanent_deletion: 27,
          original_data: {
            conversation_with: 'Sarah Smith',
            last_message: 'Can you do 4.5M?'
          }
        },
        
        // Deleted Wanted Requests
        {
          id: 'wanted-1',
          item_type: 'wanted_request',
          title: 'Looking for Honda Fit 2018-2020',
          deleted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          deletion_reason: 'Found a vehicle',
          can_restore: true,
          days_until_permanent_deletion: 23,
          original_data: {
            budget: 4000000,
            location: 'Anywhere in Sri Lanka'
          }
        },
        {
          id: 'wanted-2',
          item_type: 'wanted_request',
          title: 'Need Toyota Axio Hybrid under 5M',
          deleted_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(), // 29 days ago
          deletion_reason: 'Request expired',
          can_restore: true,
          days_until_permanent_deletion: 1, // Critical - expiring tomorrow!
          original_data: {
            budget: 5000000,
            location: 'Western Province'
          }
        },
        {
          id: 'wanted-3',
          item_type: 'wanted_request',
          title: 'Mercedes Benz C200 2015+',
          deleted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
          deletion_reason: 'No longer needed',
          can_restore: true,
          days_until_permanent_deletion: 15,
          original_data: {
            budget: 12000000,
            location: 'Colombo'
          }
        }
      ]
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setBinItems(sampleBinData)
      
      // Uncomment below to use actual API instead of sample data
      // const { data: { session } } = await supabase.auth.getSession()
      // const response = await fetch('/api/user/bin', {
      //   headers: {
      //     'Authorization': `Bearer ${session?.access_token}`,
      //     'Content-Type': 'application/json',
      //   }
      // })
      // 
      // if (!response.ok) throw new Error('Failed to load bin items')
      // 
      // const data = await response.json()
      // setBinItems(data.all_items || [])
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

  // Load user listings (using sample data)
  useEffect(() => {
    const loadListings = async () => {
      // Simulate loading delay
      setTimeout(() => {
        setListings(sampleListings)
        setListingsLoading(false)
      }, 500)
    }
    
    loadListings()
  }, [])

  // Load user wanted requests (sample data for now)
  useEffect(() => {
    const loadWantedRequests = async () => {
      if (!user) return
      
      try {
        // For now, we'll use sample data since wanted_requests table doesn't exist yet
        const sampleWantedRequests: WantedRequest[] = [
          {
            id: '1',
            title: 'Looking for Toyota Prius 2018-2020',
            description: 'Need a well-maintained Toyota Prius, preferably white or silver color. Low mileage preferred.',
            budget: 3500000,
            status: 'active',
            postedDate: '2025-07-10', // 41 days ago - can be renewed
            responses: 12,
            location: 'Colombo',
          },
          {
            id: '2', 
            title: 'Honda Vezel or HR-V under 4M',
            description: 'Looking for Honda Vezel or HR-V in good condition. Any color acceptable. Must be within 4 million budget.',
            budget: 4000000,
            status: 'active',
            postedDate: '2025-08-15', // 5 days ago - cannot be renewed (13 days remaining)
            responses: 8,
            location: 'Kandy',
          },
          {
            id: '3',
            title: 'BMW 3 Series F30 - 2015 onwards',
            description: 'Searching for BMW 3 Series F30 model, 2015 or newer. Prefer automatic transmission.',
            budget: 8500000,
            status: 'paused',
            postedDate: '2025-07-25', // 26 days ago - can be renewed
            responses: 5,
            location: 'Galle',
          },
          {
            id: '4',
            title: 'Looking for Mercedes-Benz C-Class',
            description: 'Need C200 or C250, must be in excellent condition with AMG package',
            budget: 12000000,
            status: 'deleted',
            postedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 15,
            location: 'Colombo',
            isReportedTakedown: true,
            rejectionReason: 'Multiple reports: Suspected fraudulent payment terms'
          },
          {
            id: '5',
            title: 'Urgent: Need any SUV under 5M',
            description: 'Looking for any SUV in good condition, prefer Japanese brands',
            budget: 5000000,
            status: 'deleted',
            postedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 7,
            location: 'Matara',
            isReportedTakedown: true,
            rejectionReason: 'Reported: Suspicious contact information provided'
          }
        ]
        
        setWantedRequests(sampleWantedRequests)
      } catch (error) {
        console.error('Error loading wanted requests:', error)
      } finally {
        setWantedRequestsLoading(false)
      }
    }
    
    if (!loading && user) {
      loadWantedRequests()
    }
  }, [user, loading])

  // Load user favorites (sample data for now)
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) return
      
      try {
        // Sample favorited ads
        const sampleFavoritedAds: Favorite[] = [
          {
            id: '1',
            title: 'Toyota Prius 2018 - Hybrid',
            description: 'Well-maintained Prius with low mileage. Single owner, full service history.',
            price: 3200000,
            image: '/api/placeholder/400/300',
            location: 'Colombo',
            postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            seller: 'AutoMax Motors'
          },
          {
            id: '2', 
            title: 'Honda Vezel 2019 - Hybrid',
            description: 'Perfect condition Honda Vezel with all original parts and accessories.',
            price: 4800000,
            image: '/api/placeholder/400/300',
            location: 'Kandy',
            postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            seller: 'Private Seller'
          }
        ]
        
        // Sample favorited wanted requests
        const sampleFavoritedWantedRequests: Favorite[] = [
          {
            id: '1',
            title: 'Looking for Suzuki Alto K10 - 2015 onwards',
            description: 'Searching for well-maintained Alto K10, any color, preferably under 2M budget.',
            price: 2000000,
            location: 'Galle',
            postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            seller: 'Kasun Perera'
          }
        ]
        
        setFavoritedAds(sampleFavoritedAds)
        setFavoritedWantedRequests(sampleFavoritedWantedRequests)
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setFavoritesLoading(false)
      }
    }
    
    if (!loading && user) {
      loadFavorites()
    }
  }, [user, loading])

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      console.log('Profile page - User state:', user)
      console.log('Profile page - Loading state:', loading)
      
      if (!user) {
        console.log('No user found, redirecting to login...')
        router.push('/login')
        return
      }

      try {
        // Fetch user profile from database
        const { data: profileData } = await supabase
          .from('profiles')
          .select(`
            *,
            business_profile:business_profiles(*)
          `)
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            id: user.id,
            firstName: profileData.name?.split(' ')[0] || '',
            lastName: profileData.name?.split(' ').slice(1).join(' ') || '',
            phone: profileData.phone || user.phone || '',
            phoneVerified: profileData.phone_verified || false,
            phoneVerifiedAt: profileData.phone_verified_at,
            tempPhone: profileData.temp_phone,
            membershipType: profileData.membership_type || 'basic',
            accountType: profileData.account_type || 'individual'
          })
          setOriginalPhone(profileData.phone || user.phone || '')
          
          // Check email verification status
          setEmailVerified(profileData.email_verified !== false)

          // Check if user has business profile
          if (profileData.business_profile) {
            setHasBusinessProfile(true)
            setBusinessProfile({
              id: profileData.business_profile.id,
              businessName: profileData.business_profile.business_name || '',
              businessType: profileData.business_profile.business_type || 'Auto Dealer',
              description: profileData.business_profile.description || '',
              logoUrl: profileData.business_profile.logo_url || '',
              website: profileData.business_profile.website || '',
              address: profileData.business_profile.address || '',
              phone: profileData.business_profile.phone || '',
              operatingHours: profileData.business_profile.operating_hours || '',
              isVerified: profileData.business_profile.is_verified || false
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
      
      try {
        // Use the same sample data loading logic as before
        const sampleWantedRequests: WantedRequest[] = [
          {
            id: '1',
            title: 'Looking for Toyota Prius 2018-2020',
            description: 'Need a well-maintained Toyota Prius, preferably white or silver color. Low mileage preferred.',
            budget: 3500000,
            status: 'active',
            postedDate: '2025-07-10', // 41 days ago - can be renewed
            responses: 12,
            location: 'Colombo',
          },
          {
            id: '2', 
            title: 'Honda Vezel or HR-V under 4M',
            description: 'Looking for Honda Vezel or HR-V in good condition. Any color acceptable. Must be within 4 million budget.',
            budget: 4000000,
            status: 'active',
            postedDate: '2025-08-15', // 5 days ago - cannot be renewed (13 days remaining)
            responses: 8,
            location: 'Kandy',
          },
          {
            id: '3',
            title: 'BMW 3 Series F30 - 2015 onwards',
            description: 'Searching for BMW 3 Series F30 model, 2015 or newer. Prefer automatic transmission.',
            budget: 8500000,
            status: 'paused',
            postedDate: '2025-07-25', // 26 days ago - can be renewed
            responses: 5,
            location: 'Galle',
          },
          {
            id: '4',
            title: 'Looking for Mercedes-Benz C-Class',
            description: 'Need C200 or C250, must be in excellent condition with AMG package',
            budget: 12000000,
            status: 'deleted',
            postedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 15,
            location: 'Colombo',
            isReportedTakedown: true,
            rejectionReason: 'Multiple reports: Suspected fraudulent payment terms'
          },
          {
            id: '5',
            title: 'Urgent: Need any SUV under 5M',
            description: 'Looking for any SUV in good condition, prefer Japanese brands',
            budget: 5000000,
            status: 'deleted',
            postedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 7,
            location: 'Matara',
            isReportedTakedown: true,
            rejectionReason: 'Reported: Suspicious contact information provided'
          }
        ]
        
        setWantedRequests(() => sampleWantedRequests)
      } catch (error) {
        console.error('Error refreshing wanted requests:', error)
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
      // Simulate restoration for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay
      
      // Find the item being restored
      const item = binItems.find(i => i.id === itemId)
      if (!item) {
        throw new Error('Item not found')
      }
      
      // Show success message based on item type
      let message = ''
      let nextSteps = ''
      
      if (itemType === 'listing') {
        message = `Successfully restored listing: "${item.title}"`
        nextSteps = 'Your listing has been restored but is currently paused. Please review and activate it in your listings management.'
      } else if (itemType === 'message') {
        message = `Successfully restored message: "${item.title}"`
        nextSteps = 'Your message has been restored and is now visible in the conversation.'
      } else if (itemType === 'wanted_request') {
        message = `Successfully restored wanted request: "${item.title}"`
        nextSteps = 'Your wanted request has been restored but is currently paused. Please review and activate it in your wanted requests management.'
      }
      
      alert(message + '\n\n' + nextSteps)
      
      // Remove the restored item from the bin (for demo)
      setBinItems(prevItems => prevItems.filter(i => i.id !== itemId))
      
      console.log('Next steps:', nextSteps)
      
      // Uncomment below to use actual API instead of sample behavior
      // const { data: { session } } = await supabase.auth.getSession()
      // const response = await fetch('/api/user/bin', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${session?.access_token}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     action: 'restore',
      //     item_type: itemType,
      //     item_id: itemId
      //   })
      // })
      // 
      // if (!response.ok) {
      //   const errorData = await response.json()
      //   throw new Error(errorData.error || 'Failed to restore item')
      // }
      // 
      // const data = await response.json()
      // alert(data.message)
      // 
      // // Reload bin items to reflect changes
      // await loadBinItems()
      
    } catch (error) {
      console.error('Error restoring item:', error)
      alert(error instanceof Error ? error.message : 'Failed to restore item')
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

      alert(data.message)
    } catch (error) {
      console.error('Error marking as sold:', error)
      alert(error instanceof Error ? error.message : 'Failed to mark listing as sold')
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

      alert(data.message)
    } catch (error) {
      console.error('Error relisting:', error)
      alert(error instanceof Error ? error.message : 'Failed to relist the item')
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

      alert(data.message)
      setShowActionMenu(null)
    } catch (error) {
      console.error('Error pausing ad:', error)
      alert(error instanceof Error ? error.message : 'Failed to pause ad. Please try again.')
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

      alert(data.message)
      setShowActionMenu(null)
    } catch (error) {
      console.error('Error resuming ad:', error)
      alert(error instanceof Error ? error.message : 'Failed to resume ad. Please try again.')
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

      alert(data.message || `${itemType} moved to bin successfully`)
      setShowActionMenu(null)
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error)
      alert(error instanceof Error ? error.message : `Failed to delete ${itemType}`)
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

      alert(data.message)
    } catch (error) {
      console.error(`Error ${action}ing wanted request:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} wanted request`)
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

      alert(data.message)
    } catch (error) {
      console.error('Error closing wanted request:', error)
      alert(error instanceof Error ? error.message : 'Failed to close wanted request')
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

      alert(data.message)
    } catch (error) {
      console.error('Error renewing wanted request:', error)
      alert(error instanceof Error ? error.message : 'Failed to renew wanted request')
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
  const handleRemoveFromFavorites = (itemId: string, type: 'ad' | 'wanted') => {
    if (confirm('Remove this item from your favorites?')) {
      if (type === 'ad') {
        setFavoritedAds(prevAds => prevAds.filter(ad => ad.id !== itemId))
      } else {
        setFavoritedWantedRequests(prevRequests => prevRequests.filter(request => request.id !== itemId))
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
  const handleFetchMessages = async (conversationId: string): Promise<Message[]> => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        return data.messages || []
      }
      return []
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  const handleSendMessage = async (conversationId: string, content: string) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
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

  const handleCreateBusinessProfile = async () => {
    if (!businessProfile.businessName.trim()) {
      alert('Please enter a business name')
      return
    }

    setBusinessLoading(true)
    try {
      const { error } = await supabase
        .from('business_profiles')
        .insert({
          id: user!.id,
          business_name: businessProfile.businessName,
          business_type: businessProfile.businessType,
          description: businessProfile.description,
          website: businessProfile.website,
          address: businessProfile.address,
          phone: businessProfile.phone,
          operating_hours: businessProfile.operatingHours
        })

      if (error) throw error

      // Update account type to business
      await supabase
        .from('profiles')
        .update({ account_type: 'business' })
        .eq('id', user!.id)

      setHasBusinessProfile(true)
      setProfile({ ...profile, accountType: 'business' })
      alert('Business profile created successfully!')
    } catch (error) {
      console.error('Error creating business profile:', error)
      alert('Failed to create business profile')
    } finally {
      setBusinessLoading(false)
    }
  }

  const handleUpdateBusinessProfile = async () => {
    if (!businessProfile.businessName.trim()) {
      alert('Please enter a business name')
      return
    }

    setBusinessLoading(true)
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          business_name: businessProfile.businessName,
          business_type: businessProfile.businessType,
          description: businessProfile.description,
          website: businessProfile.website,
          address: businessProfile.address,
          phone: businessProfile.phone,
          operating_hours: businessProfile.operatingHours
        })
        .eq('id', user!.id)

      if (error) throw error
      alert('Business profile updated successfully!')
    } catch (error) {
      console.error('Error updating business profile:', error)
      alert('Failed to update business profile')
    } finally {
      setBusinessLoading(false)
    }
  }

  // Phone verification functions
  const handlePhoneChange = (newPhone: string) => {
    console.log('Phone changed:', { newPhone, originalPhone, changed: newPhone !== originalPhone })
    setProfile({...profile, phone: newPhone})
    
    // If phone number changed from original, trigger verification
    if (newPhone !== originalPhone && newPhone.length > 0) {
      console.log('Triggering phone verification for:', newPhone)
      setPhoneToVerify(newPhone)
      handleSendPhoneOtp(newPhone)
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
      {/* Breadcrumb */}
      <div className="bg-gray-100 border-b">
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
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-20">
              {/* Profile Header */}
              <div className="p-6 text-center border-b">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</h3>
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
                    } ${
                      tab.special 
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 my-1' 
                        : ''
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 ${tab.special ? 'text-amber-600' : ''}`} />
                    <span className={`font-medium ${tab.special ? 'text-amber-700' : ''}`}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-2xl font-semibold">
                          {isBusinessProfile ? 'Business Profile' : 'Profile Information'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                          {isBusinessProfile 
                            ? 'Manage your dealership or business information'
                            : 'Manage your personal information and preferences'
                          }
                        </p>
                      </div>
                      {isBusinessProfile && (
                        <div className="flex items-center gap-2">
                          {businessProfile.isVerified && (
                            <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </div>
                          )}
                          <a
                            href={`/dealer/${user?.id}`}
                            target="_blank"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Public Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Profile Type Toggle */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg border-2 border-black">
                      {/* Mobile Layout - Simple */}
                      <div className="block sm:hidden space-y-2">
                        <h3 className="text-sm font-medium text-gray-700">Account Type</h3>
                        <div className="flex items-center justify-start gap-2">
                          <span className="text-xs text-gray-500">Personal</span>
                          <button
                            type="button"
                            onClick={() => setIsBusinessProfile(!isBusinessProfile)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              isBusinessProfile ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                isBusinessProfile ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-xs text-gray-500">Business</span>
                        </div>
                      </div>

                      {/* Desktop Layout - Side by Side */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Profile Type</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {isBusinessProfile 
                              ? 'Managing business profile for dealership or company'
                              : 'Switch to business profile to access dealer features'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-medium ${!isBusinessProfile ? 'text-blue-600' : 'text-gray-500'}`}>
                            Personal
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsBusinessProfile(!isBusinessProfile)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isBusinessProfile ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isBusinessProfile ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className={`text-sm font-medium ${isBusinessProfile ? 'text-blue-600' : 'text-gray-500'}`}>
                            Business
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Form Content */}
                    {!isBusinessProfile ? (
                      /* Personal Profile Form */
                      <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={profile.firstName}
                              onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={profile.lastName}
                              onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <div className="relative">
                              <input
                                id="phone-input"
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="w-full px-4 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+94 11 123 4567"
                              />
                              {profile.phone && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                  {profile.phoneVerified ? (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle size={16} />
                                      <span className="text-xs font-medium">Verified</span>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={handleVerifyPhoneClick}
                                      className="flex items-center gap-1 text-orange-600 hover:text-orange-700 transition-colors"
                                    >
                                      <AlertTriangle size={16} />
                                      <span className="text-xs font-medium">Unverified</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {!profile.phoneVerified && profile.phone && (
                              <button
                                type="button"
                                onClick={handleVerifyPhoneClick}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Unverified. Click here to verify
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                          <p className="text-sm text-blue-800">
                            To change your email address or password,{' '}
                            <button
                              type="button"
                              onClick={() => handleTabChange('security')}
                              className="text-blue-600 hover:text-blue-700 font-medium underline"
                            >
                              click here
                            </button>
                            {' '}to go to Security Settings.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Business Profile Form */
                      !hasBusinessProfile ? (
                        <div className="text-center py-12">
                          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Business Profile</h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Set up your dealership profile to showcase your business, build trust with customers, 
                            and access advanced selling tools.
                          </p>
                          
                          <div className="max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                              <div className="bg-blue-50 p-6 rounded-lg">
                                <Star className="w-8 h-8 text-blue-600 mb-3" />
                                <h4 className="font-semibold text-blue-900 mb-2">Build Trust</h4>
                                <p className="text-sm text-blue-700">Verified business profile with contact information and operating hours</p>
                              </div>
                              <div className="bg-green-50 p-6 rounded-lg">
                                <Globe className="w-8 h-8 text-green-600 mb-3" />
                                <h4 className="font-semibold text-green-900 mb-2">Professional Presence</h4>
                                <p className="text-sm text-green-700">Dedicated dealer page with your branding and vehicle inventory</p>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-8">
                              <h4 className="text-lg font-semibold mb-6">Business Information</h4>
                              <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Business Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={businessProfile.businessName}
                                      onChange={(e) => setBusinessProfile({...businessProfile, businessName: e.target.value})}
                                      placeholder="e.g., City Motors, Premium Auto Sales"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Business Type
                                    </label>
                                    <select
                                      value={businessProfile.businessType}
                                      onChange={(e) => setBusinessProfile({...businessProfile, businessType: e.target.value})}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="Auto Dealer">Auto Dealer</option>
                                      <option value="Car Showroom">Car Showroom</option>
                                      <option value="Vehicle Importer">Vehicle Importer</option>
                                      <option value="Auto Parts">Auto Parts</option>
                                      <option value="Service Center">Service Center</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Website
                                    </label>
                                    <input
                                      type="url"
                                      value={businessProfile.website || ''}
                                      onChange={(e) => setBusinessProfile({...businessProfile, website: e.target.value})}
                                      placeholder="https://yourbusiness.com"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Business Phone
                                    </label>
                                    <input
                                      type="tel"
                                      value={businessProfile.phone || ''}
                                      onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                                      placeholder="+94 11 123 4567"
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Address
                                  </label>
                                  <textarea
                                    value={businessProfile.address || ''}
                                    onChange={(e) => setBusinessProfile({...businessProfile, address: e.target.value})}
                                    placeholder="Street address, city, postal code"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Description
                                  </label>
                                  <textarea
                                    value={businessProfile.description}
                                    onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                                    placeholder="Tell customers about your business, services, and what makes you special..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operating Hours
                                  </label>
                                  <input
                                    type="text"
                                    value={businessProfile.operatingHours || ''}
                                    onChange={(e) => setBusinessProfile({...businessProfile, operatingHours: e.target.value})}
                                    placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-4PM"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                                  >
                                    Create Business Profile
                                  </button>
                                  <button
                                    type="button"
                                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Existing Business Profile Form */
                        <form className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={businessProfile.businessName}
                                onChange={(e) => setBusinessProfile({...businessProfile, businessName: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Type
                              </label>
                              <select
                                value={businessProfile.businessType}
                                onChange={(e) => setBusinessProfile({...businessProfile, businessType: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="Auto Dealer">Auto Dealer</option>
                                <option value="Car Showroom">Car Showroom</option>
                                <option value="Vehicle Importer">Vehicle Importer</option>
                                <option value="Auto Parts">Auto Parts</option>
                                <option value="Service Center">Service Center</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Website
                              </label>
                              <input
                                type="url"
                                value={businessProfile.website || ''}
                                onChange={(e) => setBusinessProfile({...businessProfile, website: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Phone
                              </label>
                              <input
                                type="tel"
                                value={businessProfile.phone || ''}
                                onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Address
                            </label>
                            <textarea
                              value={businessProfile.address || ''}
                              onChange={(e) => setBusinessProfile({...businessProfile, address: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Description
                            </label>
                            <textarea
                              value={businessProfile.description}
                              onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={4}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Operating Hours
                            </label>
                            <input
                              type="text"
                              value={businessProfile.operatingHours || ''}
                              onChange={(e) => setBusinessProfile({...businessProfile, operatingHours: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )
                    )}
                  </div>
                </>
              )}

              {/* Membership Tab */}
              {activeTab === 'membership' && (
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">AutoTrader Membership</h1>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 mb-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Crown className="w-12 h-12 text-amber-600" />
                        <div>
                          <h2 className="text-xl font-semibold text-amber-900">Gold Member</h2>
                          <p className="text-amber-700">Member since January 2024</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/60 rounded-lg p-4">
                          <h3 className="font-semibold text-amber-900 mb-2">Priority Listings</h3>
                          <p className="text-sm text-amber-700">Your ads appear at the top of search results</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-4">
                          <h3 className="font-semibold text-amber-900 mb-2">AI Photo Enhancement</h3>
                          <p className="text-sm text-amber-700">Automatic photo optimization for better views</p>
                        </div>
                        <div className="bg-white/60 rounded-lg p-4">
                          <h3 className="font-semibold text-amber-900 mb-2">Unlimited Listings</h3>
                          <p className="text-sm text-amber-700">Post as many vehicles as you want</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-yellow-700">
                      Upgrade to Platinum
                    </button>
                  </div>
                </>
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
                        <div className="hidden md:block overflow-hidden">
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
                                    <div className="text-sm text-gray-600">{listing.details}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">Rs. {listing.price.toLocaleString()}</td>
                              <td className="px-4 py-4">{listing.views}</td>
                              <td className="px-4 py-4">
                                <ListingStatusBadge listing={listing} showReason={true} />
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">{listing.postedDate}</td>
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
                      <div className="md:hidden space-y-4">
                        {filteredListings.map((listing) => (
                          <div key={listing.id} className="bg-white border rounded-lg shadow-sm">
                            {/* Card Header with Image and Title */}
                            <div className="p-4">
                              <div className="flex gap-3">
                                <div className="w-20 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500 flex-shrink-0">
                                  <Camera className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/listings/${listing.id}`}
                                    className="font-medium text-blue-600 hover:text-blue-700 block"
                                  >
                                    {listing.title}
                                  </Link>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{listing.details}</p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-lg font-bold text-gray-900">Rs. {listing.price.toLocaleString()}</span>
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
                              </div>
                            </div>

                            {/* Card Info */}
                            <div className="px-4 pb-4">
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {listing.views} views
                                </span>
                                <span>{listing.postedDate}</span>
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
                        <div className="hidden md:block overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Request</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Budget</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Responses</th>
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
                                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</div>
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {request.location}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">Rs. {request.budget.toLocaleString()}</td>
                                <td className="px-4 py-4">{request.responses}</td>
                                <td className="px-4 py-4">
                                  <WantedRequestStatusBadge request={request} />
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">{request.postedDate}</td>
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
                                    <WantedRequestStatusMessage request={request} />
                                    
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
                        <div className="md:hidden space-y-4">
                          {wantedRequests.map((request) => (
                            <div key={request.id} className="bg-white border rounded-lg shadow-sm">
                              {/* Card Header */}
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                    <Link 
                                      href={`/wanted/${request.id}`}
                                      className="font-medium text-blue-600 hover:text-blue-700 block"
                                    >
                                      {request.title}
                                    </Link>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{request.description}</p>
                                  </div>
                                  <div className="relative ml-3 overflow-visible">
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
                                          href={`/wanted/edit/${request.id}`}
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
                                            ) : null}
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
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-lg font-bold text-gray-900">Rs. {request.budget.toLocaleString()}</span>
                                    <span className="text-gray-600">{request.responses} responses</span>
                                  </div>

                                  <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {request.location}
                                    </span>
                                    <span>{request.postedDate}</span>
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
                  onEmailUpdate={async (data) => {
                    await handleEmailUpdate()
                  }}
                  onPasswordUpdate={async (data) => {
                    console.log('Password update:', data)
                    // Handle password update
                  }}
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
          className="fixed inset-0 z-0" 
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