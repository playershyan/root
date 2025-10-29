<!-- 4ca75eca-7916-4630-8cfe-332dc9435d3f 5419974d-4607-47e1-b74d-964d48ab9768 -->
# Android WebView App with Native Features

## Overview

Transform the Next.js car listing platform into an Android app using Capacitor, pointing to the production URL with full native feature integration.

## Implementation Approach

**Framework**: Capacitor (Ionic's native bridge)
**Deployment**: WebView pointing to production URL
**Native Features**: Push notifications, Camera, Storage, SMS OTP auto-fill

## Setup Structure

### 1. Capacitor Integration

- Install Capacitor CLI and Android platform
- Initialize Capacitor config pointing to production URL
- Create Android project structure in `/android` directory
- Configure `capacitor.config.ts` with app details and server URL

### 2. Android Project Configuration

- Set up `android/app/build.gradle` with required permissions
- Configure `AndroidManifest.xml` with:
- Internet permission
- Camera permission
- Storage permissions (READ/WRITE)
- SMS receive permission (for OTP)
- Notification permission (Android 13+)
- Create app icons and splash screen resources
- Set app name, package ID, version

### 3. Native Plugin Integration

**Plugins to install:**

- `@capacitor/push-notifications` - Push notification handling
- `@capacitor/camera` - Camera access for car photo uploads
- `@capacitor/filesystem` - File storage access
- `@capacitor/clipboard` - Clipboard access
- `@capacitor/app` - App lifecycle, deep linking, back button
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - Native splash screen
- `@capacitor/network` - Network status detection
- Custom SMS Retriever plugin (or use community plugin)

### 4. Web App Integration Layer

Create `/lib/capacitor-bridge.ts` to handle native feature detection and calls:

- Detect if running in native app vs web browser
- Wrap all native calls with web fallbacks
- Export typed functions for each native feature

### 5. Feature Implementation

**Push Notifications:**

- Set up Firebase Cloud Messaging (FCM) in Android project
- Add `google-services.json` configuration
- Create notification handler in web app
- Add token registration endpoint to API
- Handle notification tap events

**Camera Access:**

- Integrate camera plugin for photo uploads
- Add photo selection from gallery option
- Handle permissions gracefully
- Maintain existing web upload as fallback

**Storage:**

- Use filesystem plugin for caching
- Store user preferences locally
- Cache frequently accessed data

**SMS OTP Auto-fill:**

- Implement SMS Retriever API integration
- Create custom Capacitor plugin if needed
- Auto-detect OTP format and fill input
- Add fallback to manual entry

**Clipboard:**

- Add clipboard read/write for sharing listings
- Copy phone numbers, URLs
- Paste OTP codes manually if auto-read fails

### 6. UX Enhancements

**Splash Screen:**

- Create native splash screen with app logo
- Configure duration and fade behavior
- Hide after app loads

**Pull-to-Refresh:**

- Enable native pull-to-refresh gesture
- Reload current page content

**Back Button:**

- Handle Android back button properly
- Navigate through app history
- Exit confirmation on home screen

**Status Bar:**

- Style to match app theme
- Set color based on current page

**Deep Linking:**

- Configure URL schemes for listings/profiles
- Handle app links from external sources

**Offline Detection:**

- Show user-friendly offline message
- Retry connection button
- Cache last viewed content

### 7. Build Configuration

**Development:**

- Script to sync web changes to Android project
- Live reload setup for testing
- USB debugging configuration

**Production:**

- Build signed APK/AAB for Play Store
- Configure ProGuard rules
- Set up release signing
- Version management

### 8. App Assets & Branding

- Generate app icons (all densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Create splash screen images
- Set app name: "TextLK" or your brand name
- Configure app theme colors

### 9. Documentation

Create `/docs/android-app.md` with:

- Setup instructions for development
- How to build and test locally
- Native feature usage guide
- Troubleshooting common issues
- Play Store deployment checklist

## Key Files to Create/Modify

**New Files:**

- `capacitor.config.ts` - Main Capacitor configuration
- `/android/*` - Entire Android project (auto-generated)
- `/lib/capacitor-bridge.ts` - Native bridge wrapper
- `/lib/push-notifications.ts` - Push notification handler
- `/app/api/notifications/register/route.ts` - Token registration API
- `/docs/android-app.md` - Documentation
- `.gitignore` updates for Android build files

**Modified Files:**

- `package.json` - Add Capacitor dependencies and scripts
- `next.config.js` - Update security headers for native app
- Relevant upload components - Add camera integration
- OTP input components - Add SMS auto-read

## Testing Checklist

- [ ] App loads production URL successfully
- [ ] Splash screen displays and hides correctly
- [ ] Push notifications received and handled
- [ ] Camera opens for photo upload
- [ ] Gallery selection works
- [ ] SMS OTP auto-fills correctly
- [ ] Clipboard copy/paste functions
- [ ] Back button navigation works
- [ ] Deep links open correct pages
- [ ] Offline message shows when no connection
- [ ] Pull-to-refresh reloads content
- [ ] Status bar styling matches theme
- [ ] App exits with confirmation

## Deployment Steps

1. Set up Google Play Developer account
2. Configure Firebase project for FCM
3. Generate signing keys
4. Build release AAB
5. Create Play Store listing
6. Upload screenshots and descriptions
7. Submit for review

### To-dos

- [ ] Install and configure Capacitor with Android platform
- [ ] Configure Android project with permissions and manifest settings
- [ ] Install all required Capacitor plugins (push, camera, storage, etc.)
- [ ] Create capacitor-bridge.ts wrapper with platform detection
- [ ] Implement push notification system with FCM integration
- [ ] Add camera plugin to photo upload components
- [ ] Implement SMS OTP auto-fill using SMS Retriever API
- [ ] Add splash screen, pull-to-refresh, back button handling, status bar styling
- [ ] Generate app icons and splash screen images
- [ ] Create build and deployment scripts for development and production
- [ ] Write comprehensive documentation for Android app setup and deployment