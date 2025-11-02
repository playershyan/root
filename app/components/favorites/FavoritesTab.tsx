'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, Grid } from 'lucide-react'
import { FavoriteAdData, FavoriteWantedData } from '@/lib/utils/favoritesUtils'
import FavoriteAdCard from './FavoriteAdCard'
import FavoriteWantedCard from './FavoriteWantedCard'

interface FavoritesTabProps {
  favoriteAds: FavoriteAdData[]
  favoriteWanted: FavoriteWantedData[]
  onRemoveAdFromFavorites?: (id: string) => void
  onRemoveWantedFromFavorites?: (id: string) => void
  onShareAd?: (id: string) => void
  onShareWanted?: (id: string) => void
  loading?: boolean
}

type FavoriteType = 'ads' | 'wanted'

const STORAGE_KEY = 'favorites-active-tab'

export default function FavoritesTab({
  favoriteAds,
  favoriteWanted,
  onRemoveAdFromFavorites,
  onRemoveWantedFromFavorites,
  onShareAd,
  onShareWanted,
  loading = false
}: FavoritesTabProps) {
  const [activeType, setActiveType] = useState<FavoriteType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      return (saved === 'ads' || saved === 'wanted') ? saved : 'ads'
    }
    return 'ads'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, activeType)
    }
  }, [activeType])

  if (loading) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading favorites...</p>
      </div>
    )
  }

  const hasNoFavorites = favoriteAds.length === 0 && favoriteWanted.length === 0

  if (hasNoFavorites) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-sm max-w-md mx-auto">
          Start exploring listings and wanted requests. Save the ones you like by tapping the heart icon.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Heart className="w-6 h-6" />
            Favorites
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {favoriteAds.length + favoriteWanted.length} total
            </p>
          </div>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 max-w-fit">
          <button
            onClick={() => setActiveType('ads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeType === 'ads'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            Listings ({favoriteAds.length})
          </button>
          <button
            onClick={() => setActiveType('wanted')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeType === 'wanted'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Star className="w-4 h-4" />
            Wanted ({favoriteWanted.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeType === 'ads' && (
          <div className="p-6">
            {favoriteAds.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No favorite listings</h3>
                <p className="text-sm">
                  Browse listings and save the ones you're interested in.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteAds.map(ad => (
                  <FavoriteAdCard
                    key={ad.id}
                    ad={ad}
                    onRemoveFromFavorites={onRemoveAdFromFavorites}
                    onShare={onShareAd}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeType === 'wanted' && (
          <div className="p-6">
            {favoriteWanted.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No favorite wanted requests</h3>
                <p className="text-sm">
                  Browse wanted requests and save the ones you can help with.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favoriteWanted.map(wanted => (
                  <FavoriteWantedCard
                    key={wanted.id}
                    wanted={wanted}
                    onRemoveFromFavorites={onRemoveWantedFromFavorites}
                    onShare={onShareWanted}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}