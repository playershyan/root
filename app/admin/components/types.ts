export interface DashboardStatsData {
  totalUsers: number
  activeListings: number
  pendingListings: number
  pendingReports: number
  todayListings: number
  todayUsers: number
  pendingBusinessProfiles: number
  verifiedBusinessProfiles: number
  activeWantedRequests: number
  pendingWantedRequests: number
  todayWantedRequests: number
}

export type ActivityType =
  | 'listing_created'
  | 'user_registered'
  | 'report_submitted'
  | 'listing_approved'
  | 'listing_rejected'
  | 'wanted_request_approved'
  | 'wanted_request_rejected'
  | 'wanted_request_deleted'
  | 'wanted_request_permanently_deleted'
  | 'other'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  user?: string
}

export type HealthStatusLevel = 'healthy' | 'warning' | 'error'

export interface SystemHealthData {
  database: HealthStatusLevel
  api: HealthStatusLevel
  storage: HealthStatusLevel
  security: HealthStatusLevel
  metrics: {
    dbLatency: number
    apiLatency: number
    storageUsage: number
    errorRate: number
    uptime: number
  }
  issues?: string[]
  recommendations?: string[]
  timestamp?: string
}

export type AlertType = 'error' | 'warning' | 'info' | 'success'

export interface AlertItem {
  id: string
  type: AlertType
  title: string
  message: string
  timestamp: string
  isRead: boolean
  severity?: string
}
