# Authentication Setup Guide

## Overview
The authentication system uses Supabase Auth with support for:
- Phone number authentication with OTP (SMS)
- Email/password authentication
- Automatic OTP retrieval on mobile devices (Web OTP API)

## Supabase Configuration

### 1. Enable Phone Authentication
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable "Phone" provider
4. Configure SMS settings (Twilio, MessageBird, or TextLocal)

### 2. Enable Email Authentication
1. In Authentication > Providers
2. Ensure "Email" provider is enabled
3. Configure email templates if needed

### 3. Database Setup
Run the migration files in order:
```sql
-- Run these in Supabase SQL Editor
-- 1. First run: 001_initial_schema.sql
-- 2. Then run: 002_create_profiles_table.sql
```

### 4. Environment Variables
Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional, for server-side operations)
```

## Features

### Phone OTP Authentication
- Users can sign in/sign up using their phone number
- OTP is sent via SMS
- Automatic OTP retrieval on Android devices with Chrome 93+
- Support for Sri Lankan phone numbers (+94)

### Email/Password Authentication
- Traditional email and password signup/signin
- Password reset functionality
- Email verification (optional)

### Automatic OTP Retrieval
The system uses the Web OTP API for automatic SMS code retrieval on supported devices:
- Android devices with Chrome 93+
- Devices with SIM card capability
- Requires HTTPS in production

### Security Features
- Row Level Security (RLS) on profiles table
- Secure session management
- Protected routes via middleware
- CSRF protection built-in

## User Flow

### Registration Flow
1. User enters name and phone number
2. Optional: User can choose email/password instead
3. OTP sent to phone for verification
4. Profile automatically created on successful verification

### Login Flow
1. User chooses phone or email authentication
2. For phone: Enter number → Receive OTP → Auto-fill (if supported) → Verify
3. For email: Enter credentials → Sign in

### Protected Routes
The following routes require authentication:
- `/profile` - User profile page
- `/post` - Create listing page
- `/wanted/post` - Create wanted request
- `/messages` - User messages

## Testing

### Test Phone Numbers (Supabase Test Mode)
Configure test phone numbers in Supabase dashboard under Authentication > Settings > Phone Auth

### Test OTP Auto-retrieval
1. Use an Android device or Chrome DevTools mobile emulation
2. Ensure the site is served over HTTPS (or localhost)
3. SMS format must include: `@yourdomain.com #123456` (domain and code)

## Troubleshooting

### OTP Not Sending
- Check SMS provider configuration in Supabase
- Verify phone number format (+94XXXXXXXXX for Sri Lanka)
- Check Supabase logs for errors

### Auto-retrieval Not Working
- Verify device supports Web OTP API
- Check browser compatibility (Chrome 93+)
- Ensure HTTPS is enabled
- SMS format must match Web OTP requirements

### Session Issues
- Clear browser cookies
- Check Supabase auth settings
- Verify environment variables are correct

## API Routes

### `/api/auth/callback`
Handles OAuth and magic link callbacks from Supabase

## Components

### `AuthContext`
- Provides user state throughout the app
- Handles auth state changes
- Located at: `/app/contexts/AuthContext.tsx`

### Auth Pages
- `/login` - Login page with phone/email options
- `/register` - Registration page
- `/forgot-password` - Password reset page

### Middleware
- Location: `/middleware.ts`
- Protects routes requiring authentication
- Redirects unauthenticated users to login