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
        // Add platform class for CSS targeting
        if (Capacitor.getPlatform() === 'android') {
          document.body.classList.add('platform-android')
        }

        // Configure status bar IMMEDIATELY - BEFORE anything else
        // This prevents content from rendering behind status bar
        try {
          await StatusBar.setOverlaysWebView({ overlay: false })
          await StatusBar.setStyle({ style: Style.Light })
          await StatusBar.setBackgroundColor({ color: '#1e40af' })
        } catch (error) {
          console.warn('Initial status bar configuration failed:', error)
        }

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

            // Manually get safe area insets and set CSS variables
            const getSafeAreaInsets = async () => {
              try {
                const { insets } = await SafeArea.getSafeAreaInsets()

                // Set CSS custom properties
                const root = document.documentElement
                root.style.setProperty('--safe-area-inset-top', `${insets.top}px`)
                root.style.setProperty('--safe-area-inset-right', `${insets.right}px`)
                root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`)
                root.style.setProperty('--safe-area-inset-left', `${insets.left}px`)
              } catch (error) {
                console.warn('Failed to get safe area insets:', error)
                // Fallback to standard Android navigation bar height
                document.documentElement.style.setProperty('--safe-area-inset-bottom', '48px')
              }
            }

            // Get insets immediately
            await getSafeAreaInsets()

            // Re-get insets after splash screen hides (some devices need this)
            setTimeout(() => {
              getSafeAreaInsets()
            }, 2500)
          } catch (error) {
            console.warn('Safe area initialization failed:', error)
            // Fallback to standard Android navigation bar height
            document.documentElement.style.setProperty('--safe-area-inset-bottom', '48px')
            console.log('Using fallback navigation bar height: 48px')
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

        // Hide splash screen after a delay
        setTimeout(async () => {
          try {
            // Re-configure status bar AFTER splash screen hides
            // This ensures settings persist after splash screen closes
            await StatusBar.setOverlaysWebView({ overlay: false })
            await StatusBar.setStyle({ style: Style.Light })
            await StatusBar.setBackgroundColor({ color: '#1e40af' })
            
            await SplashScreen.hide()
            
            // One more time after hiding - ensure settings stick
            setTimeout(async () => {
              try {
                await StatusBar.setOverlaysWebView({ overlay: false })
              } catch (error) {
                console.warn('Post-splash status bar configuration failed:', error)
              }
            }, 100)
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

