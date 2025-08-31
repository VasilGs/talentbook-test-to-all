/*
  # Create job applications table

  1. New Tables
    - `job_applications`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `job_post_id` (uuid, foreign key to job_posts)
      - `applicant_id` (uuid, foreign key to profiles)
      - `status` (text, default 'pending')
      - `cover_letter_text` (text, optional)

  2. Security
    - Enable RLS on `job_applications` table
    - Add policies for applicants to manage their own applications
    - Add policies for companies to view/manage applications for their job posts

  3. Indexes
    - Add indexes for better query performance
*/

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  job_post_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'interviewing', 'accepted', 'rejected')),
  cover_letter_text text,
  UNIQUE(job_post_id, applicant_id)
);

-- Add foreign key constraints
ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_job_post_id_fkey 
FOREIGN KEY (job_post_id) REFERENCES job_posts(id) ON DELETE CASCADE;

ALTER TABLE job_applications 
ADD CONSTRAINT job_applications_applicant_id_fkey 
FOREIGN KEY (applicant_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS job_applications_job_post_id_idx ON job_applications(job_post_id);
CREATE INDEX IF NOT EXISTS job_applications_applicant_id_idx ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS job_applications_status_idx ON job_applications(status);
CREATE INDEX IF NOT EXISTS job_applications_created_at_idx ON job_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy for applicants to insert their own applications
CREATE POLICY "Users can create their own applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

-- Policy for applicants to view their own applications
CREATE POLICY "Users can view their own applications"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

-- Policy for applicants to update their own applications (e.g., withdraw)
CREATE POLICY "Users can update their own applications"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = applicant_id)
  WITH CHECK (auth.uid() = applicant_id);

-- Policy for companies to view applications for their job posts
CREATE POLICY "Companies can view applications for their job posts"
  ON job_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_posts 
      WHERE job_posts.id = job_applications.job_post_id 
      AND job_posts.user_id = auth.uid()
    )
  );

-- Policy for companies to update application status for their job posts
CREATE POLICY "Companies can update application status for their job posts"
  ON job_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_posts 
      WHERE job_posts.id = job_applications.job_post_id 
      AND job_posts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_posts 
      WHERE job_posts.id = job_applications.job_post_id 
      AND job_posts.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column and trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_applications' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE job_applications ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS job_applications_updated_at ON job_applications;
CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_applications_updated_at();