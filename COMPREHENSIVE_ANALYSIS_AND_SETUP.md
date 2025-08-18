# AutoTrader.lk Comprehensive Analysis and Setup Guide

## 1. Data Field Mapping Analysis

### Current Database Tables and Field Mappings

#### A. Listings Table
**Current Fields in Database:**
- `id` (UUID) → Used across all listing pages
- `title` → Displayed in listing cards and detail pages
- `description` → Detail page main content
- `price` → Price display component
- `make` → Filter and display
- `model` → Filter and display  
- `year` → Filter and display
- `mileage` → Detail specifications
- `fuel_type` → Filter and specifications
- `transmission` → Filter and specifications
- `body_type` → Specifications
- `engine_capacity` → Specifications
- `location` → Location filter and display
- `phone`, `whatsapp`, `email` → Contact information
- `image_url`, `image_urls[]` → Image carousel
- `ai_generated_description`, `ai_summary` → AI enhanced content
- `is_featured` → Featured listings display
- `is_sold` → Status indicator
- `views` → View counter
- `created_at`, `updated_at` → Timestamps

**Finance-related fields (already added):**
- `pricing_type` ('cash'/'finance') → Price display type selector
- `negotiable` → Negotiable badge
- `finance_type` → Finance details section
- `finance_provider` → Finance provider display
- `original_amount` → Finance calculation base
- `outstanding_balance` → Finance details
- `monthly_payment` → Finance payment display
- `remaining_term` → Finance term display
- `early_settlement` → Settlement terms
- `asking_price` → Finance asking price

**Missing Promotion Fields (need to add):**
- `is_top_spot` → Top spot badge/position
- `is_boosted` → Boost indicator
- `is_urgent` → Urgent badge
- `boost_score` → Boost ranking
- `featured_until` → Feature expiry
- `top_spot_until` → Top spot expiry
- `boosted_until` → Boost expiry
- `urgent_until` → Urgent expiry

#### B. Wanted Requests Table  
**Current Fields:**
All fields properly mapped to `/wanted` page components

#### C. Missing Tables (need to create)

1. **profiles table** - User profile management
2. **business_profiles table** - Dealer/business accounts
3. **promotions table** - Promotion tracking
4. **promotion_rotations table** - Fair rotation system

## 2. Third-Party Services Identified

### Core Services:
1. **Supabase** - Database, Auth, Storage
2. **Stripe** - International payments
3. **PayHere** - Sri Lankan payments
4. **Google Gemini AI** - AI descriptions
5. **Google OAuth** - One-tap authentication
6. **Sentry** - Error tracking
7. **Cloudinary** (optional) - Image storage

## 3. Supabase Database Setup Guide

### Step 1: Create Missing Tables

#### Create profiles table:
```sql
-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT,
  location TEXT,
  language TEXT DEFAULT 'English',
  bio TEXT,
  avatar_url TEXT,
  membership_type TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_membership_type ON public.profiles(membership_type);
```

#### Create business_profiles table:
```sql
-- Create business_profiles table
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'Auto Dealer',
  description TEXT,
  logo_url TEXT,
  website TEXT,
  address TEXT,
  phone TEXT,
  operating_hours TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add account_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual';

-- Create indexes
CREATE INDEX idx_business_profiles_business_name ON public.business_profiles(business_name);
CREATE INDEX idx_business_profiles_is_verified ON public.business_profiles(is_verified);
```

#### Add missing promotion columns to listings:
```sql
-- Add promotion columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_top_spot BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS top_spot_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS urgent_until TIMESTAMP WITH TIME ZONE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_listings_top_spot ON listings(is_top_spot, top_spot_until);
CREATE INDEX IF NOT EXISTS idx_listings_boosted ON listings(is_boosted, boost_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_urgent ON listings(is_urgent, urgent_until);
CREATE INDEX IF NOT EXISTS idx_listings_promotions ON listings(
  is_featured DESC, 
  is_top_spot DESC, 
  is_boosted DESC, 
  boost_score DESC, 
  created_at DESC
);
```

#### Create promotions tables:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('featured', 'top_spot', 'boost', 'urgent')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_boosted_at TIMESTAMP WITH TIME ZONE,
  payment_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  rotation_score INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP WITH TIME ZONE,
  rotation_group VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, expires_at);
CREATE INDEX idx_promotions_type ON promotions(promotion_type, is_active);
CREATE INDEX idx_promotions_rotation ON promotions(promotion_type, rotation_score DESC, last_shown_at ASC);

-- Create rotation tracking table
CREATE TABLE IF NOT EXISTS promotion_rotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  promotion_type VARCHAR(50) NOT NULL,
  rotation_slot INTEGER NOT NULL,
  rotation_cycle INTEGER DEFAULT 0,
  impressions_in_cycle INTEGER DEFAULT 0,
  last_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rotation_type_slot ON promotion_rotations(promotion_type, rotation_slot);
CREATE INDEX idx_rotation_cycle ON promotion_rotations(rotation_cycle, promotion_type);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotions_updated_at 
BEFORE UPDATE ON promotions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Configure Authentication

1. **Enable Email/Password Auth:**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Email provider
   - Configure email templates

2. **Enable Google OAuth:**
   - Enable Google provider
   - Add Google Client ID and Secret
   - Configure redirect URLs

3. **Set up Auth Policies:**
   - Configure RLS policies for each table
   - Set up user roles if needed

### Step 3: Storage Buckets

```sql
-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('listings', 'listings', true),
  ('profiles', 'profiles', true),
  ('business', 'business', true);

-- Set up storage policies
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('listings', 'profiles', 'business'));

CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own uploads" ON storage.objects
  FOR UPDATE USING (auth.uid()::text = owner);

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (auth.uid()::text = owner);
```

### Step 4: Environment Variables Setup

Create `.env.local` file:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ahmynvxoxzhocuhxlcvo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Stripe
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# PayHere
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_secret
PAYHERE_CURRENCY=LKR

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# Cron Secret
CRON_SECRET=generate_random_string_here
```

## 4. Data Field Mapping Issues Found

### ✅ Correctly Mapped:
- All basic listing fields
- Finance-related fields
- Wanted request fields
- Contact information
- Location data
- Image handling

### ❌ Missing/Issues:
1. **Promotion fields not in database** - Need to add promotion columns to listings table
2. **User profiles table missing** - Required for user management
3. **Business profiles missing** - Required for dealer accounts
4. **Promotions tracking missing** - Required for paid features
5. **Vehicle type field** - Not consistently stored in database

## 5. Recommended Actions

1. **Immediate Actions:**
   - Run all SQL migrations above to create missing tables
   - Add missing promotion columns to listings table
   - Set up authentication providers in Supabase

2. **Configuration:**
   - Configure all environment variables
   - Set up storage buckets
   - Configure email templates

3. **Testing:**
   - Test authentication flow
   - Test listing creation with all fields
   - Test promotion system
   - Test payment integrations

4. **Security:**
   - Review and test all RLS policies
   - Set up proper CORS configuration
   - Configure rate limiting
   - Set up backup strategy

## 6. API Endpoints Verification

All API routes properly configured:
- `/api/auth/*` - Authentication endpoints
- `/api/payments/*` - Payment processing
- `/api/ai-description` - AI content generation
- `/api/cron/promotions` - Scheduled tasks
- `/api/generate-ai-guide` - AI guide generation

## 7. Component-Data Mapping

| Component | Data Source | Fields Used | Status |
|-----------|-------------|-------------|---------|
| ListingCard | listings table | title, price, image, location, badges | ✅ Working |
| FeaturedAdCard | listings + promotions | All listing fields + promotion status | ⚠️ Need promotion table |
| PriceDisplay | listings | price, pricing_type, finance fields | ✅ Working |
| VehicleForm | Input → listings | All vehicle fields | ✅ Working |
| WantedCard | wanted_requests | All wanted fields | ✅ Working |
| ProfilePage | profiles table | User profile fields | ❌ Table missing |
| DealerPage | business_profiles | Business fields | ❌ Table missing |

## Next Steps

I will now proceed to set up the missing database tables using Supabase MCP.