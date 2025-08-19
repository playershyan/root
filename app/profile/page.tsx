'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, Settings, Car, Heart, MessageSquare, Search, 
  Bell, Trash2, Shield, Crown, Check, ChevronDown,
  Upload, Edit, Share2, RefreshCw, Clock, MoreVertical,
  Camera, MapPin, Phone, Mail, Calendar, Eye, X,
  AlertTriangle, CheckCircle, Building2, Globe, Star, Zap,
  ChevronRight, ArrowLeft, Send, HeartOff
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import PhoneVerificationModal from '../components/PhoneVerificationModal'

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
  const [activeFavoritesTab, setActiveFavoritesTab] = useState('ads')
  const [activeBinTab, setActiveBinTab] = useState('listings')
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
  const [searchTerm, setSearchTerm] = useState('')
  
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

  // Load user listings from Supabase
  useEffect(() => {
    const loadListings = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .order('posted_date', { ascending: false })
        
        if (error) throw error
        
        if (data) {
          // Transform the data to match our Listing interface
          const transformedListings: Listing[] = data.map(item => ({
            id: item.id,
            title: item.title || `${item.make} ${item.model} ${item.year}`,
            details: `${item.fuel_type || 'Petrol'} • ${item.transmission || 'Manual'} • ${item.mileage ? `${item.mileage.toLocaleString()} km` : 'N/A'}`,
            price: item.price,
            views: item.views || 0,
            status: item.status as 'active' | 'pending' | 'sold' | 'deleted',
            isReportedTakedown: item.is_reported_takedown || false,
            takedownReason: item.takedown_reason,
            reportCount: item.report_count || 0,
            rejectionReason: item.rejection_reason,
            postedDate: new Date(item.posted_date).toLocaleDateString(),
            image: item.primary_image_url
          }))
          setListings(transformedListings)
        }
      } catch (error) {
        console.error('Error loading listings:', error)
      } finally {
        setListingsLoading(false)
      }
    }
    
    if (!loading && user) {
      loadListings()
    }
  }, [user, loading])

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
            postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 12,
            location: 'Colombo',
          },
          {
            id: '2', 
            title: 'Honda Vezel or HR-V under 4M',
            description: 'Looking for Honda Vezel or HR-V in good condition. Any color acceptable. Must be within 4 million budget.',
            budget: 4000000,
            status: 'active',
            postedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            responses: 8,
            location: 'Kandy',
          },
          {
            id: '3',
            title: 'BMW 3 Series F30 - 2015 onwards',
            description: 'Searching for BMW 3 Series F30 model, 2015 or newer. Prefer automatic transmission.',
            budget: 8500000,
            status: 'paused',
            postedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
            responses: 5,
            location: 'Galle',
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

  // Action handlers
  const handleMarkAsSold = async (listingId: string) => {
    try {
      // Update local state immediately for better UX
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'sold' as const }
            : listing
        )
      )
      
      // Update in database
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'sold',
          sold_date: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', user?.id) // Ensure user owns the listing
      
      if (error) throw error
      
      alert('Listing marked as sold successfully!')
    } catch (error) {
      console.error('Error marking as sold:', error)
      // Revert local state on error
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'active' as const }
            : listing
        )
      )
      alert('Failed to mark listing as sold')
    }
  }
  
  const handleRelist = async (listingId: string) => {
    try {
      // Update local state - set to pending (under review)
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'pending' as const }
            : listing
        )
      )
      
      // Update in database
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'pending',
          sold_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId)
        .eq('user_id', user?.id) // Ensure user owns the listing
      
      if (error) throw error
      
      alert('Listing submitted for review. It will be active once approved.')
    } catch (error) {
      console.error('Error relisting:', error)
      // Revert local state on error
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: 'sold' as const }
            : listing
        )
      )
      alert('Failed to relist the item')
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

  const handleDelete = (itemId: string, itemType: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      console.log(`Deleting ${itemType}:`, itemId)
      // Implementation here
    }
  }

  const handleRestore = (itemId: string) => {
    console.log('Restoring:', itemId)
    // Implementation here
  }

  const handleBulkAction = (action: 'restore' | 'delete') => {
    if (selectedItems.length === 0) return
    
    if (action === 'delete' && !confirm(`Delete ${selectedItems.length} items permanently?`)) {
      return
    }
    
    console.log(`${action} items:`, selectedItems)
    setSelectedItems([])
  }

  // Wanted request action handlers
  const handlePauseWantedRequest = (requestId: string) => {
    setWantedRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'paused' as const }
          : request
      )
    )
    alert('Wanted request paused successfully!')
  }

  const handleActivateWantedRequest = (requestId: string) => {
    setWantedRequests(prevRequests => 
      prevRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'active' as const }
          : request
      )
    )
    alert('Wanted request activated successfully!')
  }

  const handleCloseWantedRequest = (requestId: string) => {
    if (confirm('Are you sure you want to close this wanted request? This action cannot be undone.')) {
      setWantedRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: 'closed' as const }
            : request
        )
      )
      alert('Wanted request closed successfully!')
    }
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
                  <div className="p-6 border-b flex justify-between items-center">
                    <h1 className="text-2xl font-semibold">My Listings</h1>
                  </div>
                  <div className="p-6">

                    {/* Listings Table */}
                    {listingsLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your listings...</p>
                      </div>
                    ) : listings.length === 0 ? (
                      <div className="text-center py-12">
                        <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-900 mb-1">No listings yet</p>
                        <p className="text-sm text-gray-600 mb-4">Start selling by posting your first vehicle</p>
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
                        <div className="hidden md:block overflow-x-auto">
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
                            {listings.map((listing) => (
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
                                <div className="space-y-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    listing.status === 'active' 
                                      ? 'bg-green-100 text-green-800'
                                      : listing.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : listing.status === 'deleted' && listing.isReportedTakedown
                                      ? 'bg-red-100 text-red-800'
                                      : listing.status === 'deleted'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {listing.status === 'active' ? 'Active' : 
                                     listing.status === 'pending' ? 'Under Review' :
                                     listing.status === 'deleted' && listing.isReportedTakedown ? 'Reported & Removed' :
                                     listing.status === 'deleted' && listing.rejectionReason ? 'Rejected' :
                                     listing.status === 'deleted' ? 'Deleted' : 'Sold'}
                                  </span>
                                  {listing.isReportedTakedown && (
                                    <p className="text-xs text-red-600 font-medium">⚠️ Removed due to reports</p>
                                  )}
                                  {listing.rejectionReason && (
                                    <p className="text-xs text-red-600">Reason: {listing.rejectionReason}</p>
                                  )}
                                </div>
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

                                  {(listing.status === 'deleted' && (listing.isReportedTakedown || listing.rejectionReason)) && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 space-y-2">
                                      <p className="text-xs text-red-700 font-medium mb-2">
                                        {listing.isReportedTakedown ? 'Your listing was reported and removed' : 'Your listing was rejected'}
                                      </p>
                                      <div className="flex gap-2">
                                        <Link 
                                          href={`/post?edit=${listing.id}`}
                                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 inline-flex items-center gap-1 font-medium transition-all"
                                        >
                                          <Edit className="w-3 h-3" />
                                          Edit
                                        </Link>
                                        <button
                                          onClick={() => handleRelist(listing.id)}
                                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 flex items-center gap-1 font-medium transition-all"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                          Relist
                                        </button>
                                      </div>
                                    </div>
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
                                    <div className="relative">
                                    <button
                                      onClick={() => setShowActionMenu(showActionMenu === listing.id ? null : listing.id)}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                    
                                    {showActionMenu === listing.id && (
                                      <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
                                        <button 
                                          onClick={() => handleShare(listing.id)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Share2 className="w-4 h-4" />
                                          Share Listing
                                        </button>
                                        <Link 
                                          href={`/post?edit=${listing.id}`}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit Listing
                                        </Link>
                                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                          <RefreshCw className="w-4 h-4" />
                                          Renew Listing
                                        </button>
                                        <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                          <Clock className="w-4 h-4" />
                                          Mark as Pending
                                        </button>
                                        <hr className="my-2" />
                                        <button 
                                          onClick={() => handleDelete(listing.id, 'listing')}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Move to Bin
                                        </button>
                                      </div>
                                    )}
                                  </div>
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
                        {listings.map((listing) => (
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
                                    <div className="relative">
                                      <button
                                        onClick={() => setShowActionMenu(showActionMenu === listing.id ? null : listing.id)}
                                        className="p-2 hover:bg-gray-100 rounded-full"
                                      >
                                        <MoreVertical className="w-5 h-5" />
                                      </button>
                                      
                                      {showActionMenu === listing.id && (
                                        <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
                                          <button 
                                            onClick={() => handleShare(listing.id)}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            <Share2 className="w-4 h-4" />
                                            Share Listing
                                          </button>
                                          <Link 
                                            href={`/post?edit=${listing.id}`}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                          >
                                            <Edit className="w-4 h-4" />
                                            Edit Listing
                                          </Link>
                                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" />
                                            Renew Listing
                                          </button>
                                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Mark as Pending
                                          </button>
                                          <hr className="my-2" />
                                          <button 
                                            onClick={() => handleDelete(listing.id, 'listing')}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                            Move to Bin
                                          </button>
                                        </div>
                                      )}
                                    </div>
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
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  listing.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : listing.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : listing.status === 'deleted' && listing.isReportedTakedown
                                    ? 'bg-red-100 text-red-800'
                                    : listing.status === 'deleted'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {listing.status === 'active' ? 'Active' : 
                                   listing.status === 'pending' ? 'Under Review' :
                                   listing.status === 'deleted' && listing.isReportedTakedown ? 'Reported & Removed' :
                                   listing.status === 'deleted' && listing.rejectionReason ? 'Rejected' :
                                   listing.status === 'deleted' ? 'Deleted' : 'Sold'}
                                </span>
                                {listing.isReportedTakedown && (
                                  <p className="text-xs text-red-600 font-medium mt-1">⚠️ Removed due to reports</p>
                                )}
                                {listing.rejectionReason && (
                                  <p className="text-xs text-red-600 mt-1">Reason: {listing.rejectionReason}</p>
                                )}
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

                                {(listing.status === 'deleted' && (listing.isReportedTakedown || listing.rejectionReason)) && (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-xs text-red-700 font-medium mb-2">
                                      {listing.isReportedTakedown ? 'Your listing was reported and removed' : 'Your listing was rejected'}
                                    </p>
                                    <div className="flex gap-2">
                                      <Link 
                                        href={`/post?edit=${listing.id}`}
                                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-xs hover:bg-red-700 flex items-center justify-center gap-1 font-medium transition-all"
                                      >
                                        <Edit className="w-3 h-3" />
                                        Edit & Resubmit
                                      </Link>
                                      <button
                                        onClick={() => handleRelist(listing.id)}
                                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-xs hover:bg-blue-700 flex items-center justify-center gap-1 font-medium transition-all"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                        Relist
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
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
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">My Favorites</h1>
                  </div>
                  <div className="p-6">
                    <div className="flex border-b mb-6">
                      <button
                        onClick={() => setActiveFavoritesTab('ads')}
                        className={`pb-3 px-1 mr-8 font-medium border-b-2 transition-colors ${
                          activeFavoritesTab === 'ads'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                      >
                        Ads ({favoritedAds.length})
                      </button>
                      <button
                        onClick={() => setActiveFavoritesTab('wanted')}
                        className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
                          activeFavoritesTab === 'wanted'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                      >
                        Wanted Requests ({favoritedWantedRequests.length})
                      </button>
                    </div>

                    {favoritesLoading ? (
                      <div className="text-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your favorites...</p>
                      </div>
                    ) : (
                      <>
                        {/* Favorited Ads */}
                        {activeFavoritesTab === 'ads' && (
                          <>
                            {favoritedAds.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">
                                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No saved ads yet</p>
                                <p className="text-sm mt-1">Start browsing to save your favorite vehicles</p>
                                <Link
                                  href="/listings"
                                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block mt-4"
                                >
                                  Browse Vehicles
                                </Link>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {favoritedAds.map((ad) => (
                                  <div key={ad.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                    {/* Image */}
                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                      <Camera className="w-12 h-12 text-gray-400" />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <Link 
                                          href={`/listings/${ad.id}`}
                                          className="font-medium text-blue-600 hover:text-blue-700 block flex-1"
                                        >
                                          {ad.title}
                                        </Link>
                                        <div className="relative ml-2">
                                          <button
                                            onClick={() => setShowActionMenu(showActionMenu === ad.id ? null : ad.id)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                          
                                          {showActionMenu === ad.id && (
                                            <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
                                              <Link
                                                href={`/listings/${ad.id}`}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                              >
                                                <Eye className="w-4 h-4" />
                                                View Listing
                                              </Link>
                                              <button 
                                                onClick={() => handleShareFavorite(ad.id, 'ad')}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                              >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                              </button>
                                              <hr className="my-2" />
                                              <button 
                                                onClick={() => handleRemoveFromFavorites(ad.id, 'ad')}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                              >
                                                <HeartOff className="w-4 h-4" />
                                                Remove from Favorites
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.description}</p>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-lg font-bold text-gray-900">Rs. {ad.price.toLocaleString()}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {ad.location}
                                          </span>
                                          <span>{ad.postedDate}</span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600">
                                          By: {ad.seller}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex gap-2 mt-4">
                                        <Link
                                          href={`/listings/${ad.id}`}
                                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 text-center font-medium transition-all"
                                        >
                                          View Details
                                        </Link>
                                        <button
                                          onClick={() => handleRemoveFromFavorites(ad.id, 'ad')}
                                          className="bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-300 transition-all"
                                        >
                                          <HeartOff className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Favorited Wanted Requests */}
                        {activeFavoritesTab === 'wanted' && (
                          <>
                            {favoritedWantedRequests.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">
                                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No saved wanted requests</p>
                                <p className="text-sm mt-1">Save wanted requests that match your inventory</p>
                                <Link
                                  href="/wanted"
                                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block mt-4"
                                >
                                  Browse Wanted Requests
                                </Link>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {favoritedWantedRequests.map((request) => (
                                  <div key={request.id} className="bg-white border rounded-lg shadow-sm">
                                    <div className="p-4">
                                      <div className="flex justify-between items-start mb-2">
                                        <Link 
                                          href={`/wanted/${request.id}`}
                                          className="font-medium text-blue-600 hover:text-blue-700 block flex-1"
                                        >
                                          {request.title}
                                        </Link>
                                        <div className="relative ml-2">
                                          <button
                                            onClick={() => setShowActionMenu(showActionMenu === request.id ? null : request.id)}
                                            className="p-1 hover:bg-gray-100 rounded"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </button>
                                          
                                          {showActionMenu === request.id && (
                                            <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
                                              <Link
                                                href={`/wanted/${request.id}`}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                              >
                                                <Eye className="w-4 h-4" />
                                                View Request
                                              </Link>
                                              <button 
                                                onClick={() => handleShareFavorite(request.id, 'wanted')}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                              >
                                                <Share2 className="w-4 h-4" />
                                                Share
                                              </button>
                                              <hr className="my-2" />
                                              <button 
                                                onClick={() => handleRemoveFromFavorites(request.id, 'wanted')}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                              >
                                                <HeartOff className="w-4 h-4" />
                                                Remove from Favorites
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                                      
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-lg font-bold text-gray-900">Budget: Rs. {request.price.toLocaleString()}</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {request.location}
                                          </span>
                                          <span>{request.postedDate}</span>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600">
                                          By: {request.seller}
                                        </div>
                                      </div>
                                      
                                      {/* Action Buttons */}
                                      <div className="flex gap-2 mt-4">
                                        <Link
                                          href={`/wanted/${request.id}`}
                                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 text-center font-medium transition-all"
                                        >
                                          View Request
                                        </Link>
                                        <button
                                          onClick={() => handleRemoveFromFavorites(request.id, 'wanted')}
                                          className="bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-300 transition-all"
                                        >
                                          <HeartOff className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <MessagesTab />
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
                        <div className="hidden md:block overflow-x-auto">
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
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    request.status === 'active' 
                                      ? 'bg-green-100 text-green-800'
                                      : request.status === 'paused'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : request.status === 'closed'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {request.status === 'active' ? 'Active' : 
                                     request.status === 'paused' ? 'Paused' :
                                     request.status === 'closed' ? 'Closed' : 'Deleted'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600">{request.postedDate}</td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2">
                                    {request.status === 'active' && (
                                      <button
                                        onClick={() => handlePauseWantedRequest(request.id)}
                                        className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-700 flex items-center gap-1 font-medium transition-all"
                                      >
                                        <Clock className="w-3 h-3" />
                                        Pause
                                      </button>
                                    )}

                                    {request.status === 'paused' && (
                                      <button
                                        onClick={() => handleActivateWantedRequest(request.id)}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1 font-medium transition-all"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        Activate
                                      </button>
                                    )}

                                    {(request.status === 'active' || request.status === 'paused') && (
                                      <button
                                        onClick={() => handleCloseWantedRequest(request.id)}
                                        className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1 font-medium transition-all"
                                      >
                                        <X className="w-3 h-3" />
                                        Close
                                      </button>
                                    )}
                                    
                                    <div className="relative">
                                      <button
                                        onClick={() => setShowActionMenu(showActionMenu === request.id ? null : request.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      
                                      {showActionMenu === request.id && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
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
                                  <div className="relative ml-3">
                                    <button
                                      onClick={() => setShowActionMenu(showActionMenu === request.id ? null : request.id)}
                                      className="p-2 hover:bg-gray-100 rounded-full"
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </button>
                                    
                                    {showActionMenu === request.id && (
                                      <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg py-2 z-10 w-48">
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
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      request.status === 'active' 
                                        ? 'bg-green-100 text-green-800'
                                        : request.status === 'paused'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : request.status === 'closed'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {request.status === 'active' ? 'Active' : 
                                       request.status === 'paused' ? 'Paused' :
                                       request.status === 'closed' ? 'Closed' : 'Deleted'}
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-2">
                                    {request.status === 'active' && (
                                      <button
                                        onClick={() => handlePauseWantedRequest(request.id)}
                                        className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-yellow-700 flex items-center justify-center gap-2 font-medium transition-all"
                                      >
                                        <Clock className="w-4 h-4" />
                                        Pause
                                      </button>
                                    )}

                                    {request.status === 'paused' && (
                                      <button
                                        onClick={() => handleActivateWantedRequest(request.id)}
                                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2 font-medium transition-all"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Activate
                                      </button>
                                    )}

                                    {(request.status === 'active' || request.status === 'paused') && (
                                      <button
                                        onClick={() => handleCloseWantedRequest(request.id)}
                                        className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-2 font-medium transition-all"
                                      >
                                        <X className="w-4 h-4" />
                                        Close Request
                                      </button>
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
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">Notification Preferences</h1>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Email Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'emailNewMatches', label: 'New matches for my wanted requests' },
                          { key: 'emailPriceDrops', label: 'Price drops on favorited vehicles' },
                          { key: 'emailMessages', label: 'New messages from buyers/sellers' },
                          { key: 'emailListingUpdates', label: 'Updates on my listings' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) => setNotifications({
                                ...notifications,
                                [item.key]: e.target.checked
                              })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold mb-4">SMS Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'smsUrgent', label: 'Urgent messages only' },
                          { key: 'smsSecurity', label: 'Security alerts' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) => setNotifications({
                                ...notifications,
                                [item.key]: e.target.checked
                              })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Marketing Communications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'marketingNewsletter', label: 'Weekly newsletter with market insights' },
                          { key: 'marketingPromotions', label: 'Special offers and promotions' }
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={(e) => setNotifications({
                                ...notifications,
                                [item.key]: e.target.checked
                              })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                      Save Preferences
                    </button>
                  </div>
                </>
              )}

              {/* Bin Tab */}
              {activeTab === 'bin' && (
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">Bin</h1>
                  </div>
                  <div className="p-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900">Items are automatically deleted after 30 days</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Deleted items will be permanently removed from your account after 30 days in the bin.
                        </p>
                      </div>
                    </div>

                    <div className="flex border-b mb-6">
                      {['listings', 'messages', 'wanted'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveBinTab(tab)}
                          className={`pb-3 px-1 mr-8 font-medium border-b-2 transition-colors capitalize ${
                            activeBinTab === tab
                              ? 'text-blue-600 border-blue-600'
                              : 'text-gray-600 border-transparent hover:text-gray-900'
                          }`}
                        >
                          Deleted {tab === 'wanted' ? 'Wanted Requests' : tab}
                        </button>
                      ))}
                    </div>

                    {selectedItems.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => setSelectedItems([])}
                            className="w-4 h-4"
                          />
                          <span className="font-medium">{selectedItems.length} items selected</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleBulkAction('restore')}
                            className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                          >
                            Restore Selected
                          </button>
                          <button
                            onClick={() => handleBulkAction('delete')}
                            className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-center py-12 text-gray-500">
                      <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Bin is empty</p>
                      <p className="text-sm mt-1">Deleted items will appear here</p>
                    </div>
                  </div>
                </>
              )}


              {/* Security Tab */}
              {activeTab === 'security' && (
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">Security Settings</h1>
                  </div>
                  <div className="p-6 space-y-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Email Address</h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Email
                          </label>
                          <div>
                            <input
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                            />
                            {!emailVerified && (
                              <div className="mt-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span className="text-sm text-amber-600 font-medium">
                                  Unverified - Check your email to verify
                                </span>
                              </div>
                            )}
                            {emailVerified && user?.email && (
                              <div className="mt-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600 font-medium">
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Enter new email address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Email
                          </label>
                          <input
                            type="email"
                            value={confirmEmail}
                            onChange={(e) => setConfirmEmail(e.target.value)}
                            placeholder="Confirm new email address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        {emailUpdateSuccess && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-700">
                              Email updated successfully! Please check your inbox at <strong>{user?.email}</strong> for a verification link.
                            </p>
                          </div>
                        )}
                        <button 
                          onClick={handleEmailUpdate}
                          disabled={emailUpdateLoading}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {emailUpdateLoading ? 'Updating...' : 'Update Email'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            placeholder="Enter new password (min. 6 characters)"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium">
                          Update Password
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                      <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Authentication</p>
                          <p className="text-sm text-gray-600 mt-1">Receive verification codes via SMS</p>
                        </div>
                        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium">
                          Enable
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Chrome on Windows</p>
                            <p className="text-sm text-gray-600">Current session • Colombo, Sri Lanka</p>
                          </div>
                          <span className="text-green-600 text-sm font-medium">Active</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Safari on iPhone</p>
                            <p className="text-sm text-gray-600">Last active 2 days ago • Negombo, Sri Lanka</p>
                          </div>
                          <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-900">Delete Account</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
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
      {console.log('Modal render state:', { showPhoneVerification, phoneToVerify })}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        phoneNumber={phoneToVerify}
        onPhoneNumberEdit={handlePhoneNumberEdit}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  )

  // Messages Tab Component  
  function MessagesTab() {
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

    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages/conversations')
        if (response.ok) {
          const data = await response.json()
          setConversations(data.conversations || [])
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }

    const fetchMessages = async (conversationId: string) => {
      setLoadingMessages(true)
      try {
        const response = await fetch(`/api/messages/${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setLoadingMessages(false)
      }
    }

    const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || sendingMessage || !selectedConversation) return

      setSendingMessage(true)
      try {
        const response = await fetch(`/api/messages/${selectedConversation}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage })
        })

        if (response.ok) {
          const data = await response.json()
          setMessages([...messages, data.message])
          setNewMessage('')
        }
      } catch (error) {
        console.error('Error sending message:', error)
      } finally {
        setSendingMessage(false)
      }
    }

    const filteredConversations = conversations.filter(conv => {
      if (searchTerm === '') return true
      const otherUser = conv.current_user_role === 'buyer' 
        ? conv.seller.profiles.name 
        : conv.buyer.profiles.name
      return conv.listing_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (otherUser?.toLowerCase().includes(searchTerm.toLowerCase()))
    })

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60))
          return `${minutes}m ago`
        }
        return `${hours}h ago`
      } else if (days < 7) {
        return `${days}d ago`
      } else {
        return date.toLocaleDateString()
      }
    }

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price).replace('LKR', 'Rs.')
    }

    if (selectedConversation) {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) return null

      const otherUser = conversation.current_user_role === 'buyer' 
        ? conversation.seller
        : conversation.buyer

      const currentUserId = user?.id

      return (
        <>
          {/* Conversation Header */}
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedConversation(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{otherUser.profiles.name || 'User'}</h2>
                    <p className="text-sm text-gray-500">
                      {conversation.current_user_role === 'buyer' ? 'Seller' : 'Buyer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Listing Info */}
              <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                {conversation.listing_image_url ? (
                  <img
                    src={conversation.listing_image_url}
                    alt={conversation.listing_title}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                )}
                <div className="text-right">
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {conversation.listing_title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(conversation.listing_price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 h-96">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isCurrentUser = message.sender_id === currentUserId
                const showDate = index === 0 || 
                  new Date(messages[index - 1].created_at).toDateString() !== 
                  new Date(message.created_at).toDateString()

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {formatDate(message.created_at).split(' ')[0]}
                      </div>
                    )}
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : ''}`}>
                        <div 
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${
                          isCurrentUser ? 'text-right' : ''
                        }`}>
                          {formatDate(message.created_at).split(' ').slice(1).join(' ')}
                          {isCurrentUser && message.is_read && ' • Read'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="border-t px-6 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sendingMessage}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )
    }

    // Conversations List View
    return (
      <>
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Messages
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-2">
                When you contact sellers about their listings, your conversations will appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map(conversation => {
              const otherUser = conversation.current_user_role === 'buyer' 
                ? conversation.seller.profiles
                : conversation.buyer.profiles
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className="block w-full hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      {/* Listing Image */}
                      <div className="flex-shrink-0">
                        {conversation.listing_image_url ? (
                          <img
                            src={conversation.listing_image_url}
                            alt={conversation.listing_title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Conversation Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {otherUser.name || 'User'}
                              </h3>
                              {conversation.unread_count > 0 && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                                  {conversation.unread_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.listing_title} • {formatPrice(conversation.listing_price)}
                            </p>
                            {conversation.last_message_preview && (
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {conversation.last_message_preview}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{formatDate(conversation.last_message_at)}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </>
    )
  }
}