/*
  # Update storage policies for company logos

  1. Storage Policy Updates
    - Update the INSERT policy to allow uploads to company-logos folder
    - Ensure authenticated users can upload company logos during profile completion

  2. Security
    - Maintain existing security for profile-pictures and documents
    - Add company-logos to allowed upload paths
*/

-- Update the storage INSERT policy to include company-logos folder
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-files' AND 
    (
      (storage.foldername(name))[1] = 'profile-pictures' OR
      (storage.foldername(name))[1] = 'documents' OR
      (storage.foldername(name))[1] = 'company-logos'
    )
  );