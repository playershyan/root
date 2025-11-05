'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import BinTab from '@/app/components/bin/BinTab'
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function BinPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [binItems, setBinItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  // Load bin items
  const loadBinItems = useCallback(async () => {
    if (!user) return

    setLoading(true)
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
      setLoading(false)
    }
  }, [user])

  // Handle restore item
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

      // Show success message
      alert(`${data.message}\n\n${data.next_steps}`)

      // Reload bin items to reflect changes
      await loadBinItems()
    } catch (error) {
      console.error('Error restoring item:', error)
      alert(error instanceof Error ? error.message : 'Failed to restore item')
    } finally {
      setRestoring(null)
    }
  }

  // Load bin items on mount
  useEffect(() => {
    loadBinItems()
  }, [loadBinItems])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <BinTab
          binItems={binItems}
          onRestoreItem={handleRestoreItem}
          restoringItemId={restoring}
          loading={loading}
        />
      </div>
    </div>
  )
}
