/**
 * Capacitor Bridge - Native feature detection and wrapper
 *
 * This module provides a unified interface for native features that work
 * in both native app (Capacitor) and web browser environments.
 *
 * All native calls are wrapped with web fallbacks for graceful degradation.
 */

import { Capacitor } from '@capacitor/core'
import { logger } from '@/lib/utils/logger'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Clipboard } from '@capacitor/clipboard'
import { App } from '@capacitor/app'
import { Network } from '@capacitor/network'
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications'

export interface PlatformInfo {
  isNative: boolean
  platform: 'web' | 'android' | 'ios'
  device: {
    platform: string
    model: string
    operatingSystem: string
    osVersion: string
  }
}

/**
 * Check if running in native app or web browser
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Get platform information
 */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  const platform = Capacitor.getPlatform()
  
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: platform === 'ios' ? 'ios' : platform === 'android' ? 'android' : 'web',
    device: await Capacitor.getPlatform() === 'web' ? {
      platform: 'web',
      model: 'browser',
      operatingSystem: navigator.platform,
      osVersion: navigator.userAgent
    } : {
      platform: await Capacitor.getPlatform(),
      model: 'unknown',
      operatingSystem: await Capacitor.getPlatform(),
      osVersion: 'unknown'
    }
  }
}

/**
 * Camera functionality with web fallback
 */
export interface CameraOptions {
  quality?: number
  allowEditing?: boolean
  resultType?: 'base64' | 'uri' | 'DataUrl'
  source?: 'camera' | 'photos'
}

export interface CameraResult {
  base64String?: string
  dataUrl?: string
  path?: string
  format: string
  webPath?: string
}

export async function takePhoto(options: CameraOptions = {}): Promise<CameraResult | null> {
  try {
    if (isNative()) {
      const image = await Camera.getPhoto({
        quality: options.quality || 90,
        allowEditing: options.allowEditing || false,
        resultType: CameraResultType.Base64,
        source: options.source === 'photos' ? CameraSource.Photos : CameraSource.Camera
      })

      return {
        base64String: image.base64String,
        format: image.format,
        path: image.path,
        webPath: image.webPath
      }
    } else {
      // Web fallback: use file input
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.capture = options.source === 'camera' ? 'environment' : undefined
        
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) {
            resolve(null)
            return
          }

          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.split(',')[1]
            
            resolve({
              base64String: base64,
              dataUrl: dataUrl,
              format: file.type.split('/')[1],
              webPath: dataUrl
            })
          }
          reader.readAsDataURL(file)
        }
        
        input.click()
      })
    }
  } catch (error) {
    logger.error('Camera error', error as Error)
    return null
  }
}

/**
 * Pick image from gallery (photos)
 */
export async function pickFromGallery(options: Omit<CameraOptions, 'source'> = {}): Promise<CameraResult | null> {
  return takePhoto({ ...options, source: 'photos' })
}

/**
 * Clipboard operations with web fallback
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (isNative()) {
      await Clipboard.write({
        string: text
      })
      return true
    } else {
      // Web fallback
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (error) {
    logger.error('Clipboard write error', error as Error)
    return false
  }
}

export async function readFromClipboard(): Promise<string | null> {
  try {
    if (isNative()) {
      const { value } = await Clipboard.read()
      return value
    } else {
      // Web fallback
      const text = await navigator.clipboard.readText()
      return text
    }
  } catch (error) {
    logger.error('Clipboard read error', error as Error)
    return null
  }
}

/**
 * File system operations (native only)
 */
export async function saveFile(data: string, fileName: string, directory: Directory = Directory.Cache): Promise<string | null> {
  try {
    if (!isNative()) {
      // Web fallback: use browser download
      const blob = new Blob([data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      return null
    }

    const result = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: directory
    })

    return result.uri
  } catch (error) {
    logger.error('File save error', error as Error)
    return null
  }
}

export async function readFile(filePath: string, directory: Directory = Directory.Cache): Promise<string | null> {
  try {
    if (!isNative()) return null

    const result = await Filesystem.readFile({
      path: filePath,
      directory: directory
    })

    return typeof result.data === 'string' ? result.data : null
  } catch (error) {
    logger.error('File read error', error as Error)
    return null
  }
}

/**
 * App lifecycle and navigation
 */
export function handleBackButton(callback: () => void): () => void {
  if (isNative()) {
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        callback()
      }
    })
    
    return () => {
      App.removeAllListeners()
    }
  }
  
  // Web fallback: no-op
  return () => {}
}

export async function canGoBack(): Promise<boolean> {
  if (isNative()) {
    // In native, we track navigation stack
    return window.history.length > 1
  }
  return window.history.length > 1
}

export async function exitApp(): Promise<void> {
  if (isNative()) {
    await App.exitApp()
  }
  // Web fallback: no-op (can't exit browser)
}

/**
 * Network status detection
 */
export interface NetworkStatus {
  connected: boolean
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown'
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    if (isNative()) {
      const status = await Network.getStatus()
      return {
        connected: status.connected,
        connectionType: status.connectionType as 'wifi' | 'cellular' | 'none' | 'unknown'
      }
    } else {
      // Web fallback
      const online = navigator.onLine
      return {
        connected: online,
        connectionType: online ? 'wifi' : 'none'
      }
    }
  } catch (error) {
    logger.error('Network status error', error as Error)
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? 'unknown' : 'none'
    }
  }
}

export function onNetworkStatusChange(callback: (status: NetworkStatus) => void): () => void {
  if (isNative()) {
    let listenerHandle: any = null
    
    Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType as 'wifi' | 'cellular' | 'none' | 'unknown'
      })
    }).then(handle => {
      listenerHandle = handle
    })
    
    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove()
      }
    }
  } else {
    // Web fallback
    const handleOnline = () => callback({ connected: true, connectionType: 'wifi' })
    const handleOffline = () => callback({ connected: false, connectionType: 'none' })
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

/**
 * Push notifications - see lib/push-notifications.ts for full implementation
 * Import push notification functions directly from the module when needed
 */

