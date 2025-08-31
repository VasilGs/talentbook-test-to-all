/*
  # Create job_posts table

  1. New Tables
    - `job_posts`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)
      - `company_name` (text, required)
      - `company_logo` (text, URL for uploaded logo)
      - `company_website` (text, optional)
      - `position` (text, required)
      - `location` (text, required)
      - `salary` (text, optional)
      - `job_type` (text, e.g., 'Full-time', 'Part-time', 'Contract')
      - `experience_level` (text, e.g., 'Entry-level', 'Mid-level', 'Senior')
      - `short_description` (text, max 500 characters)
      - `requirements` (text, detailed requirements)
      - `skills` (jsonb, array of skills for tags)
      - `application_link` (text, URL for applications)
      - `is_remote` (boolean, default false)
      - `status` (text, default 'active')

  2. Security
    - Enable RLS on `job_posts` table
    - Add policies for public viewing and user management of own posts

  3. Triggers
    - Auto-update `updated_at` timestamp on row changes
*/

-- Create the job_posts table
CREATE TABLE IF NOT EXISTS public.job_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_logo text,
  company_website text,
  position text NOT NULL,
  location text NOT NULL,
  salary text,
  job_type text DEFAULT 'Full-time',
  experience_level text DEFAULT 'Mid-level',
  short_description text,
  requirements text,
  skills jsonb DEFAULT '[]'::jsonb,
  application_link text,
  is_remote boolean DEFAULT false,
  status text DEFAULT 'active',
  
  -- Constraints
  CONSTRAINT job_posts_short_description_length CHECK (char_length(short_description) <= 500),
  CONSTRAINT job_posts_job_type_check CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance')),
  CONSTRAINT job_posts_experience_level_check CHECK (experience_level IN ('Entry-level', 'Mid-level', 'Senior', 'Executive')),
  CONSTRAINT job_posts_status_check CHECK (status IN ('active', 'inactive', 'draft', 'closed'))
);

-- Enable Row Level Security
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Public job posts are viewable by everyone"
  ON public.job_posts
  FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

CREATE POLICY "Users can create their own job posts"
  ON public.job_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own job posts"
  ON public.job_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own job posts"
  ON public.job_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job posts"
  ON public.job_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION handle_job_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_posts_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS job_posts_user_id_idx ON public.job_posts(user_id);
CREATE INDEX IF NOT EXISTS job_posts_status_idx ON public.job_posts(status);
CREATE INDEX IF NOT EXISTS job_posts_location_idx ON public.job_posts(location);
CREATE INDEX IF NOT EXISTS job_posts_job_type_idx ON public.job_posts(job_type);
CREATE INDEX IF NOT EXISTS job_posts_created_at_idx ON public.job_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS job_posts_skills_idx ON public.job_posts USING GIN(skills);