import type { AlertItem } from './types'
import AlertsOverviewClient from './AlertsOverviewClient'

interface AlertsOverviewProps {
  initialAlerts: AlertItem[]
  refreshIntervalMs?: number
}

export default function AlertsOverview({
  initialAlerts,
  refreshIntervalMs,
}: AlertsOverviewProps) {
  return (
    <AlertsOverviewClient
      initialAlerts={initialAlerts}
      refreshIntervalMs={refreshIntervalMs}
    />
  )
}