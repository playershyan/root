# Java JDK Installation Guide for Android Development

Java JDK is required for Android app development. This guide will help you install Java JDK and generate the signing keystore.

## ⚠️ Current Status

Java JDK is **not installed** or **not in system PATH**.

## 📥 Install Java JDK

### Option 1: Oracle JDK (Recommended for Production)

1. **Download Oracle JDK 17 or 21:**
   - Go to: https://www.oracle.com/java/technologies/downloads/
   - Select Windows
   - Download JDK 17 or JDK 21 (LTS versions)
   - Choose: `x64 Installer` (`.exe` file)

2. **Run Installer:**
   - Double-click the downloaded `.exe` file
   - Click "Next" through the installer
   - **Note the installation path** (usually `C:\Program Files\Java\jdk-17` or `C:\Program Files\Java\jdk-21`)
   - Complete installation

3. **Set Environment Variables:**

   **Option A: Via GUI (Recommended)**

   a. Press `Win + X` → Select "System"
   b. Click "Advanced system settings" (right side)
   c. Click "Environment Variables" button
   d. Under "System variables":
      - Click "New"
      - Variable name: `JAVA_HOME`
      - Variable value: `C:\Program Files\Java\jdk-17` (or your JDK path)
      - Click OK
   e. Find "Path" in System variables → Click "Edit"
      - Click "New"
      - Add: `%JAVA_HOME%\bin`
      - Click OK on all windows

   **Option B: Via PowerShell (Admin)**

   ```powershell
   # Run PowerShell as Administrator
   [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-17', 'Machine')
   $path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
   [System.Environment]::SetEnvironmentVariable('Path', "$path;%JAVA_HOME%\bin", 'Machine')
   ```

4. **Verify Installation:**

   Open a **NEW** PowerShell/Command Prompt window:

   ```bash
   java -version
   # Should output: java version "17.x.x" or "21.x.x"

   keytool
   # Should output: Key and Certificate Management Tool
   ```

### Option 2: OpenJDK (Free Alternative)

1. **Download Microsoft Build of OpenJDK:**
   - Go to: https://learn.microsoft.com/en-us/java/openjdk/download
   - Download JDK 17 or 21 for Windows x64
   - Choose MSI installer

2. **Run Installer:**
   - The installer automatically sets `JAVA_HOME` and updates PATH
   - Follow prompts and complete installation

3. **Verify Installation:**
   ```bash
   java -version
   keytool
   ```

### Option 3: Using Chocolatey (Package Manager)

If you have Chocolatey installed:

```powershell
# Run as Administrator
choco install openjdk17
# or
choco install openjdk21
```

## 🔑 Generate Release Signing Keystore

After Java is installed, generate the keystore for signing your Android app.

### Step 1: Navigate to Project Directory

```bash
cd D:\projects\root
```

### Step 2: Generate Keystore

**Important:** Replace the placeholder values below with your actual information.

```bash
keytool -genkey -v -keystore vera-release.keystore -alias vera -keyalg RSA -keysize 2048 -validity 10000
```

### Step 3: Answer Prompts

You will be prompted for:

```
Enter keystore password: [Create a STRONG password - write it down securely]
Re-enter new password: [Same password]

What is your first and last name?
  [Unknown]:  Your Name or Company Name

What is the name of your organizational unit?
  [Unknown]:  Development Team

What is the name of your organization?
  [Unknown]:  VERA or Your Company

What is the name of your City or Locality?
  [Unknown]:  Your City

What is the name of your State or Province?
  [Unknown]:  Your State/Province

What is the two-letter country code for this unit?
  [Unknown]:  LK
Is CN=..., OU=..., O=..., L=..., ST=..., C=... correct?
  [no]:  yes

Enter key password for <vera>
        (RETURN if same as keystore password): [Press ENTER or use different password]
```

### Step 4: Secure the Keystore

**CRITICAL SECURITY STEPS:**

1. **Move keystore to secure location:**
   ```bash
   # Move OUTSIDE the project directory
   move vera-release.keystore C:\secure\vera-release.keystore
   ```

2. **Store passwords securely:**
   - Use a password manager (LastPass, 1Password, Bitwarden)
   - Never commit passwords to git
   - Keep backup in secure location

3. **Backup the keystore:**
   - Copy `vera-release.keystore` to secure cloud storage (encrypted)
   - Store on external drive
   - **Losing this file = cannot update app on Play Store**

### Step 5: Create keystore.properties

Create `android/keystore.properties` file:

```properties
storeFile=C:/secure/vera-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=vera
keyPassword=YOUR_KEY_PASSWORD
```

**Notes:**
- Use forward slashes `/` or double backslashes `\\` for Windows paths
- Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with actual passwords
- This file is already configured in `.gitignore`

### Step 6: Verify Setup

```bash
# List keystore contents
keytool -list -v -keystore C:\secure\vera-release.keystore

# You'll be prompted for the keystore password
# Should show details about your key
```

## 🔒 Security Best Practices

### ✅ DO:
- Store keystore file outside project directory
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Keep multiple secure backups
- Document keystore location and passwords in password manager
- Add keystore to `.gitignore`

### ❌ DON'T:
- Commit keystore to git
- Share keystore via email or messaging
- Store passwords in plain text files
- Keep keystore only in project directory
- Use weak or easily guessable passwords

## 🚨 If You Lose the Keystore

**WARNING:** If you lose the keystore file or password:
- You CANNOT update the app on Google Play Store
- You will need to publish as a completely new app
- All existing users cannot get updates
- You lose app reviews, ratings, and download statistics

**This is permanent and irreversible.**

## ✅ Verification Checklist

After completing installation:

- [ ] Java JDK installed (version 11 or higher)
- [ ] `java -version` works in new terminal
- [ ] `keytool` command available
- [ ] `JAVA_HOME` environment variable set
- [ ] Keystore generated (`vera-release.keystore`)
- [ ] Keystore moved to secure location outside project
- [ ] Keystore backed up in 2+ locations
- [ ] Passwords stored in password manager
- [ ] `android/keystore.properties` created
- [ ] `keystore.properties` path points to actual keystore location
- [ ] Keystore verified with `keytool -list`

## 🔄 Next Steps

After completing this guide:

1. Verify Java installation: `java -version`
2. Generate keystore following steps above
3. Return to `ANDROID_SETUP_MANUAL_STEPS.md`
4. Continue with "3. Build Production Assets"

## 🆘 Troubleshooting

### keytool not found after installation

**Solution:**
1. Close all terminal windows
2. Open NEW terminal/PowerShell
3. Try `keytool` again
4. If still not found, check PATH manually:
   ```bash
   echo $env:PATH
   # Should contain: C:\Program Files\Java\jdk-XX\bin
   ```

### "keytool is not recognized..."

**Cause:** Java not in PATH or terminal not restarted

**Solution:**
1. Restart terminal
2. Verify `JAVA_HOME`: `echo $env:JAVA_HOME`
3. Re-check environment variables setup
4. Reboot computer if needed

### Cannot find java.exe

**Cause:** Installation failed or path incorrect

**Solution:**
1. Check if JDK installed: Look in `C:\Program Files\Java\`
2. Reinstall JDK if missing
3. Verify installation path matches `JAVA_HOME`

### Access denied creating keystore

**Solution:**
- Run terminal as Administrator
- Or create keystore in user directory first, then move

## 📚 Additional Resources

- [Oracle JDK Download](https://www.oracle.com/java/technologies/downloads/)
- [Microsoft OpenJDK Download](https://learn.microsoft.com/en-us/java/openjdk/download)
- [Android Developer - App Signing](https://developer.android.com/studio/publish/app-signing)
- [keytool Documentation](https://docs.oracle.com/en/java/javase/17/docs/specs/man/keytool.html)
