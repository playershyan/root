'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useSessionManager } from '@/app/hooks/useSessionManager'
import SecurityTab from '@/app/components/security/SecurityTab'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export default function SecurityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const sessions = useSessionManager()

  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'phone'>('email')

  // Detect authentication providers
  useEffect(() => {
    const detectAuthProviders = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser?.identities) {
          const providers = authUser.identities.map(i => i.provider)
          const hasEmailProvider = providers.includes('email')
          setHasExistingPassword(hasEmailProvider)

          if (providers.includes('google')) {
            setAuthProvider('google')
          } else if (providers.includes('phone')) {
            setAuthProvider('phone')
          } else {
            setAuthProvider('email')
          }
        }
      } catch (error) {
        logger.error('Failed to detect auth providers', error as Error, {
          component: 'SecurityPage',
          action: 'detectAuthProviders'
        })
      }
    }

    if (user) {
      detectAuthProviders()
    }
  }, [user])

  // Handle email update
  const handleEmailUpdate = async () => {
    // TODO: Implement email update functionality
    logger.debug('Email update requested', {
      component: 'SecurityPage',
      action: 'handleEmailUpdate'
    })
  }

  // Handle password update
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
      logger.error('Failed to update password', error as Error, {
        component: 'SecurityPage',
        action: 'handlePasswordUpdate'
      })
      throw error
    }
  }

  // Handle 2FA update
  const handleTwoFactorUpdate = async (data: any) => {
    logger.debug('2FA update requested', {
      component: 'SecurityPage',
      action: 'handleTwoFactorUpdate',
      data
    })
    // TODO: Implement 2FA functionality
  }

  // Handle session updates
  const handleSessionUpdate = async (data: any) => {
    if (data.action === 'refresh') {
      await sessions.refreshSessions()
    } else if (data.action === 'revoke' && data.sessionId) {
      await sessions.revokeSession(data.sessionId)
    } else if (data.action === 'revokeAll') {
      await sessions.revokeAllOtherSessions()
    }
  }

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/browse')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <SecurityTab
          emailData={{
            email: user?.email || '',
            verified: user?.email_confirmed_at != null
          }}
          passwordData={{
            hasPassword: hasExistingPassword,
            provider: authProvider
          }}
          sessionsData={sessions}
          twoFactorData={{
            isEnabled: false,
            method: 'sms'
          }}
          hasExistingPassword={hasExistingPassword}
          authProvider={authProvider}
          onEmailUpdate={handleEmailUpdate}
          onPasswordUpdate={handlePasswordUpdate}
          onTwoFactorUpdate={handleTwoFactorUpdate}
          onSessionUpdate={handleSessionUpdate}
          onLogout={handleLogout}
          loading={sessions.loading}
        />
      </div>
    </div>
  )
}
