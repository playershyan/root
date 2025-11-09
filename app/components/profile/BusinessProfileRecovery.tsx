'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, CheckCircle, Clock, Undo2 } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface RecoveryInfo {
  canRecover: boolean
  businessName?: string
  deletedAt?: string
  recoveryDeadline?: string
  daysRemaining?: number
  deletionReason?: string
}

interface BusinessProfileRecoveryProps {
  onRecovered?: (businessName: string) => void
  className?: string
}

export default function BusinessProfileRecovery({ 
  onRecovered, 
  className = "" 
}: BusinessProfileRecoveryProps) {
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [recovering, setRecovering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkRecoveryStatus()
  }, [])

  const checkRecoveryStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/business-profile/recover')
      
      if (response.ok) {
        const data = await response.json()
        setRecoveryInfo(data)
      } else {
        logger.error('Failed to check recovery status', new Error(`Status ${response.status}`), {
          component: 'BusinessProfileRecovery',
          action: 'checkRecoveryStatus'
        })
      }
    } catch (err) {
      logger.error('Error checking recovery status', err as Error, {
        component: 'BusinessProfileRecovery',
        action: 'checkRecoveryStatus'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRecover = async () => {
    if (!recoveryInfo?.canRecover) return

    setRecovering(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/business-profile/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm: true })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Business profile "${data.businessName}" has been successfully recovered!`)
        setRecoveryInfo({ canRecover: false }) // Hide recovery option
        onRecovered?.(data.businessName)
        
        // Refresh the page after 2 seconds to show the recovered profile
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || 'Failed to recover business profile')
      }
    } catch (err) {
      logger.error('Error recovering business profile', err as Error, {
        component: 'BusinessProfileRecovery',
        action: 'handleRecover'
      })
      setError('An unexpected error occurred while recovering your business profile')
    } finally {
      setRecovering(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking for recoverable business profile...</span>
        </div>
      </div>
    )
  }

  if (!recoveryInfo?.canRecover) {
    return null // Don't show anything if no recovery is possible
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getUrgencyColor = (daysRemaining?: number) => {
    if (!daysRemaining) return 'text-gray-600'
    if (daysRemaining <= 3) return 'text-red-600'
    if (daysRemaining <= 7) return 'text-orange-600'
    return 'text-green-600'
  }

  const getUrgencyBg = (daysRemaining?: number) => {
    if (!daysRemaining) return 'bg-gray-50 border-gray-200'
    if (daysRemaining <= 3) return 'bg-red-50 border-red-200'
    if (daysRemaining <= 7) return 'bg-orange-50 border-orange-200'
    return 'bg-green-50 border-green-200'
  }

  return (
    <div className={`bg-white rounded-lg border ${getUrgencyBg(recoveryInfo.daysRemaining)} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-current border-opacity-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Undo2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Recover Business Profile</h3>
            <p className="text-sm text-gray-600">Your deleted business profile can be restored</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Recovery Info */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Business Name:</span>
              <p className="font-medium text-gray-900">{recoveryInfo.businessName}</p>
            </div>
            <div>
              <span className="text-gray-500">Deleted On:</span>
              <p className="font-medium text-gray-900">{formatDate(recoveryInfo.deletedAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Recovery Deadline:</span>
              <p className="font-medium text-gray-900">{formatDate(recoveryInfo.recoveryDeadline)}</p>
            </div>
            <div>
              <span className="text-gray-500">Time Remaining:</span>
              <p className={`font-medium flex items-center gap-1 ${getUrgencyColor(recoveryInfo.daysRemaining)}`}>
                <Clock className="w-4 h-4" />
                {recoveryInfo.daysRemaining} day{recoveryInfo.daysRemaining !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {recoveryInfo.deletionReason && (
            <div className="text-sm">
              <span className="text-gray-500">Deletion Reason:</span>
              <p className="font-medium text-gray-900">{recoveryInfo.deletionReason}</p>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium mb-1">Recovery Notice</p>
              <p>
                Recovering your business profile will restore all business information and 
                switch your existing ads and wanted requests back to using your business phone number.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRecover}
          disabled={recovering || !recoveryInfo.canRecover}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {recovering ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Recovering Business Profile...
            </>
          ) : (
            <>
              <Undo2 className="w-4 h-4" />
              Recover Business Profile
            </>
          )}
        </button>

        {/* Additional Info */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          After recovery, you can modify your business information from the Business Profile tab.
        </div>
      </div>
    </div>
  )
}