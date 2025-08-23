'use client'

import { WantedRequestData, getWantedRequestStatusInfo } from '@/lib/utils/wantedRequestStatus'

interface WantedRequestStatusBadgeProps {
  request: WantedRequestData
  size?: 'sm' | 'md' | 'lg'
  showReason?: boolean
}

export default function WantedRequestStatusBadge({ 
  request, 
  size = 'sm',
  showReason = false 
}: WantedRequestStatusBadgeProps) {
  const statusInfo = getWantedRequestStatusInfo(request)
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }
  
  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`
        inline-flex font-medium rounded-full
        ${statusInfo.color.bg} ${statusInfo.color.text}
        ${sizeClasses[size]}
      `}>
        {statusInfo.label}
      </span>
      
      {showReason && request.rejectionReason && (
        <p className="text-xs text-red-600">
          Reason: {request.rejectionReason}
        </p>
      )}
    </div>
  )
}