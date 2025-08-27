'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, User, Car, MessageCircle } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  is_read: boolean
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

      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.user_id)
        .single()

      if (existingConversation) {
        // Load existing messages
        setConversationId(existingConversation.id)
        await loadMessages(existingConversation.id)
      } else {
        // No existing conversation, will be created when first message is sent
        setConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (convId: string) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, is_read')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(messagesData || [])

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', convId)
        .neq('sender_id', user!.id)
    } catch (error) {
      console.error('Error loading messages:', error)
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
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            listing_title: listing.title,
            listing_price: listing.price,
            listing_image_url: listing.primary_image_url,
            buyer_id: user.id,
            seller_id: listing.user_id
          })
          .select('id')
          .single()

        if (conversationError) throw conversationError
        
        currentConversationId = newConversation.id
        setConversationId(currentConversationId)
      }

      // Send the message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          sender_id: user.id,
          content: messageContent
        })
        .select('id, content, sender_id, created_at, is_read')
        .single()

      if (messageError) throw messageError

      // Add message to local state
      setMessages(prev => [...prev, newMessage])

    } catch (error) {
      console.error('Error sending message:', error)
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

  if (!isOpen || !user) return null

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
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
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
          {loading ? (
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
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {formatMessageTime(message.created_at)}
                    </p>
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
                <p className="text-xs text-gray-500 mt-1 px-2">Sending...</p>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
          {/* Quick Messages */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Is this still available?",
              "Can you negotiate on the price?",
              "Can I see the vehicle?"
            ].map((quickMsg) => (
              <button
                key={quickMsg}
                onClick={() => setNewMessage(quickMsg)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                disabled={sending}
              >
                {quickMsg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}