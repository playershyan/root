/**
 * API Client Service
 * Centralized fetch wrapper with consistent error handling and authentication
 */

import { supabase } from '@/lib/supabase'

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  requireAuth?: boolean
}

interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

/**
 * Make authenticated API request
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true
  } = options

  try {
    // Get session token for authenticated requests
    let authHeaders = {}
    if (requireAuth) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return {
          success: false,
          error: 'Authentication required'
        }
      }
      authHeaders = {
        'Authorization': `Bearer ${session.access_token}`
      }
    }

    // Make request
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })

    // Parse response
    const responseData = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: responseData.error || responseData.message || `HTTP ${response.status}`,
        data: responseData
      }
    }

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<ApiClientOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options?: Omit<ApiClientOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' })
}
