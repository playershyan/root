/**
 * Enhanced Conversation Modal with Modern UX
 * Mobile-first design with advanced features
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Send, User, Car, MessageCircle, LogIn, Phone, Clock,
  Check, CheckCheck, MoreVertical, Search, Paperclip, Smile,
  ArrowDown, AlertCircle, Wifi, WifiOff
} from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { AuthModal } from '@/app/components/auth'
import { getContextualQuickReplies, trackQuickReplyUsage, SmartQuickReplies } from '@/lib/messaging/quickReplies'
import { updateMessageStatus, markMessagesAsDelivered } from '@/lib/messaging/status'
import { getMessagingRealtime } from '@/lib/messaging/realtime'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

interface Profile {
  id: string
  name: string
  avatar_url?: string
}

interface ConversationModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    title: string
    price: number
    location: string
    make?: string
    model?: string
    year?: number
    primary_image_url?: string
    user_id: string
  }
}

export default function EnhancedConversationModal({ isOpen, onClose, listing }: ConversationModalProps) {
  const { user } = useAuth()

  // State management
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authType, setAuthType] = useState<'login' | 'register'>('login')

  // Enhanced UX state
  const [typing, setTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<SmartQuickReplies>({
    contextual: [],
    personalized: [],
    trending: []
  })
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom when messages change
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle scroll to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollToBottom(!isNearBottom && messages.length > 5)
  }, [messages.length])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Enhanced keyboard handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Typing indicator management
  const handleTyping = useCallback(() => {
    if (!conversationId || !user) return

    setTyping(true)
    const realtime = getMessagingRealtime()
    realtime.sendTypingIndicator(conversationId, true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
      realtime.sendTypingIndicator(conversationId, false)
    }, 2000)
  }, [conversationId, user])

  // Enhanced message input handling
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    handleTyping()
  }

  // Load contextual quick replies
  useEffect(() => {
    if (user && messages.length >= 0) {
      const userRole = user.id === listing.user_id ? 'seller' : 'buyer'
      const lastOtherMessage = messages
        .filter(m => m.sender_id !== user.id)
        .slice(-1)[0]?.content || ''

      const contextualReplies = getContextualQuickReplies(
        userRole,
        {
          messageCount: messages.length,
          lastMessageFromOther: lastOtherMessage,
          vehicleType: listing.make || 'vehicle',
          priceRange: listing.price.toString()
        }
      )

      setQuickReplies(contextualReplies)
    }
  }, [user, messages, listing])

  // Enhanced message status rendering
  const renderMessageStatus = (message: Message) => {
    if (message.sender_id !== user?.id) return null

    const status = message.status || 'sent'
    const statusIcons = {
      sending: <Clock className="w-3 h-3 text-gray-400 animate-pulse" />,
      sent: <Check className="w-3 h-3 text-gray-400" />,
      delivered: <CheckCheck className="w-3 h-3 text-gray-400" />,
      read: <CheckCheck className="w-3 h-3 text-blue-500" />,
      failed: <AlertCircle className="w-3 h-3 text-red-500" />
    }

    return (
      <div className="flex items-center gap-1 mt-1">
        {statusIcons[status]}
        <span className="text-xs text-gray-400 capitalize">{status}</span>
      </div>
    )
  }

  // Enhanced quick reply selection
  const handleQuickReply = async (replyText: string) => {
    setNewMessage(replyText)

    // Track usage for personalization
    if (user) {
      const userRole = user.id === listing.user_id ? 'seller' : 'buyer'
      await trackQuickReplyUsage(user.id, replyText, userRole)
    }

    // Auto-focus input for immediate sending
    messageInputRef.current?.focus()
  }

  // Connection status indicator
  const ConnectionIndicator = () => (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
      {connectionStatus === 'connected' ? (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-xs text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-500" />
          <span className="text-xs text-red-600">Connecting...</span>
        </>
      )}
    </div>
  )

  // Enhanced message sending with optimistic updates
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`

    // Optimistic UI update
    const optimisticMessage: Message = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending'
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')

    try {
      let currentConversationId = conversationId

      // Create conversation if needed
      if (!currentConversationId) {
        const response = await fetch('/api/messaging/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: listing.id,
            seller_id: listing.user_id,
            initial_message: messageContent
          })
        })

        if (!response.ok) throw new Error('Failed to create conversation')

        const { conversation_id } = await response.json()
        currentConversationId = conversation_id
        setConversationId(currentConversationId)
      }

      // Send message
      const response = await fetch(`/api/messaging/conversations/${currentConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const { message: sentMessage } = await response.json()

      // Update optimistic message with real data
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...sentMessage, status: 'sent' } : m
      ))

      // Hide quick replies after sending
      setShowQuickReplies(false)
      setTimeout(() => setShowQuickReplies(true), 1000)

    } catch (error) {
      console.error('Error sending message:', error)

      // Update optimistic message to failed status
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'failed' } : m
      ))

      // Show retry option
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  // Render enhanced message with animations
  const renderMessage = (message: Message, index: number) => {
    const isCurrentUser = message.sender_id === user?.id
    const senderProfile = isCurrentUser ? userProfile : sellerProfile
    const isConsecutive = index > 0 && messages[index - 1].sender_id === message.sender_id

    return (
      <div
        key={message.id}
        className={`flex gap-3 mb-3 animate-fade-in ${
          isCurrentUser ? 'flex-row-reverse' : 'flex-row'
        } ${isConsecutive ? 'mt-1' : 'mt-4'}`}
      >
        {!isConsecutive && (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            {senderProfile?.avatar_url ? (
              <img
                src={senderProfile.avatar_url}
                alt={senderProfile.name || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
          </div>
        )}

        {isConsecutive && <div className="w-8 h-8" />}

        <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          <div className={`px-4 py-3 rounded-2xl transition-all duration-200 ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-md hover:bg-blue-700'
              : 'bg-white text-gray-900 rounded-bl-md border hover:shadow-sm'
          } ${message.status === 'failed' ? 'border-red-300 bg-red-50' : ''}`}>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>

          <div className="flex items-center gap-2 mt-1 px-2">
            <p className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </p>
            {renderMessageStatus(message)}
          </div>
        </div>
      </div>
    )
  }

  // Enhanced time formatting
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Enhanced backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Enhanced modal with mobile-first design */}
        <div className="relative bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg mx-4 h-[90vh] md:h-[600px] max-h-[90vh] flex flex-col animate-slide-up">

          {/* Enhanced header with connection status */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl md:rounded-t-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {sellerProfile?.name || 'Seller'}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    {otherUserTyping ? 'Typing...' : lastSeen ? `Last seen ${lastSeen}` : 'Vehicle inquiry'}
                  </p>
                  <ConnectionIndicator />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full active:scale-95"
              >
                <Phone className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full active:scale-95"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full active:scale-95"
              >
                <X className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Vehicle info with enhanced styling */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              {listing.primary_image_url ? (
                <img
                  src={listing.primary_image_url}
                  alt={listing.title}
                  className="w-14 h-14 object-cover rounded-xl shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Car className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {listing.title}
                </p>
                <p className="text-lg font-bold text-blue-600">
                  Rs. {listing.price.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{listing.location}</p>
              </div>
            </div>
          </div>

          {/* Enhanced messages area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 relative"
          >
            {!user ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <LogIn className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Log in to send messages</h3>
                <p className="text-gray-600 mb-6 text-sm">Connect with the seller instantly</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setAuthType('login')
                      setShowAuthModal(true)
                    }}
                    variant="primary"
                    className="px-6"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthType('register')
                      setShowAuthModal(true)
                    }}
                    variant="outline"
                    className="px-6"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map((message, index) => renderMessage(message, index))}

                {/* Typing indicator */}
                {otherUserTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Start the conversation!</p>
                <p className="text-sm">Send a message to connect with the seller</p>
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <Button
                onClick={() => scrollToBottom()}
                variant="primary"
                size="icon"
                className="fixed bottom-32 right-8 h-11 w-11 rounded-full shadow-lg animate-bounce-subtle"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Enhanced message input */}
          <div className="p-4 border-t bg-white rounded-b-3xl md:rounded-b-2xl">
            {user ? (
              <>
                {/* Quick replies with enhanced design */}
                {showQuickReplies && quickReplies.contextual.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Quick replies:</p>
                    <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                      {[...quickReplies.contextual, ...quickReplies.personalized].slice(0, 6).map((reply) => (
                        <Button
                          key={reply.id}
                          onClick={() => handleQuickReply(reply.text)}
                          variant="outline"
                          className="text-xs px-3 min-h-touch bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-indigo-100 border-blue-200 font-medium h-auto"
                          disabled={sending}
                        >
                          {reply.text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced input form */}
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      ref={messageInputRef}
                      type="text"
                      value={newMessage}
                      onChange={handleMessageChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="pr-20 rounded-2xl"
                      disabled={sending}
                      maxLength={2000}
                    />

                    {/* Input accessories */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        disabled={sending}
                      >
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        disabled={sending}
                      >
                        <Smile className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    variant="primary"
                    size="icon"
                    className="h-12 w-12 rounded-2xl shadow-md hover:shadow-lg flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>

                {/* Character count */}
                {newMessage.length > 1800 && (
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {2000 - newMessage.length} characters remaining
                  </p>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <LogIn className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm">Please log in to send messages</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authType}
      />

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
      `}</style>
    </>
  )
}

// Placeholder for loadConversation function
const loadConversation = async () => {
  // Implementation would be similar to original but with enhanced error handling
}