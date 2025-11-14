'use client'

import { useState } from 'react'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'
import { X, AlertTriangle, Shield, Copy, Tag, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  listingId?: string
  wantedRequestId?: string
  itemTitle: string
  itemType: 'listing' | 'wanted_request'
}

const REPORT_REASONS = [
  {
    id: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Contains offensive, explicit, or inappropriate material',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  {
    id: 'fraud_scam',
    label: 'Fraud or Scam',
    description: 'Suspicious pricing, fake information, or potential scam',
    icon: Shield,
    color: 'text-orange-600'
  },
  {
    id: 'duplicate_listing',
    label: 'Duplicate Listing',
    description: 'This item has been posted multiple times',
    icon: Copy,
    color: 'text-blue-600'
  },
  {
    id: 'wrong_category',
    label: 'Wrong Category',
    description: 'Item is posted in the incorrect category or section',
    icon: Tag,
    color: 'text-purple-600'
  },
  {
    id: 'spam_advertising',
    label: 'Spam or Advertising',
    description: 'Promotional content, spam, or unrelated advertising',
    icon: Zap,
    color: 'text-yellow-600'
  }
]

export default function ReportModal({
  isOpen,
  onClose,
  listingId,
  wantedRequestId,
  itemTitle,
  itemType
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { getToken, isEnabled } = useRecaptcha()

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError('Please select a reason for reporting')
      return
    }

    setLoading(true)
    setError('')

    try {
      let recaptchaToken: string | null = null
      if (isEnabled) {
        recaptchaToken = await getToken('report')
      }

      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          wantedRequestId,
          reason: selectedReason,
          description,
          recaptchaToken
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          // Reset form
          setSelectedReason('')
          setDescription('')
          setSuccess(false)
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit report')
      }
    } catch (error) {
      logger.error('Report submission error', error as Error, {
        component: 'ReportModal',
        action: 'handleSubmit',
        itemType,
        listingId,
        wantedRequestId
      })
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      // Reset form
      setSelectedReason('')
      setDescription('')
      setError('')
      setSuccess(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              Report {itemType === 'listing' ? 'Listing' : 'Wanted Request'}
            </h2>
            <Button
              onClick={handleClose}
              disabled={loading}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Report: <span className="font-medium">{itemTitle}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Report Submitted
              </h3>
              <p className="text-gray-600">
                Thank you for helping keep our community safe. We'll review your report shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Reason Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Why are you reporting this {itemType === 'listing' ? 'listing' : 'wanted request'}?
                </h3>
                <div className="space-y-3">
                  {REPORT_REASONS.map((reason) => {
                    const IconComponent = reason.icon
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        className={`border-2 rounded-lg p-4 transition-all w-full text-left min-h-touch active:scale-95 ${
                          selectedReason === reason.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedReason(reason.id)}
                      >
                        <div className="flex items-start gap-3">
                          <IconComponent 
                            size={20} 
                            className={`mt-0.5 ${reason.color}`}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              {reason.label}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {reason.description}
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedReason === reason.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedReason === reason.id && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-6">
                <Label htmlFor="details" className="mb-2">
                  Additional Details (Optional)
                </Label>
                <Textarea
                  id="details"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional information that might help us understand the issue..."
                  className="resize-none"
                  rows={4}
                  maxLength={500}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  disabled={loading}
                  variant="outline"
                  size="default"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !selectedReason}
                  variant="destructive"
                  size="default"
                  className="flex-1"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                Misuse of the report feature may result in account restrictions.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
