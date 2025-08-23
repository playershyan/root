export type WantedRequestStatusType = 
  | 'active' 
  | 'paused' 
  | 'closed' 
  | 'reported' 
  | 'deleted'

export interface WantedRequestStatusInfo {
  label: string
  color: {
    bg: string
    text: string
  }
}

export interface WantedRequestData {
  status: 'active' | 'paused' | 'closed' | 'deleted'
  isReportedTakedown?: boolean
  rejectionReason?: string
}

export function getWantedRequestStatus(request: WantedRequestData): WantedRequestStatusType {
  if (request.status === 'active') return 'active'
  if (request.status === 'paused') return 'paused'
  if (request.status === 'closed') return 'closed'
  if (request.status === 'deleted' && request.isReportedTakedown) return 'reported'
  if (request.status === 'deleted') return 'deleted'
  return 'active'
}

export const wantedRequestStatusConfig: Record<WantedRequestStatusType, WantedRequestStatusInfo> = {
  active: {
    label: 'Active',
    color: {
      bg: 'bg-green-100',
      text: 'text-green-800'
    }
  },
  paused: {
    label: 'Paused',
    color: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800'
    }
  },
  closed: {
    label: 'Closed',
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-800'
    }
  },
  reported: {
    label: 'Reported',
    color: {
      bg: 'bg-red-100',
      text: 'text-red-800'
    }
  },
  deleted: {
    label: 'Deleted',
    color: {
      bg: 'bg-gray-100',
      text: 'text-gray-800'
    }
  }
}

export function getWantedRequestStatusInfo(request: WantedRequestData): WantedRequestStatusInfo {
  const status = getWantedRequestStatus(request)
  return wantedRequestStatusConfig[status]
}

export function canPauseWantedRequest(request: WantedRequestData): boolean {
  return request.status === 'active'
}

export function canResumeWantedRequest(request: WantedRequestData): boolean {
  return request.status === 'paused'
}

export function canEditWantedRequest(request: WantedRequestData): boolean {
  return request.status === 'active' || request.status === 'paused'
}

export function canDeleteWantedRequest(request: WantedRequestData): boolean {
  return request.status === 'active' || request.status === 'paused'
}

export function canCloseWantedRequest(request: WantedRequestData): boolean {
  return request.status === 'active'
}