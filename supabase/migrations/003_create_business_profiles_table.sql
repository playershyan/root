-- Create business_profiles table for business user data
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

-- Enable Row Level Security
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for business_profiles table
CREATE POLICY "Business profiles are viewable by everyone" ON public.business_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own business profile" ON public.business_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own business profile" ON public.business_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own business profile" ON public.business_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own business profile" ON public.business_profiles
  FOR DELETE USING (auth.uid() = id);

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_business_profiles_business_name ON public.business_profiles(business_name);
CREATE INDEX idx_business_profiles_business_type ON public.business_profiles(business_type);
CREATE INDEX idx_business_profiles_is_verified ON public.business_profiles(is_verified);

-- Add account_type column to profiles table to distinguish between individual and business accounts
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual';

-- Create index for account_type
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);