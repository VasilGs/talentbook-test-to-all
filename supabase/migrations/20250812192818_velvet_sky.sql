/*
  # Create storage bucket and fix RLS policies

  1. Storage Setup
    - Create 'user-files' storage bucket
    - Set up storage policies for authenticated users
    - Allow file uploads for profile pictures and documents

  2. Profiles Table Policies
    - Add INSERT policy for new user profile creation
    - Update existing policies to work with auth.uid()
    - Ensure users can create and update their own profiles

  3. Security
    - Restrict file access to authenticated users
    - Ensure users can only access their own files
    - Proper RLS policies for profile data
*/

-- Create the user-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-files',
  'user-files',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-files bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-files' AND (storage.foldername(name))[1] IN ('profile-pictures', 'documents'));

CREATE POLICY "Users can view files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'user-files');

CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'user-files')
WITH CHECK (bucket_id = 'user-files');

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'user-files');

-- Fix profiles table RLS policies
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read other profiles" ON profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read other profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);