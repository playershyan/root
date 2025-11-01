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
import { SafeArea } from '@capacitor-community/safe-area'

export default function CapacitorInitializer() {
  useEffect(() => {
    // Only initialize in native app
    if (!Capacitor.isNativePlatform()) {
      return
    }

    const initialize = async () => {
      try {
        // Initialize safe area insets for Android
        if (Capacitor.getPlatform() === 'android') {
          try {
            await SafeArea.enable({
              config: {
                customColorsForSystemBars: true,
                statusBarColor: '#1e40af', // Match status bar color
                statusBarContent: 'light',
                navigationBarColor: '#ffffff', // White navigation bar
                navigationBarContent: 'dark',
              },
            })
          } catch (error) {
            console.warn('Safe area initialization failed:', error)
          }
        }

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

        // Configure status bar BEFORE hiding splash screen
        try {
          // Critical: prevent content from rendering behind status bar
          await StatusBar.setOverlaysWebView({ overlay: false })
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

