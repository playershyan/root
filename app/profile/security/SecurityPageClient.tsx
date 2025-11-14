'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import SecurityTab from '@/app/components/security/SecurityTab'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface SecurityInfo {
  email: string
  phone?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  has_password: boolean
  mfa_enabled: boolean
  last_sign_in_at?: string
  created_at: string
}

interface SecurityPageClientProps {
  user: User
  security: SecurityInfo
}

export default function SecurityPageClient({ user, security }: SecurityPageClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [hasExistingPassword, setHasExistingPassword] = useState(security.has_password)
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'phone'>('email')
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Detect authentication providers
  useEffect(() => {
    const providers = user.identities?.map(identity => identity.provider) ?? []
    const hasEmailProvider = providers.includes('email')

    setHasExistingPassword(hasEmailProvider)

    if (providers.includes('google')) {
      setAuthProvider('google')
    } else if (providers.includes('phone')) {
      setAuthProvider('phone')
    } else {
      setAuthProvider('email')
    }
  }, [user])

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!error && data.session) {
          // For now, just show current session
          setSessions([{
            id: 'current',
            created_at: data.session.created_at,
            ip_address: null,
            user_agent: null,
            is_current: true
          }])
        }
      } catch (error) {
        logger.error('Failed to fetch sessions', error as Error)
      }
    }
    fetchSessions()
  }, [supabase])

  // Handle email update
  const handleEmailUpdate = async (data: any) => {
    logger.debug('Email update requested', {
      component: 'SecurityPageClient',
      action: 'handleEmailUpdate'
    })
    toast.info('Email update functionality coming soon')
  }

  // Handle password update
  const handlePasswordUpdate = async (data: {
    currentPassword?: string
    newPassword: string
    confirmPassword: string
  }) => {
    setLoading(true)
    try {
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      // Validate password strength
      if (data.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

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

      toast.success('Password updated successfully')
      router.refresh()
    } catch (error) {
      logger.error('Failed to update password', error as Error, {
        component: 'SecurityPageClient',
        action: 'handlePasswordUpdate'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to update password')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Handle 2FA update
  const handleTwoFactorUpdate = async (data: any) => {
    logger.debug('2FA update requested', {
      component: 'SecurityPageClient',
      action: 'handleTwoFactorUpdate',
      data
    })
    toast.info('Two-factor authentication coming soon')
  }

  // Handle session updates
  const handleSessionUpdate = async (data: any) => {
    setLoading(true)
    try {
      if (data.action === 'refresh') {
        // Refresh sessions list
        const { data: sessionData, error } = await supabase.auth.getSession()
        if (!error && sessionData.session) {
          setSessions([{
            id: 'current',
            created_at: sessionData.session.created_at,
            ip_address: null,
            user_agent: null,
            is_current: true
          }])
        }
      } else if (data.action === 'revoke' && data.sessionId) {
        // Revoke specific session
        await supabase.auth.signOut()
        router.push('/')
      } else if (data.action === 'revokeAll') {
        // Revoke all other sessions (sign out everywhere)
        await supabase.auth.signOut({ scope: 'others' })
        toast.success('Signed out from all other devices')
      }
    } catch (error) {
      logger.error('Failed to update session', error as Error)
      toast.error('Failed to update session')
    } finally {
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/browse')
      toast.success('Signed out successfully')
    } catch (error) {
      logger.error('Failed to sign out', error as Error)
      toast.error('Failed to sign out')
    } finally {
      setLoading(false)
    }
  }

  // Handle account deletion
  const handleAccountDelete = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully')
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      logger.error('Failed to delete account', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <SecurityTab
          emailData={{
            email: security.email,
            verified: security.email_confirmed_at != null
          }}
          passwordData={{
            hasPassword: hasExistingPassword,
            provider: authProvider
          }}
          sessionsData={{
            sessions,
            loading: false,
            refreshSessions: () => handleSessionUpdate({ action: 'refresh' }),
            revokeSession: (sessionId: string) => handleSessionUpdate({ action: 'revoke', sessionId }),
            revokeAllOtherSessions: () => handleSessionUpdate({ action: 'revokeAll' })
          }}
          twoFactorData={{
            isEnabled: security.mfa_enabled,
            method: 'sms'
          }}
          hasExistingPassword={hasExistingPassword}
          authProvider={authProvider}
          onEmailUpdate={handleEmailUpdate}
          onPasswordUpdate={handlePasswordUpdate}
          onTwoFactorUpdate={handleTwoFactorUpdate}
          onSessionUpdate={handleSessionUpdate}
          onAccountDelete={handleAccountDelete}
          onLogout={handleLogout}
          loading={loading}
        />
      </div>
    </div>
  )
}

