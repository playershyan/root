# 🚀 AutoTrader.lk Environment Setup & Configuration Guide

## 📋 Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git configured
- [ ] Access to Supabase account
- [ ] Access to domain registrar (for autotrader.lk)

## 1️⃣ **Supabase Configuration** (Database & Auth)

Your Supabase project is already set up: **ahmynvxoxzhocuhxlcvo**

### Step 1.1: Get Supabase Keys
1. Go to [Supabase Dashboard](https://app.supabase.com/project/ahmynvxoxzhocuhxlcvo/settings/api)
2. Copy these keys:
   - **Project URL**: `https://ahmynvxoxzhocuhxlcvo.supabase.co`
   - **Anon/Public Key**: Found under "Project API keys" → anon/public
   - **Service Role Key**: Found under "Project API keys" → service_role (⚠️ Keep this secret!)

### Step 1.2: Configure Authentication
1. Go to [Authentication Settings](https://app.supabase.com/project/ahmynvxoxzhocuhxlcvo/auth/providers)
2. Enable **Email/Password** authentication
3. Enable **Google OAuth**:
   - Click on Google provider
   - You'll need Google Client ID and Secret (see Google OAuth section below)
   - Add redirect URL: `https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback`

## 2️⃣ **Google OAuth Setup** (For Google Sign-in)

### Step 2.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API

### Step 2.2: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Configure consent screen:
   - Application name: AutoTrader.lk
   - Support email: your-email@domain.com
   - Authorized domains: autotrader.lk
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: AutoTrader.lk Production
   - Authorized JavaScript origins:
     ```
     https://autotrader.lk
     http://localhost:3000 (for development)
     ```
   - Authorized redirect URIs:
     ```
     https://ahmynvxoxzhocuhxlcvo.supabase.co/auth/v1/callback
     https://autotrader.lk/api/auth/callback/google
     ```
5. Copy the **Client ID** and **Client Secret**

## 3️⃣ **Gemini AI Setup** (For AI Descriptions)

### Step 3.1: Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Select your Google Cloud project
4. Copy the API key

## 4️⃣ **Payment Gateway Setup**

### Option A: PayHere (Recommended for Sri Lanka)

1. Go to [PayHere](https://www.payhere.lk/)
2. Sign up for a merchant account
3. Get from dashboard:
   - Merchant ID
   - Merchant Secret
4. Configure notification URL: `https://autotrader.lk/api/payments/payhere/notify`
5. Set currency to LKR

### Option B: Stripe (For International)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)
3. Set up webhook:
   - Endpoint URL: `https://autotrader.lk/api/payments/webhook`
   - Events to listen: `payment_intent.succeeded`, `payment_intent.failed`

## 5️⃣ **Error Tracking with Sentry** (Optional but Recommended)

1. Go to [Sentry.io](https://sentry.io/)
2. Create new project:
   - Platform: Next.js
   - Project name: autotrader-lk
3. Get DSN from **Settings** → **Client Keys**
4. Note your organization slug and project name

## 6️⃣ **Create Environment Files**

### Step 6.1: Create `.env.local` for Development

```bash
# Create the file
cp .env.example .env.local
```

### Step 6.2: Fill in your `.env.local`:

```env
# ===== REQUIRED CONFIGURATIONS =====

# Supabase (Your existing project)
NEXT_PUBLIC_SUPABASE_URL=https://ahmynvxoxzhocuhxlcvo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# AI Features
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AutoTrader.lk

# Security (Generate using: openssl rand -base64 32)
CRON_SECRET=GENERATE_RANDOM_STRING_HERE
JWT_SECRET=GENERATE_RANDOM_STRING_HERE

# ===== PAYMENT CONFIGURATION (Choose one or both) =====

# PayHere (Sri Lankan Payments)
PAYHERE_MERCHANT_ID=YOUR_MERCHANT_ID
PAYHERE_MERCHANT_SECRET=YOUR_MERCHANT_SECRET
PAYHERE_CURRENCY=LKR

# Stripe (International Payments)
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# ===== OPTIONAL CONFIGURATIONS =====

# Email Service (for notifications)
EMAIL_FROM=noreply@autotrader.lk
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=YOUR_SENTRY_DSN
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=autotrader-lk

# Feature Flags
ENABLE_PROMOTIONS=true
ENABLE_ROTATION_SYSTEM=true
ENABLE_PAYMENT_PROCESSING=true

# Payment Sandbox (Development/Testing Only)
PAYMENT_SANDBOX_MODE=true  # Set to false in production
```

## 7️⃣ **Domain & Hosting Setup**

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

3. Configure domain:
   - Go to Vercel Dashboard → Project Settings → Domains
   - Add `autotrader.lk` and `www.autotrader.lk`
   - Update DNS records at your domain registrar:
     ```
     A Record: @ → 76.76.21.21
     CNAME: www → cname.vercel-dns.com
     ```

### Option 2: Railway

1. Go to [Railway.app](https://railway.app/)
2. Connect GitHub repository
3. Add environment variables in Railway dashboard
4. Configure custom domain

## 8️⃣ **SSL Certificate Setup**

- **Vercel**: Automatic SSL with Let's Encrypt ✅
- **Railway**: Automatic SSL ✅
- **Custom Server**: Use Certbot for Let's Encrypt

## 9️⃣ **Test Your Configuration**

### Step 9.1: Test Environment Variables
```bash
# Create a test script
node -e "console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Step 9.2: Test Database Connection
```bash
npm run dev
# Visit http://localhost:3000
# Check browser console for any errors
```

### Step 9.3: Test Authentication
1. Try signing up with email
2. Test Google Sign-in
3. Verify user appears in Supabase dashboard

### Step 9.4: Test Payment Integration
1. Create a test listing
2. Try to promote it
3. Complete payment flow
4. Verify webhook receives notification

## 🔟 **Production Deployment Checklist**

```bash
# Before deploying, ensure:
✅ All environment variables are set
✅ Database migrations are complete
✅ Authentication providers configured
✅ Payment gateway in production mode
✅ Domain DNS configured
✅ SSL certificate active
✅ Error tracking configured
✅ Backup strategy in place
```

## 📝 **Quick Commands Reference**

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data

# Deployment
vercel --prod          # Deploy to Vercel
git push origin main   # Trigger automatic deployment

# Testing
npm run test           # Run tests
npm run lint           # Check code quality
```

## 🆘 **Troubleshooting**

### Common Issues:

1. **"Invalid Supabase Key"**
   - Double-check you're using anon key for NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Service role key should never be exposed to client

2. **"Google Sign-in not working"**
   - Verify redirect URLs match exactly
   - Check Google Cloud Console for any errors
   - Ensure OAuth consent screen is configured

3. **"Payment not processing"**
   - Verify webhook URLs are accessible
   - Check payment gateway logs
   - Ensure production keys are used (not test keys)

4. **"Images not uploading"**
   - Check Supabase storage bucket policies
   - Verify file size limits (5MB default)
   - Ensure bucket is public

## 📞 **Support Resources**

- **Supabase Support**: https://supabase.com/docs
- **Vercel Support**: https://vercel.com/docs
- **PayHere Documentation**: https://support.payhere.lk/
- **Stripe Documentation**: https://stripe.com/docs

---

## ✅ **Next Steps After Setup**

1. Run `npm run dev` to test locally
2. Create a test listing to verify all features
3. Test payment flow end-to-end
4. Deploy to staging environment first
5. Run production tests
6. Go live! 🎉

---

*Last Updated: August 2025*