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
import SafeArea from '@capacitor-community/safe-area'
import { logger } from '@/lib/utils/logger'

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
          // Handle error silently
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
            // Fallback to standard Android navigation bar height
            document.documentElement.style.setProperty('--safe-area-inset-bottom', '48px')
          }
        }

        // Initialize push notifications
        await initializePushNotifications({
          onNotificationReceived: (notification) => {
            logger.debug('Push notification received', { notification })
            // Handle notification display/action here
          },
          onNotificationAction: (action) => {
            logger.debug('Notification action performed', { action })
            // Handle notification tap/action
          },
          onTokenRegistration: (token) => {
            logger.info('Push token registered', { token: token.value })
          },
          onRegistrationError: (error) => {
            logger.error('Push registration error', error as Error)
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
                logger.warn('Post-splash status bar configuration failed', error as Error)
              }
            }, 100)
          } catch (error) {
            logger.warn('Splash screen hide failed', error as Error)
          }
        }, 2000)

        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
          logger.debug('App state changed', { isActive })
        })

        // Handle app URL open (deep links)
        App.addListener('appUrlOpen', (data) => {
          logger.info('App opened with URL', { url: data.url })
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

        logger.info('Capacitor initialized successfully')
      } catch (error) {
        logger.error('Capacitor initialization error', error as Error)
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

