/**
 * Push Notifications Handler
 * 
 * Manages push notification setup, token registration, and notification handling
 * Works in both native app (FCM) and web browser (Web Push API) environments
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications, PushNotificationSchema, Token, ActionPerformed } from '@capacitor/push-notifications'
import { logger } from '@/lib/utils/logger'

export interface PushNotificationHandlers {
  onNotificationReceived?: (notification: PushNotificationSchema) => void
  onNotificationAction?: (action: ActionPerformed) => void
  onTokenRegistration?: (token: Token) => void
  onRegistrationError?: (error: Error) => void
}

let isInitialized = false
let handlers: PushNotificationHandlers = {}

/**
 * Initialize push notifications
 * 
 * This should be called once when the app starts
 */
export async function initializePushNotifications(callbacks: PushNotificationHandlers = {}): Promise<void> {
  if (isInitialized) {
    logger.warn('Push notifications already initialized', new Error('Duplicate initialization'))
    return
  }

  handlers = callbacks

  // Only initialize in native app
  if (!Capacitor.isNativePlatform()) {
    logger.info('Push notifications: Web environment detected, using Web Push API')
    await initializeWebPush(callbacks)
    return
  }

  try {
    // Register push notification listeners
    PushNotifications.addListener('registration', (token: Token) => {
      logger.info('Push registration success', { token: token.value })

      // Register token with backend
      registerPushToken(token.value)
        .catch(err => {
          logger.error('Failed to register push token', err as Error)
          handlers.onRegistrationError?.(new Error('Failed to register token with server'))
        })

      handlers.onTokenRegistration?.(token)
    })

    PushNotifications.addListener('registrationError', (error) => {
      logger.error('Error on registration', new Error(JSON.stringify(error)))
      handlers.onRegistrationError?.(new Error(error.toString()))
    })

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      logger.info('Push notification received', { notification })
      handlers.onNotificationReceived?.(notification)
    })

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      logger.info('Push notification action performed', { notification })
      handlers.onNotificationAction?.(notification)
    })

    // Register for push notifications
    await PushNotifications.register()

    isInitialized = true
    logger.info('Push notifications initialized successfully')
  } catch (error) {
    logger.error('Failed to initialize push notifications', error as Error)
    handlers.onRegistrationError?.(error as Error)
  }
}

/**
 * Request push notification permissions
 */
export async function requestPushPermissions(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return requestWebPushPermission()
  }

  try {
    const permResult = await PushNotifications.checkPermissions()
    if (permResult.receive === 'granted') {
      return true
    }

    const requestResult = await PushNotifications.requestPermissions()
    return requestResult.receive === 'granted'
  } catch (error) {
    logger.error('Error requesting push permissions', error as Error)
    return false
  }
}

/**
 * Get the current push notification token
 */
export async function getPushToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return getWebPushToken()
  }

  // In native, token is provided via registration event
  // You may want to store it and return from storage
  return null
}

/**
 * Register push token with backend API
 */
async function registerPushToken(token: string): Promise<void> {
  try {
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        platform: Capacitor.getPlatform(),
        deviceId: await getDeviceId()
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to register token: ${response.statusText}`)
    }

    const data = await response.json()
    logger.info('Push token registered', { data })
  } catch (error) {
    logger.error('Error registering push token', error as Error)
    throw error
  }
}

/**
 * Get device ID for tracking
 */
async function getDeviceId(): Promise<string> {
  // Generate a device ID from localStorage or use a UUID
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

/**
 * Web Push API implementation (for browser notifications)
 */
async function initializeWebPush(callbacks: PushNotificationHandlers): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    logger.warn('Web Push API not supported in this browser', new Error('API not available'))
    return
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js')
    logger.info('Service Worker registered', { registration })

    // Listen for push events from service worker
    if (registration.active) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          const notification = event.data.notification
          callbacks.onNotificationReceived?.(notification as PushNotificationSchema)
        }
      })
    }

    isInitialized = true
  } catch (error) {
    logger.error('Failed to initialize Web Push', error as Error)
  }
}

async function requestWebPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

async function getWebPushToken(): Promise<string | null> {
  // Web Push tokens are handled by service worker
  // You would need to implement service worker registration and get subscription
  return null
}

/**
 * Unregister push notifications (for logout, etc.)
 */
export async function unregisterPushNotifications(): Promise<void> {
  // Remove token from backend
  const token = await getPushToken()
  if (token) {
    try {
      await fetch('/api/notifications/unregister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token }),
        credentials: 'include'
      })
    } catch (error) {
      logger.error('Error unregistering push token', error as Error)
    }
  }
}

