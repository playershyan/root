'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, Settings, Car, Heart, MessageSquare, Search, 
  Bell, Trash2, Shield, Crown, Check, ChevronDown,
  Upload, Edit, Share2, RefreshCw, Clock, MoreVertical,
  Camera, MapPin, Phone, Mail, Calendar, Eye, X,
  AlertTriangle, CheckCircle, Building2, Globe, Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Types
interface UserProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
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
  status: 'active' | 'pending' | 'sold'
  postedDate: string
  image?: string
}

interface Favorite {
  id: string
  title: string
  details: string
  price: number
  location: string
  status: string
  savedDate: string
}

interface WantedRequest {
  id: string
  title: string
  budget: string
  location: string
  postedBy: string
  contact: string
  description: string
  status: 'active' | 'fulfilled'
  savedDate: string
}

interface DeletedItem {
  id: string
  title: string
  type: 'listing' | 'message' | 'wanted'
  details: string
  deletedDate: string
  meta?: string
}

// Tab configurations
const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'business', label: 'Business Profile', icon: Building2 },
  { id: 'membership', label: 'AutoTrader Membership', icon: Crown, special: true },
  { id: 'listings', label: 'My Listings', icon: Car },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'wanted', label: 'My Wanted Requests', icon: Search },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'bin', label: 'Bin', icon: Trash2 },
  { id: 'security', label: 'Security', icon: Shield }
]

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
  
  // Form states
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    phone: '',
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

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
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
            membershipType: profileData.membership_type || 'basic',
            accountType: profileData.account_type || 'individual'
          })
          
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

  const [listings] = useState<Listing[]>([
    {
      id: 'prius-2020',
      title: 'Toyota Prius 2020',
      details: 'Hybrid • Automatic • 25,000 km',
      price: 4500000,
      views: 47,
      status: 'active',
      postedDate: '5 days ago'
    },
    {
      id: 'civic-2019',
      title: 'Honda Civic 2019',
      details: 'Petrol • Manual • 35,000 km',
      price: 3800000,
      views: 89,
      status: 'sold',
      postedDate: '2 weeks ago'
    },
    {
      id: 'swift-2021',
      title: 'Suzuki Swift 2021',
      details: 'Petrol • Automatic • 15,000 km',
      price: 2900000,
      views: 23,
      status: 'pending',
      postedDate: '1 day ago'
    }
  ])

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

  // Action handlers
  const handleMarkAsSold = (listingId: string) => {
    console.log('Marking as sold:', listingId)
    // Implementation here
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
                    onClick={() => setActiveTab(tab.id)}
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
                    <h1 className="text-2xl font-semibold">Profile Information</h1>
                  </div>
                  <div className="p-6">
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
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                        <p className="text-sm text-blue-800">
                          To change your email address or password,{' '}
                          <button
                            type="button"
                            onClick={() => setActiveTab('security')}
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
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200">
                        <div className="text-3xl font-bold text-blue-600">{stats.activeListings}</div>
                        <div className="text-sm text-gray-600 font-medium">Active Listings</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200">
                        <div className="text-3xl font-bold text-blue-600">{stats.totalViews}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Views</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200">
                        <div className="text-3xl font-bold text-blue-600">{stats.inquiries}</div>
                        <div className="text-sm text-gray-600 font-medium">Inquiries</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg text-center border border-gray-200">
                        <div className="text-3xl font-bold text-blue-600">{stats.soldThisMonth}</div>
                        <div className="text-sm text-gray-600 font-medium">Sold This Month</div>
                      </div>
                    </div>

                    {/* Listings Table */}
                    <div className="overflow-x-auto">
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
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  listing.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : listing.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {listing.status === 'active' ? 'Active' : 
                                   listing.status === 'pending' ? 'Under Review' : 'Sold'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">{listing.postedDate}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  {listing.status === 'active' && (
                                    <>
                                      <button
                                        onClick={() => handleMarkAsSold(listing.id)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                      >
                                        <Check className="w-3 h-3" />
                                        Mark as Sold
                                      </button>
                                      <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200">
                                        Boost
                                      </button>
                                    </>
                                  )}
                                  
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
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                        Ads
                      </button>
                      <button
                        onClick={() => setActiveFavoritesTab('wanted')}
                        className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
                          activeFavoritesTab === 'wanted'
                            ? 'text-blue-600 border-blue-600'
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                        }`}
                      >
                        Wanted Requests
                      </button>
                    </div>

                    {activeFavoritesTab === 'ads' ? (
                      <div className="text-center py-8 text-gray-500">
                        <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No saved ads yet</p>
                        <p className="text-sm mt-1">Start browsing to save your favorite vehicles</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No saved wanted requests</p>
                        <p className="text-sm mt-1">Save wanted requests that match your inventory</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <>
                  <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">Messages</h1>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">When you contact sellers or receive inquiries, they'll appear here</p>
                    </div>
                  </div>
                </>
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
                    
                    <div className="text-center py-12 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No wanted requests yet</p>
                      <p className="text-sm mt-1">Create your first wanted request to find your ideal vehicle</p>
                    </div>
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

              {/* Business Profile Tab */}
              {activeTab === 'business' && (
                <>
                  <div className="p-6 border-b flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-semibold">Business Profile</h1>
                      <p className="text-gray-600 mt-1">Manage your dealership or business information</p>
                    </div>
                    {hasBusinessProfile && (
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
                  <div className="p-6">
                    {!hasBusinessProfile ? (
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
                                    value={businessProfile.website}
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
                                    value={businessProfile.phone}
                                    onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                                    placeholder="+94 11 123 4567"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                  </label>
                                  <input
                                    type="text"
                                    value={businessProfile.address}
                                    onChange={(e) => setBusinessProfile({...businessProfile, address: e.target.value})}
                                    placeholder="123 Main Street, Colombo 03, Sri Lanka"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Business Description
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={businessProfile.description}
                                    onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                                    placeholder="Tell customers about your business, specialties, and what makes you unique..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Operating Hours
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={businessProfile.operatingHours}
                                    onChange={(e) => setBusinessProfile({...businessProfile, operatingHours: e.target.value})}
                                    placeholder="Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 9:00 AM - 4:00 PM\nSunday: Closed"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleCreateBusinessProfile}
                                disabled={businessLoading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {businessLoading ? 'Creating Business Profile...' : 'Create Business Profile'}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                              <span className="text-2xl font-bold text-white">
                                {businessProfile.businessName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-blue-900">{businessProfile.businessName}</h3>
                              <p className="text-blue-700">{businessProfile.businessType}</p>
                              {businessProfile.isVerified && (
                                <div className="flex items-center gap-1 mt-1">
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-blue-600 font-medium">Verified Business</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
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
                                value={businessProfile.website}
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
                                value={businessProfile.phone}
                                onChange={(e) => setBusinessProfile({...businessProfile, phone: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address
                              </label>
                              <input
                                type="text"
                                value={businessProfile.address}
                                onChange={(e) => setBusinessProfile({...businessProfile, address: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Business Description
                              </label>
                              <textarea
                                rows={4}
                                value={businessProfile.description}
                                onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Operating Hours
                              </label>
                              <textarea
                                rows={3}
                                value={businessProfile.operatingHours}
                                onChange={(e) => setBusinessProfile({...businessProfile, operatingHours: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleUpdateBusinessProfile}
                              disabled={businessLoading}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {businessLoading ? 'Updating...' : 'Update Business Profile'}
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
                    )}
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
    </div>
  )
}