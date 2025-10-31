'use client'

/**
 * Capacitor Initializer
 * 
 * Initializes Capacitor native features when the app runs in a native environment.
 * Should be included in the root layout or app entry point.
 */

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { initializePushNotifications } from '@/lib/push-notifications'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export default function CapacitorInitializer() {
  useEffect(() => {
    // Only initialize in native app
    if (!Capacitor.isNativePlatform()) {
      return
    }

    const initialize = async () => {
      try {
        // Initialize push notifications
        await initializePushNotifications({
          onNotificationReceived: (notification) => {
            console.log('Push notification received:', notification)
            // Handle notification display/action here
          },
          onNotificationAction: (action) => {
            console.log('Notification action performed:', action)
            // Handle notification tap/action
          },
          onTokenRegistration: (token) => {
            console.log('Push token registered:', token.value)
          },
          onRegistrationError: (error) => {
            console.error('Push registration error:', error)
          }
        })

        // Configure status bar
        try {
          await StatusBar.setStyle({ style: Style.Light })
          await StatusBar.setBackgroundColor({ color: '#1e40af' })
        } catch (error) {
          console.warn('Status bar configuration failed:', error)
        }

        // Hide splash screen after a delay
        setTimeout(async () => {
          try {
            await SplashScreen.hide()
          } catch (error) {
            console.warn('Splash screen hide failed:', error)
          }
        }, 2000)

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          console.log('App state changed. Is active?', isActive)
        })

        // Handle app URL open (deep links)
        App.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data.url)
          // Handle deep linking here
        })

        // Handle back button (Android)
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            // Show exit confirmation
            if (window.confirm('Do you want to exit the app?')) {
              App.exitApp()
            }
          } else {
            // Navigate back
            window.history.back()
          }
        })

        console.log('Capacitor initialized successfully')
      } catch (error) {
        console.error('Capacitor initialization error:', error)
      }
    }

    initialize()

    // Cleanup
    return () => {
      // Remove listeners if needed
    }
  }, [])

  // This component doesn't render anything
  return null
}

