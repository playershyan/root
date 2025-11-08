import type { SystemHealthData } from './types'
import SystemHealthClient from './SystemHealthClient'

interface SystemHealthProps {
  initialHealth: SystemHealthData
  refreshIntervalMs?: number
}

export default function SystemHealth({
  initialHealth,
  refreshIntervalMs,
}: SystemHealthProps) {
  return (
    <SystemHealthClient
      initialHealth={initialHealth}
      refreshIntervalMs={refreshIntervalMs}
    />
  )
}