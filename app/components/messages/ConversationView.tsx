'use client'

import { useState } from 'react'
import { ArrowLeft, User, Car, Send } from 'lucide-react'
import { ConversationData, MessageData, formatMessageDate, formatPrice, getOtherUser, shouldShowDateSeparator, getDateSeparatorText } from '@/lib/utils/messageUtils'
import OfferCard from '@/app/components/messaging/OfferCard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { logger } from '@/lib/utils/logger'

interface ConversationViewProps {
  conversation: ConversationData
  messages: MessageData[]
  currentUserId?: string
  onBack: () => void
  onSendMessage: (content: string) => Promise<void>
  loadingMessages?: boolean
  sendingMessage?: boolean
}

export default function ConversationView({
  conversation,
  messages,
  currentUserId,
  onBack,
  onSendMessage,
  loadingMessages = false,
  sendingMessage = false
}: ConversationViewProps) {
  const [newMessage, setNewMessage] = useState('')
  const otherUser = getOtherUser(conversation)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return
    
    await onSendMessage(newMessage.trim())
    setNewMessage('')
  }

  return (
    <>
      {/* Conversation Header */}
      <div className="border-b px-3 md:px-6 py-3 md:py-4 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 h-10 w-10"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {otherUser.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-sm md:text-base truncate">{otherUser.name || 'User'}</h2>
                <p className="text-xs md:text-sm text-gray-500">
                  {conversation.current_user_role === 'buyer' ? 'Seller' : 'Buyer'}
                </p>
              </div>
            </div>
          </div>

          {/* Listing Info - Desktop only */}
          <div className="hidden md:flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors flex-shrink-0 cursor-pointer">
            {conversation.listing_image_url ? (
              <img
                src={conversation.listing_image_url}
                alt={conversation.listing_title}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <Car className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {conversation.listing_title}
              </p>
              <p className="text-sm text-gray-500">
                {formatPrice(conversation.listing_price)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Header - Mobile only (Vehicle Info) */}
      <div className="md:hidden border-b bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-3">
          {conversation.listing_image_url ? (
            <img
              src={conversation.listing_image_url}
              alt={conversation.listing_title}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
              <Car className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.listing_title}
            </p>
            <p className="text-sm text-gray-600">
              {formatPrice(conversation.listing_price)}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4 min-h-[400px] max-h-[600px] bg-gray-50">
        {loadingMessages ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender_id === currentUserId
            const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1])

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="text-center my-4">
                    <div className="inline-block px-3 py-1 bg-white rounded-full text-xs text-gray-500 border shadow-sm">
                      {getDateSeparatorText(message.created_at)}
                    </div>
                  </div>
                )}
                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {message.sender.profiles?.avatar_url ? (
                          <img
                            src={message.sender.profiles.avatar_url}
                            alt={message.sender.profiles.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Message Content */}
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {message.message_type === 'offer' && message.offer_data ? (
                        <OfferCard
                          offerId={message.offer_data.offerId}
                          amount={message.offer_data.amount}
                          message={message.offer_data.message}
                          senderName={message.sender.profiles?.name || 'User'}
                          timestamp={message.created_at}
                          isOwner={conversation.seller_id === currentUserId}
                          onReaction={async (action) => {
                            // TODO: Implement offer response
                            logger.debug('Offer response action', {
                              component: 'ConversationView',
                              action,
                              offerId: message.offer_data.offerId
                            })
                          }}
                          listingTitle={message.offer_data.listingTitle}
                        />
                      ) : (
                        <div 
                          className={`rounded-2xl px-4 py-2 max-w-full break-words ${
                            isCurrentUser 
                              ? 'bg-blue-600 text-white rounded-br-md' 
                              : 'bg-white text-gray-900 border rounded-bl-md shadow-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        </div>
                      )}
                      
                      {/* Message timestamp and read status */}
                      <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                        isCurrentUser ? 'flex-row-reverse' : ''
                      }`}>
                        <span>{formatMessageDate(message.created_at)}</span>
                        {isCurrentUser && message.is_read && (
                          <span className="text-blue-500">• Read</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white px-3 md:px-6 py-4 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full rounded-2xl resize-none min-h-[48px] max-h-[120px]"
              disabled={sendingMessage}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendingMessage}
            size="icon"
            className="flex-shrink-0 h-12 w-12 rounded-full shadow-lg hover:shadow-xl"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </>
  )
}