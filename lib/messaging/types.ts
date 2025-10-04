/**
 * Comprehensive TypeScript Types for Messaging System
 * Provides type safety across the entire messaging system
 */

// Core entity types
export interface ConversationEntity {
  id: string
  listing_id: string | null
  listing_title: string
  listing_price: number | null
  listing_image_url: string | null
  buyer_id: string
  seller_id: string
  last_message_at: string
  last_message_preview: string | null
  buyer_unread_count: number
  seller_unread_count: number
  is_active: boolean
  buyer_archived: boolean
  seller_archived: boolean
  created_at: string
  updated_at: string
}

export interface MessageEntity {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  status: 'active' | 'deleted'
  deleted_at: string | null
  deletion_reason: string | null
  permanently_deleted: boolean
  message_type: 'text' | 'offer' | 'image' | 'file'
  offer_data: any | null
}

// Enhanced types with computed fields
export interface ConversationWithMetadata extends ConversationEntity {
  current_user_role: 'buyer' | 'seller'
  unread_count: number
  is_archived: boolean
  other_user: {
    id: string
    name: string
    avatar_url?: string
  }
}

export interface MessageWithSender extends MessageEntity {
  sender: {
    id: string
    name: string
    avatar_url?: string
  }
}

// API request/response types
export interface CreateConversationRequest {
  listing_id: string
  seller_id: string
  initial_message?: string
}

export interface CreateConversationResponse {
  conversation_id: string
  existing: boolean
}

export interface SendMessageRequest {
  content: string
  message_type?: 'text' | 'offer' | 'image' | 'file'
  offer_data?: any
}

export interface SendMessageResponse {
  message: MessageWithSender
}

export interface GetConversationsResponse {
  conversations: ConversationWithMetadata[]
  count: number
}

export interface GetConversationResponse {
  conversation: ConversationWithMetadata
  messages: MessageWithSender[]
}

// Real-time event types
export interface RealtimeMessageEvent {
  type: 'message_received'
  payload: MessageWithSender
}

export interface RealtimeConversationEvent {
  type: 'conversation_updated'
  payload: Partial<ConversationEntity>
}

export interface RealtimeTypingEvent {
  type: 'typing'
  payload: {
    conversation_id: string
    user_id: string
    typing: boolean
  }
}

export type RealtimeEvent =
  | RealtimeMessageEvent
  | RealtimeConversationEvent
  | RealtimeTypingEvent

// Hook types for React components
export interface UseConversationsResult {
  conversations: ConversationWithMetadata[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UseConversationResult {
  conversation: ConversationWithMetadata | null
  messages: MessageWithSender[]
  loading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  markAsRead: () => Promise<void>
  refetch: () => Promise<void>
}

export interface UseMessagingRealtimeResult {
  isConnected: boolean
  error: string | null
  subscribe: (conversationId: string) => () => void
  sendTypingIndicator: (conversationId: string, typing: boolean) => void
}

// Performance monitoring types
export interface PerformanceMetric {
  operation: string
  duration_ms: number
  user_id?: string
  conversation_id?: string
  timestamp: string
}

// Error types
export interface MessagingErrorInfo {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Component prop types
export interface ConversationModalProps {
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

export interface MessageListProps {
  messages: MessageWithSender[]
  currentUserId: string
  loading?: boolean
  onRetry?: () => void
}

export interface MessageInputProps {
  onSend: (content: string) => Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export interface ConversationListProps {
  conversations: ConversationWithMetadata[]
  loading?: boolean
  onConversationSelect: (conversationId: string) => void
  selectedConversationId?: string
}

// Validation schemas (for runtime validation)
export interface ValidationSchema {
  messageContent: {
    required: boolean
    maxLength: number
    minLength: number
  }
  conversationAccess: {
    requireOwnership: boolean
  }
}

// Configuration types
export interface MessagingConfig {
  maxMessageLength: number
  typingIndicatorTimeout: number
  messageRetryAttempts: number
  realtimeReconnectInterval: number
  performanceLogging: boolean
}

// Status types
export type ConversationStatus = 'active' | 'archived' | 'deleted'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// Filter and sort types
export interface ConversationFilters {
  archived?: boolean
  unreadOnly?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

export type ConversationSortBy = 'last_message_at' | 'created_at' | 'unread_count'
export type SortOrder = 'asc' | 'desc'

export interface ConversationSort {
  by: ConversationSortBy
  order: SortOrder
}

// Pagination types
export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}