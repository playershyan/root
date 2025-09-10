# Google OAuth Configuration Fix

## Issues Identified

1. **OAuth consent screen shows Supabase domain** instead of vera.lk
2. **Redirect fails to localhost:3000** in production

## Solution Applied

### 1. Code Fix (Completed)
Updated `lib/auth.ts` to use proper redirect URL:
- Added `NEXT_PUBLIC_SITE_URL` environment variable
- Modified `signInWithGoogle()` to use production URL

### 2. Required Configuration Steps

#### A. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to APIs & Services > Credentials
4. Click on your OAuth 2.0 Client ID
5. Add this Authorized redirect URI (ONLY this one):
   ```
   https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback
   ```
   **Important**: Do NOT add `https://vera.lk/api/auth/callback` - this causes the redirect_uri_mismatch error

#### B. Supabase Dashboard Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo/auth/providers)
2. Click on Google provider
3. Ensure these settings:
   - **Enabled**: Yes
   - **Client ID**: Your Google OAuth client ID (from Google Console)
   - **Client Secret**: Your Google OAuth client secret (from Google Console)
   - **Redirect URL**: This should show `https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback` (copy this to Google Console)
4. Go to URL Configuration section:
   - **Site URL**: Set to `https://vera.lk`
   - **Redirect URLs**: Add `https://vera.lk/api/auth/callback` to the allowed list

#### C. Environment Variables
Add to your production environment (.env.local or hosting platform):
```env
NEXT_PUBLIC_SITE_URL=https://vera.lk
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## OAuth Flow Explanation

The correct OAuth flow:
1. User clicks "Continue with Google" on vera.lk
2. Redirects to Google OAuth consent screen
3. Google redirects to `https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback` (Supabase handles token exchange)
4. Supabase redirects to `https://vera.lk/api/auth/callback` (your app's callback)
5. Your callback route processes the session and redirects to final destination (e.g., /profile)

This is normal behavior when using Supabase Auth. The Supabase domain appears because:
- Supabase handles the OAuth token exchange
- It provides additional security and session management
- This is the standard flow for all Supabase projects

## Alternative: Custom OAuth Implementation

If you need to show only "vera.lk" in the consent screen, you would need to:
1. Implement direct OAuth without Supabase Auth
2. Handle token exchange and session management manually
3. This requires significant additional code and security considerations

## Testing the Fix

After configuration:
1. Clear browser cookies/cache
2. Deploy the updated code to production
3. Try signing in with Google
4. Verify the flow:
   - Google consent screen appears
   - After consent, redirects through Supabase
   - Finally lands on `https://vera.lk/profile`
5. Check that user session is created properly

## Troubleshooting

Common issues and solutions:

### "redirect_uri_mismatch" error
- Ensure ONLY `https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback` is in Google Console
- Do NOT add `https://vera.lk/api/auth/callback` to Google Console
- The vera.lk callback URL should only be in Supabase's Redirect URLs list

### Still redirecting to localhost in production
- Check that the production deployment has the updated code
- Verify NEXT_PUBLIC_SITE_URL is set in production environment
- Clear browser cache and cookies

### Other issues
- Check Supabase logs: Dashboard > Logs > Auth
- Verify Google OAuth credentials are correctly entered in Supabase
- Test in incognito/private browsing mode