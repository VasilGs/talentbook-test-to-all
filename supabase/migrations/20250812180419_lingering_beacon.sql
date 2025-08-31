/*
  # Create saved jobs table

  1. New Tables
    - `saved_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `job_id` (uuid, foreign key to job_posts)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `saved_jobs` table
    - Add policies for users to manage their own saved jobs
    - Unique constraint to prevent duplicate saves

  3. Indexes
    - Index on user_id for faster queries
    - Index on job_id for faster lookups
*/

-- Create the saved_jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.job_posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, job_id) -- Ensure a user can only save a job once
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for saved_jobs
CREATE POLICY "Users can insert their own saved jobs"
  ON public.saved_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved jobs"
  ON public.saved_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs"
  ON public.saved_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS saved_jobs_user_id_idx ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS saved_jobs_job_id_idx ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS saved_jobs_created_at_idx ON public.saved_jobs(created_at DESC);