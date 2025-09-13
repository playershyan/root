/**
 * Enhanced fetch with retry logic, exponential backoff, and timeout support
 * Implements robust error handling and circuit breaker pattern
 */

export interface FetchWithRetryOptions extends RequestInit {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  timeout?: number
  retryOn?: number[]
  onRetry?: (attempt: number, error: Error | null, response: Response | null) => void
}

/**
 * Circuit breaker to prevent hammering failed services
 */
class CircuitBreaker {
  private failures = new Map<string, { count: number; lastFailure: number }>()
  private readonly threshold = 5
  private readonly resetTime = 60000 // 1 minute

  isOpen(url: string): boolean {
    const record = this.failures.get(url)
    if (!record) return false
    
    // Reset if enough time has passed
    if (Date.now() - record.lastFailure > this.resetTime) {
      this.failures.delete(url)
      return false
    }
    
    return record.count >= this.threshold
  }

  recordSuccess(url: string): void {
    this.failures.delete(url)
  }

  recordFailure(url: string): void {
    const record = this.failures.get(url) || { count: 0, lastFailure: 0 }
    record.count++
    record.lastFailure = Date.now()
    this.failures.set(url, record)
  }
}

const circuitBreaker = new CircuitBreaker()

/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay: number, factor = 0.3): number {
  const jitter = delay * factor * Math.random()
  return Math.floor(delay + jitter)
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller
}

/**
 * Enhanced fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    timeout = 30000,
    retryOn = [429, 500, 502, 503, 504],
    onRetry,
    ...fetchOptions
  } = options

  // Check circuit breaker
  if (circuitBreaker.isOpen(url)) {
    throw new Error(`Circuit breaker open for ${url}. Service temporarily unavailable.`)
  }

  let lastError: Error | null = null
  let lastResponse: Response | null = null
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout controller
      const timeoutController = timeout ? createTimeoutController(timeout) : null
      const signal = fetchOptions.signal || timeoutController?.signal

      // Make the request
      const response = await fetch(url, {
        ...fetchOptions,
        signal,
      })

      // Check if we should retry based on status code
      if (!response.ok && retryOn.includes(response.status) && attempt < maxRetries) {
        lastResponse = response
        
        // Handle rate limiting with Retry-After header
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          if (retryAfter) {
            // Parse Retry-After (can be seconds or HTTP date)
            const retryDelay = isNaN(Number(retryAfter))
              ? new Date(retryAfter).getTime() - Date.now()
              : Number(retryAfter) * 1000
            
            delay = Math.min(retryDelay, maxDelay)
          }
        }
        
        // Call retry callback
        onRetry?.(attempt + 1, null, response)
        
        // Wait with exponential backoff and jitter
        await new Promise(resolve => setTimeout(resolve, addJitter(delay)))
        
        // Increase delay for next attempt
        delay = Math.min(delay * backoffFactor, maxDelay)
        
        continue
      }

      // Success - record in circuit breaker and return
      circuitBreaker.recordSuccess(url)
      return response

    } catch (error) {
      lastError = error as Error
      
      // Don't retry on abort or non-retryable errors
      if (error instanceof Error && error.name === 'AbortError') {
        if (options.signal?.aborted) {
          throw error // User-initiated abort
        } else {
          throw new Error(`Request timeout after ${timeout}ms`)
        }
      }
      
      if (attempt < maxRetries) {
        // Call retry callback
        onRetry?.(attempt + 1, error as Error, null)
        
        // Wait with exponential backoff and jitter
        await new Promise(resolve => setTimeout(resolve, addJitter(delay)))
        
        // Increase delay for next attempt
        delay = Math.min(delay * backoffFactor, maxDelay)
      }
    }
  }

  // All retries failed - record in circuit breaker
  circuitBreaker.recordFailure(url)
  
  // Throw the last error or create a generic one
  if (lastResponse) {
    throw new Error(`Request failed with status ${lastResponse.status} after ${maxRetries} retries`)
  } else if (lastError) {
    throw lastError
  } else {
    throw new Error(`Request failed after ${maxRetries} retries`)
  }
}

/**
 * Fetch with timeout only (no retry)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = createTimeoutController(timeout)
  const signal = fetchOptions.signal || controller.signal
  
  try {
    return await fetch(url, { ...fetchOptions, signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * JSON fetch with retry and type safety
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    const error = await response.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${response.status}: ${error}`)
  }
  
  return response.json()
}

/**
 * Client-side API wrapper with built-in retry logic
 */
export class APIClient {
  private baseURL: string
  private defaultOptions: FetchWithRetryOptions

  constructor(baseURL = '', defaultOptions: FetchWithRetryOptions = {}) {
    this.baseURL = baseURL
    this.defaultOptions = {
      maxRetries: 3,
      timeout: 30000,
      ...defaultOptions,
    }
  }

  async get<T = any>(path: string, options?: FetchWithRetryOptions): Promise<T> {
    return fetchJsonWithRetry<T>(`${this.baseURL}${path}`, {
      ...this.defaultOptions,
      ...options,
      method: 'GET',
    })
  }

  async post<T = any>(
    path: string,
    body?: any,
    options?: FetchWithRetryOptions
  ): Promise<T> {
    return fetchJsonWithRetry<T>(`${this.baseURL}${path}`, {
      ...this.defaultOptions,
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T = any>(
    path: string,
    body?: any,
    options?: FetchWithRetryOptions
  ): Promise<T> {
    return fetchJsonWithRetry<T>(`${this.baseURL}${path}`, {
      ...this.defaultOptions,
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T = any>(path: string, options?: FetchWithRetryOptions): Promise<T> {
    return fetchJsonWithRetry<T>(`${this.baseURL}${path}`, {
      ...this.defaultOptions,
      ...options,
      method: 'DELETE',
    })
  }
}

/**
 * Example usage in components
 */
export const apiClient = new APIClient('/api', {
  maxRetries: 3,
  timeout: 15000,
  onRetry: (attempt, error, response) => {
    console.log(`Retry attempt ${attempt}`, { error, status: response?.status })
  },
})