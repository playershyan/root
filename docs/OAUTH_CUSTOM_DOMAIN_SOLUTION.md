# Solution: Show vera.lk in Google OAuth Consent Screen

You're correct - seeing "ahmynvxoxzhocuhxlcvo.supabase.co" in the OAuth consent screen is not professional. Here are two solutions:

## Option 1: Supabase Custom Domain (Recommended)
**Cost**: $10/month (requires Pro plan or higher)

### Benefits
- Shows your domain (e.g., `auth.vera.lk`) in OAuth consent screen
- Maintains all Supabase Auth features (session management, security, etc.)
- Simple configuration, no code changes needed

### Setup Steps

1. **Enable Custom Domain Add-on**
   - Go to [Supabase Dashboard > Settings > Add-ons](https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo/settings/addons)
   - Enable Custom Domain add-on ($10/month)

2. **Configure DNS**
   - Add subdomain `auth.vera.lk` to your DNS provider
   - Create CNAME record: `auth.vera.lk` → `ahmynvxoxzhocuhxlcvo.supabase.co`

3. **Activate via Supabase CLI**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Create custom domain
   supabase domains create --project-ref ahmynvxoxzhocuhxlcvo --custom-hostname auth.vera.lk
   
   # Add TXT records provided to your DNS
   # Wait for DNS propagation (5-30 minutes)
   
   # Verify domain
   supabase domains reverify --project-ref ahmynvxoxzhocuhxlcvo
   
   # Activate domain
   supabase domains activate --project-ref ahmynvxoxzhocuhxlcvo
   ```

4. **Update Google OAuth**
   - In Google Cloud Console, change redirect URI to:
     `https://auth.vera.lk/auth/v1/callback`

5. **Update Client Code**
   ```typescript
   // lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = process.env.NODE_ENV === 'production' 
     ? 'https://auth.vera.lk'  // Custom domain
     : 'https://ahmynvxoxzhocuhxlcvo.supabase.co'
   
   export const supabase = createClient(
     supabaseUrl,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   ```

## Option 2: Direct Google OAuth Implementation
**Cost**: Free, but requires significant development

### Trade-offs
- ✅ Complete control over OAuth flow
- ✅ Shows vera.lk directly in consent screen
- ❌ Must implement session management yourself
- ❌ Must handle token refresh, security, etc.
- ❌ Lose Supabase Auth features (RLS integration, etc.)

### Implementation Overview

1. **Set up OAuth endpoint**
   ```typescript
   // app/api/auth/google/route.ts
   export async function GET(request: Request) {
     const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
     authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!)
     authUrl.searchParams.set('redirect_uri', 'https://vera.lk/api/auth/google/callback')
     authUrl.searchParams.set('response_type', 'code')
     authUrl.searchParams.set('scope', 'openid email profile')
     
     return Response.redirect(authUrl.toString())
   }
   ```

2. **Handle callback**
   ```typescript
   // app/api/auth/google/callback/route.ts
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url)
     const code = searchParams.get('code')
     
     // Exchange code for tokens
     const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         code,
         client_id: process.env.GOOGLE_CLIENT_ID,
         client_secret: process.env.GOOGLE_CLIENT_SECRET,
         redirect_uri: 'https://vera.lk/api/auth/google/callback',
         grant_type: 'authorization_code'
       })
     })
     
     const tokens = await tokenResponse.json()
     
     // Verify ID token and get user info
     // Create session in your database
     // Set cookies/JWT
     
     return Response.redirect('/profile')
   }
   ```

3. **Manage sessions manually**
   - Store sessions in database
   - Implement token refresh
   - Handle logout
   - Integrate with RLS policies

## Recommendation

**Use Option 1 (Custom Domain)** because:
1. Professional appearance - shows `auth.vera.lk` in consent screen
2. Maintains all Supabase Auth benefits
3. Much simpler than building OAuth from scratch
4. Worth the $10/month for a production application
5. Can be implemented in minutes vs days of development

The custom domain approach is standard practice for production applications using authentication services. Major platforms like Auth0, Firebase Auth, and AWS Cognito all offer similar custom domain features for this exact reason.

## Alternative: Vanity Subdomain (Free)
If budget is a concern, you can use a vanity subdomain like `vera.supabase.co` instead of the random string. This is free but still shows "supabase.co" in the domain.