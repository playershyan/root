import type { DashboardStatsData } from './types'
import DashboardStatsClient from './DashboardStatsClient'

interface DashboardStatsProps {
  data: DashboardStatsData
  refreshIntervalMs?: number
}

export default function DashboardStats({ data, refreshIntervalMs }: DashboardStatsProps) {
  return (
    <DashboardStatsClient
      initialStats={data}
      refreshIntervalMs={refreshIntervalMs}
    />
  )
}