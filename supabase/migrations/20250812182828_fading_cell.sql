/*
  # Create companies table

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp, auto-updated)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_name` (text, unique, not null)
      - `company_logo` (text, for Supabase Storage URL)
      - `industry` (text)
      - `website_link` (text)
      - `short_introduction` (text, max 700 chars)
      - `mol_name` (text, Manager/Representative)
      - `uic_company_id` (text, unique Company ID)
      - `address` (text)
      - `phone_number` (text)
      - `contact_email` (text, unique)
      - `responsible_person_name` (text)
      - `number_of_employees` (integer)
      - `subscription_package` (text, default 'free')

  2. Security
    - Enable RLS on `companies` table
    - Add policies for users to manage their own company profiles
    - Add policy for public viewing of company profiles (for job listings)

  3. Triggers
    - Auto-update `updated_at` timestamp on row changes

  4. Indexes
    - Performance indexes for common queries
*/

-- Create the companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  industry TEXT,
  website_link TEXT,
  short_introduction TEXT,
  mol_name TEXT,
  uic_company_id TEXT,
  address TEXT,
  phone_number TEXT,
  contact_email TEXT,
  responsible_person_name TEXT,
  number_of_employees INTEGER DEFAULT 0,
  subscription_package TEXT DEFAULT 'free',
  
  -- Constraints
  CONSTRAINT companies_short_introduction_length CHECK (char_length(short_introduction) <= 700),
  CONSTRAINT companies_subscription_package_check CHECK (subscription_package IN ('free', 'basic', 'premium', 'enterprise')),
  CONSTRAINT companies_number_of_employees_check CHECK (number_of_employees >= 0)
);

-- Create unique indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_company_name_key'
  ) THEN
    CREATE UNIQUE INDEX companies_company_name_key ON public.companies (company_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_uic_company_id_key'
  ) THEN
    CREATE UNIQUE INDEX companies_uic_company_id_key ON public.companies (uic_company_id) WHERE uic_company_id IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_contact_email_key'
  ) THEN
    CREATE UNIQUE INDEX companies_contact_email_key ON public.companies (contact_email) WHERE contact_email IS NOT NULL;
  END IF;
END $$;

-- Create performance indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_user_id_idx'
  ) THEN
    CREATE INDEX companies_user_id_idx ON public.companies (user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_industry_idx'
  ) THEN
    CREATE INDEX companies_industry_idx ON public.companies (industry);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'companies' AND indexname = 'companies_subscription_package_idx'
  ) THEN
    CREATE INDEX companies_subscription_package_idx ON public.companies (subscription_package);
  END IF;
END $$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION handle_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for companies table
DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_companies_updated_at();

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table

-- Users can create their own company profiles
CREATE POLICY "Users can create their own company profiles"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own company profiles
CREATE POLICY "Users can view their own company profiles"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own company profiles
CREATE POLICY "Users can update their own company profiles"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own company profiles
CREATE POLICY "Users can delete their own company profiles"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can view basic company information (for job listings)
CREATE POLICY "Public can view company profiles"
  ON public.companies
  FOR SELECT
  TO anon, authenticated
  USING (true);