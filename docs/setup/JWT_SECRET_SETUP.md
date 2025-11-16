# JWT Secret Setup for Custom Phone Auth

## Required for Custom OTP (text.lk) Integration

Since Supabase only supports Twilio/MessageBird for SMS, but you're using text.lk (Sri Lankan provider), you need to generate your own JWT tokens that Supabase will accept.

## Get Your JWT Secret from Supabase

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**

### Step 2: Locate JWT Secret

In the API Settings page, find the section called **JWT Settings** or **Project API keys**.

You'll see:
- `anon` key (public)
- `service_role` key (private)
- **JWT Secret** (shown below the keys)

### Step 3: Copy the JWT Secret

The JWT Secret will look like:
```
super-secret-jwt-token-with-at-least-32-characters
```

**⚠️ SECURITY WARNING**: This is a sensitive credential. Never commit it to git or expose it publicly.

### Step 4: Add to Environment Variables

**Local Development** (`.env.local`):
```bash
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**Vercel Production**:
1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `SUPABASE_JWT_SECRET`
   - **Value**: Your JWT secret from Supabase
   - **Environment**: Production, Preview, Development

## How It Works

### Traditional Flow (Supabase Native):
```
User → Supabase SMS (Twilio) → OTP → Supabase verifies → Session created
```

### Custom Flow (text.lk):
```
User → text.lk SMS → OTP → Your API verifies → Custom JWT signed → Session created
```

### JWT Token Structure

Your custom tokens match Supabase's format:

```json
{
  "aud": "authenticated",
  "sub": "user-id-here",
  "role": "authenticated",
  "email": "user@example.com",
  "phone": "94771234567",
  "app_metadata": {
    "provider": "phone",
    "providers": ["phone"]
  },
  "aal": "aal1",
  "amr": [{ "method": "otp", "timestamp": 1234567890 }],
  "session_id": "unique-session-id",
  "exp": 1234567890,
  "iat": 1234567890
}
```

## Verification

To verify your JWT secret is working:

1. Restart your development server after adding the env variable
2. Try logging in with phone OTP
3. Check browser console for session tokens
4. Session should be created successfully

## Troubleshooting

### Error: "SUPABASE_JWT_SECRET environment variable not set"

**Solution**:
1. Ensure `.env.local` has the variable
2. Restart your development server (`npm run dev`)
3. For Vercel, redeploy after adding the env variable

### Error: "Failed to set session"

**Solution**:
1. Verify the JWT secret matches exactly what's in Supabase dashboard
2. Check for extra spaces or newlines when copying
3. Ensure token expiry times are valid (not in the past)

### Sessions expire immediately

**Solution**:
- Check system clock is accurate
- Verify token expiry calculation in `lib/auth/jwt.ts`
- Default: 1 hour for access token, 7 days for refresh token

## Security Best Practices

1. ✅ **Never commit** `.env.local` to git
2. ✅ **Rotate secrets** if exposed
3. ✅ **Use environment-specific** secrets (dev vs production)
4. ✅ **Limit access** to JWT secret (only server-side code)
5. ❌ **Never expose** in client-side code or API responses

## Files Modified

- `lib/auth/jwt.ts` - JWT generation logic
- `app/api/auth/verify-phone-otp/route.ts` - Uses JWT for login flow
- `.env.local` - Contains JWT secret (local)
- Vercel Environment Variables - Contains JWT secret (production)

## Related Documentation

- [Phone OTP Verification Plan](../implementation/PHONE_OTP_VERIFICATION_PLAN.md)
- [Phone Format Standardization](../operations/PHONE_FORMAT_STANDARDIZATION.md)
- [text.lk Integration](../guides/SMS_OTP_FIXED.md)
