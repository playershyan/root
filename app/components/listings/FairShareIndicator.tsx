'use client'

import { usePromotionFairShare } from '@/lib/hooks/useRotatedPromotions'
import { Clock, TrendingUp, Users, BarChart3 } from 'lucide-react'

interface FairShareIndicatorProps {
  listingId: string
  showDetails?: boolean
}

export default function FairShareIndicator({ 
  listingId, 
  showDetails = false 
}: FairShareIndicatorProps) {
  const { stats, loading, error } = usePromotionFairShare(listingId)

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error || !stats) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shown recently':
        return 'text-green-600 bg-green-50'
      case 'Shown today':
        return 'text-blue-600 bg-blue-50'
      case 'Never shown':
      case 'Not shown recently':
        return 'text-orange-600 bg-orange-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'featured':
        return '⭐'
      case 'top_spot':
        return '👑'
      case 'boost':
        return '🚀'
      case 'urgent':
        return '🔴'
      default:
        return '📈'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          {getPromotionTypeIcon(stats.promotion_type)}
          Promotion Performance
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stats.status)}`}>
          {stats.status}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.total_impressions}
          </div>
          <div className="text-xs text-gray-500">Total Views</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {stats.avg_daily_impressions}
          </div>
          <div className="text-xs text-gray-500">Daily Avg</div>
        </div>
      </div>

      {/* Fair Share Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Fair Share</span>
          <span className="text-sm text-gray-600">{stats.fair_share_percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, parseFloat(stats.fair_share_percentage))}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{stats.slots_available} slots</span>
          <span>{stats.total_competing_ads} competing ads</span>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium">Last Shown</div>
                <div className="text-gray-600">
                  {stats.last_shown ? new Date(stats.last_shown).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium">Rotation Score</div>
                <div className="text-gray-600">{stats.rotation_score}</div>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> Your ad rotates fairly with {stats.total_competing_ads - 1} other {stats.promotion_type} ads. 
              Each ad gets equal opportunity based on {stats.promotion_type === 'featured' ? '2 exclusive slots' : 
              stats.promotion_type === 'top_spot' ? '2 premium slots' : 'daily rotation'}. 
              Ads that haven't been shown recently get higher priority.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Rotation countdown component
export function RotationCountdown({ nextRotation }: { nextRotation: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const rotationTime = nextRotation.getTime()
      const difference = rotationTime - now

      if (difference > 0) {
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setTimeLeft('Rotating now...')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [nextRotation])

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
      <Clock className="w-4 h-4" />
      <span>Next rotation in: <strong>{timeLeft}</strong></span>
    </div>
  )
}