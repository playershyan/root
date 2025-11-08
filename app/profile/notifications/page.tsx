'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import NotificationsTab from '@/app/components/notifications/NotificationsTab'
import { useState } from 'react'
import { NotificationPreferences } from '@/lib/utils/notificationsUtils'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  const router = useRouter()

  // State for notification preferences (matches original initialization)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNewMatches: true,
    emailPriceDrops: true,
    emailMessages: false,
    emailListingUpdates: true,
    smsUrgent: true,
    smsSecurity: false,
    marketingNewsletter: true,
    marketingPromotions: false
  })

  // Handle updating preferences
  const handleUpdate = async (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences)
    // TODO: Save to backend API
    // For now, just log (matches original implementation)
    console.log('Saving notification preferences:', newPreferences)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-3xl">
        <div className="px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
          <Button
            onClick={() => router.push('/profile')}
            variant="ghost"
            size="sm"
            className="mb-4 inline-flex items-center gap-2 px-0 text-sm font-medium sm:mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>

          <NotificationsTab
            preferences={preferences}
            onUpdate={handleUpdate}
            loading={false}
          />
        </div>
      </div>
    </div>
  )
}
