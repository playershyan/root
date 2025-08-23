'use client'

import { useState } from 'react'
import { MessageSquare, ChevronRight, MoreVertical, Eye, Archive, Trash2 } from 'lucide-react'
import { ConversationData, formatMessageDate, formatPrice, getOtherUser, truncateMessage } from '@/lib/utils/messageUtils'

interface MessagePreviewProps {
  conversation: ConversationData
  onClick: () => void
  onArchive?: (id: string) => void
  onMoveToBin?: (id: string) => void
  onMarkAsRead?: (id: string) => void
}

export default function MessagePreview({
  conversation,
  onClick,
  onArchive,
  onMoveToBin,
  onMarkAsRead
}: MessagePreviewProps) {
  const [showMenu, setShowMenu] = useState(false)
  const otherUser = getOtherUser(conversation)
  
  const handleMenuAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation()
    action()
    setShowMenu(false)
  }

  const handlePreviewClick = (event: React.MouseEvent) => {
    // Don't trigger click if clicking on menu button
    if ((event.target as HTMLElement).closest('[data-menu-button]')) {
      return
    }
    onClick()
  }

  return (
    <div className="relative">
      <button
        onClick={handlePreviewClick}
        className="block w-full hover:bg-gray-50 transition-colors text-left relative"
      >
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-start gap-3 md:gap-4">
            {/* Listing Image */}
            <div className="flex-shrink-0">
              {conversation.listing_image_url ? (
                <img
                  src={conversation.listing_image_url}
                  alt={conversation.listing_title}
                  className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 md:w-6 md:h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Conversation Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-sm md:text-base text-gray-900 truncate ${
                      conversation.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {otherUser.name || 'User'}
                    </h3>
                    {conversation.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] text-center font-medium">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      conversation.current_user_role === 'buyer' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {conversation.current_user_role === 'buyer' ? 'Buying' : 'Selling'}
                    </span>
                  </div>
                  
                  <p className="text-xs md:text-sm text-gray-600 truncate font-medium">
                    {conversation.listing_title} • {formatPrice(conversation.listing_price)}
                  </p>
                  
                  {conversation.last_message_preview && (
                    <p className={`text-xs md:text-sm mt-1 max-w-[200px] md:max-w-none truncate ${
                      conversation.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
                    }`}>
                      {truncateMessage(conversation.last_message_preview, 60)}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <div className="flex flex-col items-end gap-1 text-xs md:text-sm text-gray-500">
                    <span className="whitespace-nowrap">{formatMessageDate(conversation.last_message_at)}</span>
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                  
                  {/* Three-dotted menu */}
                  <div className="relative" data-menu-button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(!showMenu)
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <button
                          onClick={(e) => handleMenuAction(() => onClick(), e)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                        >
                          <Eye className="w-4 h-4" />
                          View Conversation
                        </button>
                        
                        {conversation.unread_count > 0 && onMarkAsRead && (
                          <button
                            onClick={(e) => handleMenuAction(() => onMarkAsRead(conversation.id), e)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Mark as Read
                          </button>
                        )}
                        
                        {onArchive && (
                          <button
                            onClick={(e) => handleMenuAction(() => onArchive(conversation.id), e)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                        )}
                        
                        {onMoveToBin && (
                          <>
                            <hr className="my-1" />
                            <button
                              onClick={(e) => handleMenuAction(() => onMoveToBin(conversation.id), e)}
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
      
      {/* Click overlay to show menu on hover */}
      <style jsx>{`
        .relative:hover [data-menu-button] button {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}