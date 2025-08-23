'use client'

import Link from 'next/link'
import { AlertCircle, Info, Edit } from 'lucide-react'
import { WantedRequestData, getWantedRequestStatus } from '@/lib/utils/wantedRequestStatus'

interface WantedRequestStatusMessageProps {
  request: WantedRequestData & { 
    id: string
    rejectionReason?: string
  }
}

export default function WantedRequestStatusMessage({ request }: WantedRequestStatusMessageProps) {
  const status = getWantedRequestStatus(request)
  
  if (status === 'reported' && request.isReportedTakedown) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">
              Request removed due to multiple reports
            </p>
            {request.rejectionReason && (
              <p className="text-xs text-red-600 mt-1">
                Reason: {request.rejectionReason}
              </p>
            )}
          </div>
        </div>
        
        <Link 
          href={`/wanted/edit/${request.id}`}
          className="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 inline-flex items-center gap-1.5 font-medium transition-all"
        >
          <Edit className="w-3 h-3" />
          Edit & Resubmit
        </Link>
      </div>
    )
  }
  
  if (status === 'paused') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700 font-medium">
              Request is paused
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              This request is not visible to sellers. Resume to make it active again.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (status === 'closed') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <p className="text-sm text-gray-700 font-medium">
            Request closed - You found what you were looking for!
          </p>
        </div>
      </div>
    )
  }
  
  return null
}