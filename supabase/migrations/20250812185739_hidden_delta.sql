/*
  # Job Seeker Profile and Experience Tables

  1. New Tables
    - `job_experiences`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key to profiles)
      - `company_name` (text, required)
      - `company_website` (text, optional)
      - `position_name` (text, required)
      - `position_description` (text, max 300 chars)
      - `start_date` (text, YYYY-MM format)
      - `end_date` (text, YYYY-MM format, nullable for current jobs)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Modifications
    - `profiles` table: Add `files` column for document storage
    - Remove `experience` column (moving to separate table)

  3. Security
    - Enable RLS on `job_experiences` table
    - Add policies for users to manage their own job experiences

  4. Performance
    - Add indexes for common queries
    - Add updated_at trigger for job_experiences
*/

-- Create the job_experiences table
CREATE TABLE IF NOT EXISTS public.job_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  company_website text,
  position_name text NOT NULL,
  position_description text,
  start_date text NOT NULL,
  end_date text,
  
  -- Constraints
  CONSTRAINT job_experiences_position_description_check CHECK (char_length(position_description) <= 300)
);

-- Add files column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'files'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN files jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Remove experience column from profiles table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'experience'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN experience;
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_job_experiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for job_experiences
DROP TRIGGER IF EXISTS job_experiences_updated_at ON public.job_experiences;
CREATE TRIGGER job_experiences_updated_at
  BEFORE UPDATE ON public.job_experiences
  FOR EACH ROW EXECUTE FUNCTION handle_job_experiences_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS job_experiences_profile_id_idx ON public.job_experiences(profile_id);
CREATE INDEX IF NOT EXISTS job_experiences_created_at_idx ON public.job_experiences(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.job_experiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_experiences
CREATE POLICY "Users can view their own job experiences"
  ON public.job_experiences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create their own job experiences"
  ON public.job_experiences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own job experiences"
  ON public.job_experiences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own job experiences"
  ON public.job_experiences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);