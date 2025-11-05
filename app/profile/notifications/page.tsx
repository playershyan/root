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

        <NotificationsTab
          preferences={preferences}
          onUpdate={handleUpdate}
          loading={false}
        />
      </div>
    </div>
  )
}
