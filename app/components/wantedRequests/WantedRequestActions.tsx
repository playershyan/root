'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, Pause, Play, X, Trash2, Eye, Share2, MoreVertical, Zap } from 'lucide-react'
import { 
  WantedRequestData, 
  canPauseWantedRequest, 
  canResumeWantedRequest, 
  canEditWantedRequest, 
  canDeleteWantedRequest,
  canCloseWantedRequest 
} from '@/lib/utils/wantedRequestStatus'

interface WantedRequestActionsProps {
  request: WantedRequestData & { id: string }
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onClose?: (id: string) => void
  onDelete?: (id: string) => void
  onShare?: (id: string) => void
  viewMode?: 'desktop' | 'mobile'
}

export default function WantedRequestActions({
  request,
  onPause,
  onResume,
  onClose,
  onDelete,
  onShare,
  viewMode = 'desktop'
}: WantedRequestActionsProps) {
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
            <Link
              href={`/wanted/${request.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              View Request
            </Link>
            
            {canEditWantedRequest(request) && (
              <Link
                href={`/wanted/edit/${request.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="w-4 h-4" />
                Edit Request
              </Link>
            )}
            
            {canPauseWantedRequest(request) && onPause && (
              <button
                onClick={() => {
                  onPause(request.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Pause className="w-4 h-4" />
                Pause Request
              </button>
            )}
            
            {canResumeWantedRequest(request) && onResume && (
              <button
                onClick={() => {
                  onResume(request.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Play className="w-4 h-4" />
                Resume Request
              </button>
            )}
            
            {canCloseWantedRequest(request) && onClose && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onClose(request.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <X className="w-4 h-4" />
                  Close Request
                </button>
              </>
            )}
            
            {onShare && (
              <button
                onClick={() => {
                  onShare(request.id)
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Share2 className="w-4 h-4" />
                Share Request
              </button>
            )}
            
            {canDeleteWantedRequest(request) && onDelete && (
              <>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDelete(request.id)
                    setShowMenu(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Move to Bin
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
        href={`/wanted/${request.id}`}
        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
      >
        <Eye className="w-4 h-4" />
        View
      </Link>
      
      {canEditWantedRequest(request) && (
        <Link
          href={`/wanted/edit/${request.id}`}
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </Link>
      )}
      
      {canPauseWantedRequest(request) && onPause && (
        <button
          onClick={() => onPause(request.id)}
          className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1"
        >
          <Pause className="w-4 h-4" />
          Pause
        </button>
      )}
      
      {canResumeWantedRequest(request) && onResume && (
        <button
          onClick={() => onResume(request.id)}
          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
        >
          <Play className="w-4 h-4" />
          Resume
        </button>
      )}
      
      {canCloseWantedRequest(request) && onClose && (
        <button
          onClick={() => onClose(request.id)}
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Close
        </button>
      )}
      
      {onShare && (
        <button
          onClick={() => onShare(request.id)}
          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      )}
      
      {canDeleteWantedRequest(request) && onDelete && (
        <button
          onClick={() => onDelete(request.id)}
          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      )}
    </div>
  )
}