import type { ActivityItem } from './types'
import RecentActivityClient from './RecentActivityClient'

interface RecentActivityProps {
  initialActivities: ActivityItem[]
  refreshIntervalMs?: number
}

export default function RecentActivity({
  initialActivities,
  refreshIntervalMs,
}: RecentActivityProps) {
  return (
    <RecentActivityClient
      initialActivities={initialActivities}
      refreshIntervalMs={refreshIntervalMs}
    />
  )
}