/*
  # Add new fields to job_posts table

  1. New Columns
    - `application_deadline` (date, nullable) - Specific date input for application deadline
    - `education_level` (text, nullable) - Dropdown of degree levels with option for no requirement
    - `benefits` (text, nullable) - Free text field for additional benefits
    - `required_documents` (text, nullable) - Free text field for needed documents from applicants

  2. Constraints
    - Add check constraint for education_level to ensure valid values
*/

-- Add new columns to job_posts table
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS application_deadline date,
ADD COLUMN IF NOT EXISTS education_level text,
ADD COLUMN IF NOT EXISTS benefits text,
ADD COLUMN IF NOT EXISTS required_documents text;

-- Add check constraint for education_level
ALTER TABLE job_posts 
ADD CONSTRAINT job_posts_education_level_check 
CHECK (education_level IS NULL OR education_level = ANY (ARRAY[
  'High School'::text, 
  'Associate''s Degree'::text, 
  'Bachelor''s Degree'::text, 
  'Master''s Degree'::text, 
  'PhD'::text, 
  'No specific requirement'::text
]));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS job_posts_application_deadline_idx ON job_posts (application_deadline);
CREATE INDEX IF NOT EXISTS job_posts_education_level_idx ON job_posts (education_level);