# Android App - Manual Setup Steps

This document outlines the remaining manual steps required to complete the Android app setup after the automated configuration.

## ✅ Completed Automated Steps

The following configuration has been completed automatically:

1. ✅ Android project generated (`npx cap add android`)
2. ✅ AndroidManifest.xml configured with all required permissions
3. ✅ build.gradle configured with signing keys support
4. ✅ Firebase FCM dependencies added
5. ✅ SDK versions set (minSdk: 21, compileSdk: 34, targetSdk: 34)
6. ✅ capacitor.config.ts already configured

## 🔧 Required Manual Steps

### 1. Firebase Cloud Messaging (FCM) Setup

**Purpose:** Enable push notifications in the Android app

**Steps:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select existing project
3. Enter project name: `VERA` (or your preferred name)
4. Disable Google Analytics (optional) or link to GA account
5. Click "Create project"

**Add Android App to Firebase:**

1. In Firebase project overview, click "Add app" → Select Android icon
2. Register app:
   - **Android package name:** `lk.vera.app`
   - **App nickname:** `VERA Android`
   - **Debug signing certificate (optional):** Leave blank for now
3. Click "Register app"
4. **Download google-services.json**
5. Place `google-services.json` in `android/app/` directory
6. Click "Next" → **Skip the SDK setup steps** (already configured)
7. Click "Continue to console"

**Verify Setup:**

```bash
# Check if google-services.json exists
ls android/app/google-services.json
```

**What's Already Configured:**

✅ Google Services Gradle plugin (v4.4.4) added to project-level build.gradle
✅ Plugin applied in app-level build.gradle
✅ Firebase BoM (v34.4.0) for version management
✅ Firebase Messaging dependency
✅ Firebase Analytics dependency

The Firebase SDK is fully configured. You only need to download and place `google-services.json`.

### 2. Generate Release Signing Keys

**Purpose:** Sign the release APK/AAB for Google Play Store

**Prerequisites:** Java JDK must be installed

⚠️ **If `keytool` command is not recognized, follow `JAVA_INSTALLATION_GUIDE.md` first.**

**Generate Keystore:**

```bash
keytool -genkey -v -keystore vera-release.keystore -alias vera -keyalg RSA -keysize 2048 -validity 10000
```

**You will be prompted for:**
- Keystore password (create a strong password)
- Key password (can be same as keystore password)
- Name and organizational details

**Important:**
- Store the keystore file securely (outside the project directory)
- Never commit it to git
- Keep passwords in a secure password manager
- Loss of keystore = cannot update app on Play Store

**Create keystore.properties:**

Create `android/keystore.properties` file:

```properties
storeFile=../vera-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=vera
keyPassword=YOUR_KEY_PASSWORD
```

**Add to .gitignore:**

```bash
echo "android/keystore.properties" >> .gitignore
echo "vera-release.keystore" >> .gitignore
```

### 3. Build Production Assets

**Build Next.js for production:**

```bash
npm run build
```

This creates the `out` directory that Capacitor uses.

**Sync to Android:**

```bash
npx cap sync android
```

### 4. Open in Android Studio

**First Time Setup:**

```bash
npx cap open android
```

This opens the Android project in Android Studio.

**In Android Studio:**

1. Wait for Gradle sync to complete (may take 5-10 minutes first time)
2. If prompted, install any missing SDK components
3. Accept Android SDK licenses if prompted

### 5. Test on Device/Emulator

**Using Android Studio:**

1. Connect Android device via USB (enable USB debugging)
   - OR create Android Virtual Device (AVD) in Device Manager
2. Select device from dropdown
3. Click Run button (green play icon) or press `Shift+F10`

**Command Line:**

```bash
# Build and run debug version
cd android
./gradlew assembleDebug
./gradlew installDebug

# Or use npm scripts
npm run android:build
npm run android:run
```

### 6. Build Release APK/AAB

**For testing (APK):**

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

**For Google Play Store (AAB):**

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 7. App Icons and Splash Screen

**Generate App Icons:**

Required sizes for `android/app/src/main/res/`:
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

**Tools to generate icons:**
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
- [App Icon Generator](https://www.appicon.co/)

**Splash Screen:**

Place splash screen image in `android/app/src/main/res/drawable/splash.png`

Recommended size: 2732x2732px (centered content within safe area)

## 🔍 Verification Checklist

Before building release:

- [ ] `google-services.json` exists in `android/app/`
- [ ] Keystore file generated and stored securely
- [ ] `keystore.properties` configured (not committed to git)
- [ ] Production build completed (`npm run build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] App icons generated and placed
- [ ] Splash screen configured
- [ ] Tested on physical device or emulator
- [ ] Push notifications working (after FCM setup)
- [ ] Camera permission working
- [ ] All core features tested

## 📱 Testing Checklist

Test these features before release:

- [ ] App loads production URL (https://vera.lk)
- [ ] Splash screen displays correctly
- [ ] User can browse listings
- [ ] User can sign in/sign up
- [ ] Camera opens for photo upload
- [ ] Image upload from gallery works
- [ ] Push notifications received (after FCM setup)
- [ ] SMS OTP auto-fill works (or clipboard fallback)
- [ ] Location filters work
- [ ] Search functionality works
- [ ] Back button navigation correct
- [ ] App doesn't crash on network loss
- [ ] Deep links work (if implemented)

## 🚀 Next Steps: Google Play Store

After completing all manual steps and testing:

1. **Create Play Console Account:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Pay $25 one-time registration fee

2. **Prepare Store Listing:**
   - App name: VERA
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (minimum 2, up to 8)
   - Feature graphic (1024x500px)
   - Privacy policy URL: https://vera.lk/privacy

3. **Upload Release:**
   - Upload AAB file
   - Add release notes
   - Set version code: 1
   - Set version name: 1.0.0

4. **Content Rating:**
   - Complete questionnaire
   - Target audience: 13+ (vehicle marketplace)

5. **Submit for Review:**
   - Review typically takes 1-3 days
   - Monitor status in Play Console

## 📞 Support

For issues during setup:

1. Check [Capacitor Documentation](https://capacitorjs.com/docs)
2. Check [Android Developer Guide](https://developer.android.com/guide)
3. Check Firebase Console for FCM issues
4. Review Android Studio Logcat for errors: `adb logcat`

## 🔄 Development Workflow

For ongoing development:

```bash
# 1. Make changes to web app
# 2. Build production assets
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Open Android Studio
npx cap open android

# 5. Run on device
# (Use Android Studio Run button)
```

## 📝 Version Management

Update these for each release:

**android/app/build.gradle:**
```gradle
defaultConfig {
    versionCode 2        // Increment for each release
    versionName "1.0.1"  // Semantic versioning
}
```

**Git tag:**
```bash
git tag -a android-v1.0.1 -m "Android release 1.0.1"
git push origin android-v1.0.1
```

---

**Note:** The automated setup has configured all code-level requirements. The manual steps above are required for external services (Firebase), security (signing keys), and final deployment (Play Store).
