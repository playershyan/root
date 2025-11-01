import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'lk.vera.app',
  appName: 'VERA',
  webDir: 'out',
  server: {
    // Point to production URL when building for Android
    url: process.env.CAPACITOR_SERVER_URL || 'https://vera.lk',
    cleartext: process.env.NODE_ENV === 'development' // Allow HTTP in development only
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAliasPassword: process.env.ANDROID_KEYSTORE_ALIAS_PASSWORD
    },
    // Enable safe area insets for Android
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV === 'development'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#1e40af',
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1e40af',
      overlay: false
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
}

export default config

