'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, Pause, Play, CheckCircle, Trash2, Eye, Share2, MoreVertical } from 'lucide-react'
import { 
  ListingData, 
  canPauseListing, 
  canResumeListing, 
  canEditListing, 
  canDeleteListing,
  canMarkAsSold 
} from '@/lib/utils/listingStatus'

interface ListingActionsProps {
  listing: ListingData & { id: string }
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onMarkAsSold?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
  viewMode?: 'desktop' | 'mobile'
}

export default function ListingActions({
  listing,
  onPause,
  onResume,
  onMarkAsSold,
  onDelete,
  onShare,
  viewMode = 'desktop'
}: ListingActionsProps) {
  const [showMenu, setShowMenu] = useState(false)

  if (viewMode === 'mobile') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            {canEditListing(listing) && (
              <Link
                href={`/edit/${listing.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Edit Listing
              </Link>
            )}
            
            {canPauseListing(listing) && onPause && (
              <button
                onClick={() => {
                  onPause(listing.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Pause className="w-4 h-4" />
                Pause Listing
              </button>
            )}
            
            {canResumeListing(listing) && onResume && (
              <button
                onClick={() => {
                  onResume(listing.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Play className="w-4 h-4" />
                Resume Listing
              </button>
            )}
            
            {canMarkAsSold(listing) && onMarkAsSold && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onMarkAsSold(listing.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Sold
                </button>
              </>
            )}
            
            {onShare && (
              <button
                onClick={() => {
                  onShare(listing.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
            
            {canDeleteListing(listing) && onDelete && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDelete(listing.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/vehicles/${listing.id}`}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        View
      </Link>
      
      {canEditListing(listing) && (
        <Link
          href={`/edit/${listing.id}`}
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </Link>
      )}
      
      {canPauseListing(listing) && onPause && (
        <button
          onClick={() => onPause(listing.id)}
          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
      )}
      
      {canResumeListing(listing) && onResume && (
        <button
          onClick={() => onResume(listing.id)}
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          <Play className="w-4 h-4" />
          Resume
        </button>
      )}
      
      {canMarkAsSold(listing) && onMarkAsSold && (
        <button
          onClick={() => onMarkAsSold(listing.id)}
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          <CheckCircle className="w-4 h-4" />
          Mark Sold
        </button>
      )}
      
      {onShare && (
        <button
          onClick={() => onShare(listing.id)}
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}
      
      {canDeleteListing(listing) && onDelete && (
        <button
          onClick={() => onDelete(listing.id)}
          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  )
}