'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import {
  Heart, User, Search, Menu, X, Bell,
  Car, MessageSquare, Settings, LogOut,
  Crown, Shield, FileText, Plus, Globe, Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthModal } from './auth'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'
import { useNotificationCount } from '@/lib/hooks/useWantedNotifications'
import { useAuthWithRedirect } from '../hooks/useAuthWithRedirect'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  unreadMessages?: number
  favorites?: number
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const unreadMessages = useUnreadMessages()
  const { count: wantedNotificationCount } = useNotificationCount()

  // Auth with redirect hook
  const { showAuthModal, openAuthWithRedirect, closeAuth, handleAuthSuccess } = useAuthWithRedirect()

  // Centralized function to check for showLogin flag
  const checkForShowLogin = (source = 'mount') => {
    const shouldShowLogin = localStorage.getItem('showLoginModal')
    console.log(`Header: ${source} check - localStorage showLoginModal:`, shouldShowLogin)
    if (shouldShowLogin === 'true') {
      console.log(`Header: ${source} check - Found showLoginModal=true, opening modal`)
      openAuthWithRedirect(window.location.pathname) // Use hook to open modal
      setShowEmailLogin(true)
      localStorage.removeItem('showLoginModal')
    }
  }

  // Check on mount
  useEffect(() => {
    checkForShowLogin('mount')

    // Also check after any localStorage changes (different tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showLoginModal') {
        checkForShowLogin('storage')
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Check on route changes (KEY FIX for same-tab navigation)
  useEffect(() => {
    checkForShowLogin('route-change')
  }, [pathname])

  // Also check when the window receives focus
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => checkForShowLogin('focus'), 100)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  
  // Get user from auth context
  const { user: authUser, signOut } = useAuth()
  const user = authUser ? {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    unreadMessages: unreadMessages,
    favorites: 0
  } : null

  const displayName = user?.name || authUser?.email || 'User'
  const avatarUrl = (authUser?.user_metadata?.avatar_url as string)
    || (authUser?.user_metadata?.picture as string)
    || (authUser?.user_metadata?.profile_image_url as string)
    || ''

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile menu button + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-blue-600">VERA</span>
            </Link>
          </div>
          
          {/* Center Navigation - Desktop Only */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </Link>
            <Link href="/listings" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Browse Vehicles
            </Link>
            <Link href="/wanted" className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative">
              Wanted Requests
              {wantedNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </Link>
          </div>
          
          {/* Right side - Notifications + User Menu + Primary CTA */}
          <div className="flex items-center gap-3">
            {/* Notifications - Desktop Only */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {/* Messages Notification */}
                {unreadMessages > 0 && (
                  <Link
                    href="/profile/messages"
                    className="relative p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Messages"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                      {unreadMessages > 10 ? '10+' : unreadMessages}
                    </span>
                  </Link>
                )}
                
                {/* Wanted Requests Notification */}
                {wantedNotificationCount > 0 && (
                  <Link
                    href="/wanted"
                    className="relative p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Wanted Requests"
                  >
                    <Search className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {wantedNotificationCount > 9 ? '9+' : wantedNotificationCount}
                    </span>
                  </Link>
                )}
              </div>
            )}
            
            {/* User Menu / Auth Button - Desktop Only */}
            {user ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={32} height={32} className="object-cover w-8 h-8" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-full max-w-xs sm:w-64 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <div className="px-4 py-3 border-b">
                      <p className="font-medium text-gray-900">{displayName}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      
                      <Link
                        href="/profile/listings"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Car className="w-4 h-4" />
                        My Listings
                      </Link>

                      <Link
                        href="/profile/messages"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Messages
                        {unreadMessages > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/profile/favorites"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="w-4 h-4" />
                        Favorites
                      </Link>

                      <Link
                        href="/profile/wanted"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FileText className="w-4 h-4" />
                        Wanted Requests
                      </Link>
                      <Link
                        href="/profile/notifications"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell className="w-4 h-4" />
                        Notifications
                      </Link>
                      <Link
                        href="/profile/bin"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Bin
                      </Link>
                    </div>

                    <hr className="my-2" />

                    <div className="py-2">
                      <Link
                        href="/profile/security"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-sm sm:text-base"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Shield className="w-4 h-4" />
                        Security
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleLogout()
                          setUserMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3 text-sm sm:text-base"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  openAuthWithRedirect(pathname)
                  setShowEmailLogin(false)
                }}
                className="hidden sm:flex p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                title="Sign In / Sign Up"
              >
                <User className="w-5 h-5" />
              </button>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Post Wanted Request - Desktop only, blue text with outlined icon */}
              {user ? (
                <Link
                  href="/wanted/post"
                  className="hidden sm:flex text-blue-600 hover:text-blue-700 font-medium transition-colors items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Post Wanted</span>
                </Link>
              ) : (
                <button
                  onClick={() => openAuthWithRedirect('/wanted/post')}
                  className="hidden sm:flex text-blue-600 hover:text-blue-700 font-medium transition-colors items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Post Wanted</span>
                </button>
              )}

              {/* Wanted Button - Mobile Only */}
              <Link
                href="/wanted"
                className="sm:hidden text-gray-600 hover:text-blue-600 font-medium items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors flex flex-col text-xs"
              >
                <Search className="w-3 h-3" />
                <span>Wanted</span>
              </Link>

              {/* Browse Button - Mobile Only */}
              <Link
                href="/listings"
                className="sm:hidden text-gray-600 hover:text-blue-600 font-medium items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors flex flex-col text-xs"
              >
                <Globe className="w-3 h-3" />
                <span>Browse</span>
              </Link>
              
              {/* User Icon Button - Mobile Only */}
              {user ? (
                <Link
                  href="/profile"
                  className="sm:hidden text-gray-600 hover:text-blue-600 font-medium items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors flex flex-col text-xs"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={24} height={24} className="object-cover w-6 h-6" />
                    ) : (
                      <span className="text-white text-[10px] font-medium">
                        {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() => openAuthWithRedirect(pathname)}
                  className="sm:hidden text-gray-600 hover:text-blue-600 font-medium items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors flex flex-col text-xs"
                >
                  <User className="w-3 h-3" />
                  <span>User</span>
                </button>
              )}
              
              {/* Primary CTA - Sell (Desktop Only) */}
              {user ? (
                <Link
                  href="/post"
                  className="hidden sm:flex bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-medium transition-colors items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Car className="w-4 h-4" />
                  <span>Sell</span>
                </Link>
              ) : (
                <button
                  onClick={() => openAuthWithRedirect('/post')}
                  className="hidden sm:flex bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 font-medium transition-colors items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Car className="w-4 h-4" />
                  <span>Sell</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          closeAuth()
          setShowEmailLogin(false)
        }}
        allowedMethods={showEmailLogin ? ['email'] : ['google', 'email', 'phone']}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Mobile Menu - Drawer Style */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl md:hidden transform transition-transform duration-300 ease-out overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{user.name}</h2>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                </div>
              ) : (
                <Link href="/" className="text-xl font-bold text-blue-600">
                  VERA
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="p-4">
              {/* Sign In Button for Non-Authenticated Users */}
              {!user && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      openAuthWithRedirect(pathname)
                      setShowEmailLogin(false)
                    }}
                    className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Sign In / Sign Up
                  </button>
                </div>
              )}

              {/* Main Navigation */}
              <div className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Navigation
                </h3>
                <div className="space-y-1">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">Home</span>
                  </Link>
                  <Link
                    href="/listings"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Browse Vehicles</span>
                  </Link>
                  <Link
                    href="/wanted"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Search className="w-5 h-5" />
                    <span className="font-medium flex-1">Wanted Requests</span>
                    {wantedNotificationCount > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </Link>
                </div>
              </div>

              {/* User Account Section */}
              {user && (
                <div className="mb-4">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    My Account
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">My Profile</span>
                    </Link>
                    <Link
                      href="/profile/listings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <Car className="w-5 h-5" />
                      <span className="font-medium">My Listings</span>
                    </Link>
                    <Link
                      href="/profile/messages"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium flex-1">Messages</span>
                      {unreadMessages > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadMessages}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/profile/favorites"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="font-medium">Favorites</span>
                    </Link>
                    <Link
                      href="/profile/wanted"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">My Wanted Requests</span>
                    </Link>
                    <Link
                      href="/profile/notifications"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <Bell className="w-5 h-5" />
                      <span className="font-medium">Notifications</span>
                    </Link>
                    <Link
                      href="/profile/bin"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                      onClick={(e) => {
                        setTimeout(() => setMobileMenuOpen(false), 100)
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="font-medium">Bin</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Primary Actions */}
              <div className="space-y-3 mb-4">
                {user ? (
                  <Link
                    href="/post"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold"
                    onClick={(e) => {
                      setTimeout(() => setMobileMenuOpen(false), 100)
                    }}
                  >
                    <Car className="w-5 h-5" />
                    Sell My Vehicle
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      openAuthWithRedirect('/post')
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold"
                  >
                    <Car className="w-5 h-5" />
                    Sell My Vehicle
                  </button>
                )}
                {user ? (
                  <Link
                    href="/wanted/post"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold"
                    onClick={(e) => {
                      setTimeout(() => setMobileMenuOpen(false), 100)
                    }}
                  >
                    <Search className="w-5 h-5" />
                    Post Wanted Request
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      openAuthWithRedirect('/wanted/post')
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold"
                  >
                    <Search className="w-5 h-5" />
                    Post Wanted Request
                  </button>
                )}
              </div>

              {/* Settings & Logout */}
              {user && (
                <div className="border-t pt-4">
                  <Link
                    href="/profile/security"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">Account Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </header>
  )
}