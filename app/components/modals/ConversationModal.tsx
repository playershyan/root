'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, Send, User, Car, MessageCircle, LogIn,
  Check, CheckCheck, Clock, AlertCircle, ArrowDown
} from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { AuthModal } from '@/app/components/auth'
import { getContextualQuickReplies } from '@/lib/messaging/quickReplies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logger } from '@/lib/utils/logger'

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

export default function ConversationModal({ isOpen, onClose, listing }: ConversationModalProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authType, setAuthType] = useState<'login' | 'register'>('login')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Load existing conversation or create new one
  useEffect(() => {
    if (isOpen && user) {
      loadConversation()
    }
  }, [isOpen, user, listing.id])

  const loadConversation = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Load user profile
      const { data: userProfileData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', user.id)
        .single()

      if (userProfileData) {
        setUserProfile(userProfileData)
      }

      // Load seller profile
      const { data: sellerProfileData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', listing.user_id)
        .single()

      if (sellerProfileData) {
        setSellerProfile(sellerProfileData)
      }

      // Check conversations through optimized API
      const response = await fetch('/api/messaging/conversations')
      if (response.ok) {
        const { conversations } = await response.json()

        // Find conversation for this listing
        const existingConversation = conversations?.find((conv: any) =>
          conv.listing_id === listing.id &&
          conv.buyer_id === user.id &&
          conv.seller_id === listing.user_id
        )

        if (existingConversation) {
          // Load existing messages
          setConversationId(existingConversation.id)
          await loadMessages(existingConversation.id)
        } else {
          // No existing conversation, will be created when first message is sent
          setConversationId(null)
          setMessages([])
        }
      } else {
        const errorText = await response.text()
        logger.error('Failed to load conversations', new Error(errorText), {
          component: 'ConversationModal',
          action: 'loadConversation',
          listingId: listing.id
        })
        // Fallback to no conversation
        setConversationId(null)
        setMessages([])
      }
    } catch (error) {
      logger.error('Error loading conversation', error as Error, {
        component: 'ConversationModal',
        action: 'loadConversation',
        listingId: listing.id
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${convId}`)
      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to load messages', new Error(errorText), {
          component: 'ConversationModal',
          action: 'loadMessages',
          conversationId: convId
        })
        throw new Error('Failed to load messages')
      }

      const { messages } = await response.json()
      setMessages(messages || [])
    } catch (error) {
      logger.error('Error loading messages', error as Error, {
        component: 'ConversationModal',
        action: 'loadMessages',
        conversationId: convId
      })
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      let currentConversationId = conversationId

      // Create conversation if it doesn't exist
      if (!currentConversationId) {
        const response = await fetch('/api/messaging/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listing_id: listing.id,
            seller_id: listing.user_id,
            initial_message: messageContent
          }),
        })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to create conversation', new Error(errorText), {
          component: 'ConversationModal',
          action: 'handleSendMessage',
          listingId: listing.id
        })
          throw new Error('Failed to create conversation')
        }

        const { conversation_id, existing } = await response.json()
        currentConversationId = conversation_id
        setConversationId(currentConversationId)

        // If this was a new conversation with initial message, it's already sent
        if (!existing) {
          const newMessageObj = {
            id: Date.now().toString(), // Temporary ID
            content: messageContent,
            sender_id: user.id,
            created_at: new Date().toISOString(),
            is_read: false,
            status: 'sent' as const
          }
          setMessages(prev => [...prev, newMessageObj])
          return
        }
      }

      // Send the message using optimized API
      const response = await fetch(`/api/messaging/conversations/${currentConversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error('Failed to send message', new Error(errorText), {
          component: 'ConversationModal',
          action: 'handleSendMessage',
          conversationId: currentConversationId
        })
        throw new Error('Failed to send message')
      }

      const { message: newMessage } = await response.json()

      // Add message to local state with status
      setMessages(prev => [...prev, { ...newMessage, status: 'sent' }])

    } catch (error) {
      logger.error('Error sending message', error as Error, {
        component: 'ConversationModal',
        action: 'handleSendMessage',
        conversationId
      })
      // Restore message to input on error
      setNewMessage(messageContent)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 h-[600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Send Message</h2>
              <p className="text-xs text-gray-500">Quick message to seller</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Vehicle Info */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            {listing.primary_image_url ? (
              <img
                src={listing.primary_image_url}
                alt={listing.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">
                {listing.title}
              </p>
              <p className="text-sm text-blue-600 font-semibold">
                Rs. {listing.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {!user ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Log in to send messages</h3>
              <p className="text-gray-600 mb-4 text-sm">You need to be logged in to contact the seller</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setAuthType('login')
                    setShowAuthModal(true)
                  }}
                  variant="primary"
                  size="default"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    setAuthType('register')
                    setShowAuthModal(true)
                  }}
                  variant="outline"
                  size="default"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === user.id
              const senderProfile = isCurrentUser ? userProfile : sellerProfile
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
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
                  <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 px-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <p className="text-xs text-gray-500">
                        {formatMessageTime(message.created_at)}
                      </p>
                      {isCurrentUser && (
                        <div className="flex items-center">
                          {message.status === 'sending' && <Clock className="w-3 h-3 text-gray-400" />}
                          {message.status === 'sent' && <Check className="w-3 h-3 text-gray-400" />}
                          {message.status === 'delivered' && <CheckCheck className="w-3 h-3 text-gray-400" />}
                          {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                          {message.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Start the conversation!</p>
            </div>
          )}
          
          {sending && (
            <div className="flex justify-end gap-3">
              <div className="w-8 h-8"></div>
              <div className="max-w-xs">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-md opacity-70">
                  <p className="text-sm">{newMessage}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-2">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <p className="text-xs text-gray-500">Sending...</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white rounded-b-2xl">
          {user ? (
            <>
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                  className="flex-shrink-0 h-12 w-12 rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              {/* Smart Quick Messages */}
              <div className="mt-3 flex flex-wrap gap-2">
                {getContextualQuickReplies(messages, user?.id === listing.user_id ? 'seller' : 'buyer').map((quickMsg) => (
                  <Button
                    key={quickMsg}
                    onClick={() => setNewMessage(quickMsg)}
                    variant="ghost"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto rounded-full bg-gray-100 hover:bg-gray-200"
                    disabled={sending}
                  >
                    {quickMsg}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 text-sm">
              <LogIn className="w-5 h-5 mx-auto mb-2" />
              <p>Please log in to send messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authType}
      />
    </div>
  )
}