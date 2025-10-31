# Android App Setup and Deployment Guide

This guide covers the setup, development, and deployment of the VERA Android app using Capacitor.

## Overview

The VERA Android app is a native Android application built with Capacitor that loads the production Next.js web application in a WebView. It includes native features like push notifications, camera access, SMS OTP auto-fill, and more.

## Prerequisites

- Node.js 18+ and npm
- Java JDK 11 or higher
- Android Studio (latest version)
- Android SDK (API Level 21+)
- Gradle 7.0+
- Production Next.js app deployed and accessible

## Initial Setup

### 1. Install Capacitor Dependencies

Dependencies should already be installed. Verify with:

```bash
npm list @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor Android Project

```bash
npx cap add android
```

This creates the `/android` directory with the Android project structure.

### 3. Configure Capacitor

The `capacitor.config.ts` file is already configured. Update the server URL in production:

```typescript
server: {
  url: 'https://vera.lk', // Production URL
  cleartext: false // HTTPS only in production
}
```

### 4. Build Next.js App

```bash
npm run build
```

This creates the `out` directory (or `.next` for static export) that Capacitor will bundle.

### 5. Sync to Android

```bash
npm run capacitor:sync
```

This copies the web assets to the Android project.

## Android Project Configuration

### 1. AndroidManifest.xml Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Internet permission -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Camera permission -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    
    <!-- Storage permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    
    <!-- SMS permission for OTP auto-fill -->
    <uses-permission android:name="android.permission.RECEIVE_SMS" />
    <uses-permission android:name="android.permission.READ_SMS" />
    
    <!-- Notification permission (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- Network state -->
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Location (if needed) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"
        android:required="false" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"
        android:required="false" />
</manifest>
```

### 2. App Configuration

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "lk.vera.app"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 3. Firebase Cloud Messaging (FCM) Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app to Firebase project
3. Download `google-services.json` and place in `android/app/`
4. Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

Add to `android/build.gradle`:

```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```

## Development

### Running in Android Studio

1. Open Android Studio
2. Open the `android` directory
3. Wait for Gradle sync to complete
4. Connect Android device via USB (enable USB debugging)
5. Click "Run" button or press `Shift+F10`

### Command Line Development

```bash
# Sync web assets
npm run android:sync

# Open in Android Studio
npm run android:open

# Build debug APK
npm run android:build

# Run on connected device
npm run android:run
```

### Live Reload

For development, you can use:

```bash
# Terminal 1: Run Next.js dev server
npm run dev:next-only

# Terminal 2: Sync Capacitor with localhost
# Update capacitor.config.ts server.url to 'http://localhost:3000'
npm run capacitor:sync

# Terminal 3: Run Android app
npm run android:run
```

## Native Features

### Push Notifications

1. FCM is already configured
2. Push token registration happens automatically in the app
3. Handle notifications in `lib/push-notifications.ts`

### Camera Integration

Camera access is integrated in:
- `app/components/ImageUploadWithCompression.tsx`
- Uses `lib/capacitor-bridge.ts` for native camera access

### SMS OTP Auto-fill

SMS auto-fill is implemented in:
- `app/components/auth/OTPVerification.tsx`
- Uses clipboard monitoring as fallback
- Full SMS Retriever API requires custom Capacitor plugin

### Other Features

- **Clipboard**: Copy/paste functionality via `lib/capacitor-bridge.ts`
- **File System**: Local file storage for caching
- **Network Status**: Detect online/offline state
- **Back Button**: Proper Android back button handling

## Building for Production

### 1. Generate Signing Key

```bash
keytool -genkey -v -keystore vera-release.keystore -alias vera -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file securely and never commit it to git.

### 2. Configure Signing

Create `android/keystore.properties`:

```properties
storeFile=../vera-release.keystore
storePassword=your_store_password
keyAlias=vera
keyPassword=your_key_password
```

Update `android/app/build.gradle`:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build Release APK/AAB

```bash
cd android
./gradlew assembleRelease  # APK
# or
./gradlew bundleRelease    # AAB (for Play Store)
```

Outputs:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## Google Play Store Deployment

### 1. Create Google Play Developer Account

- Sign up at https://play.google.com/console
- Pay one-time $25 registration fee

### 2. Create App Listing

1. Go to Play Console
2. Click "Create app"
3. Fill in app details:
   - App name: VERA
   - Default language: English
   - App or game: App
   - Free or paid: Free

### 3. Prepare Assets

- **App Icon**: 512x512px PNG (high-res)
- **Feature Graphic**: 1024x500px PNG
- **Screenshots**: At least 2, up to 8 per device type
  - Phone: 16:9 or 9:16 aspect ratio, min 320px, max 3840px
  - Tablet: Same requirements
- **Description**: Brief and detailed descriptions

### 4. Upload Release

1. Go to "Release" → "Production"
2. Click "Create new release"
3. Upload the AAB file
4. Add release notes
5. Review and submit

### 5. Content Rating

Complete the content rating questionnaire:
- Violence: None
- Sexual content: None
- Profanity: None
- Controlled substances: None
- Location data: Yes (for location filters)

### 6. Privacy Policy

Required if app collects user data:
- URL: `https://vera.lk/privacy`
- Accessible and comprehensive

### 7. Target Audience

- Age range: 13+ (for vehicle marketplace)
- Data collection: Specify what data is collected

### 8. Submit for Review

- Review typically takes 1-3 days
- Check status in Play Console

## Troubleshooting

### App Won't Load

1. Check `capacitor.config.ts` server URL
2. Verify production app is accessible
3. Check Android logs: `adb logcat`

### Camera Not Working

1. Verify camera permission in AndroidManifest.xml
2. Check runtime permission request
3. Test on real device (emulator may not have camera)

### Push Notifications Not Working

1. Verify FCM setup and `google-services.json`
2. Check notification permissions (Android 13+)
3. Verify token registration in app logs
4. Test with Firebase Console notification composer

### Build Errors

1. Clean build: `cd android && ./gradlew clean`
2. Invalidate caches in Android Studio: File → Invalidate Caches
3. Check Gradle version compatibility
4. Verify Java JDK version (11+)

### Network Issues

1. Ensure `INTERNET` permission in manifest
2. Check for network security config if using custom domains
3. Verify HTTPS certificate validity

## Testing Checklist

- [ ] App loads production URL successfully
- [ ] Splash screen displays and hides
- [ ] Push notifications received and handled
- [ ] Camera opens for photo upload
- [ ] Gallery selection works
- [ ] SMS OTP auto-fills (or clipboard fallback works)
- [ ] Clipboard copy/paste functions
- [ ] Back button navigation works
- [ ] Deep links open correct pages
- [ ] Offline message shows when no connection
- [ ] Pull-to-refresh reloads content
- [ ] Status bar styling matches theme
- [ ] App exits with confirmation

## Maintenance

### Updating Web App

1. Deploy new version to production
2. App automatically loads latest version (no update needed)
3. For breaking changes, increment `versionCode` and release update

### Updating Native Features

1. Make code changes
2. Run `npm run capacitor:sync`
3. Build and test
4. Release app update to Play Store

### Version Management

- `versionCode`: Integer (increment for each release)
- `versionName`: String (e.g., "1.0.1")
- Update both in `android/app/build.gradle`

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)
- [Firebase Console](https://console.firebase.google.com)

