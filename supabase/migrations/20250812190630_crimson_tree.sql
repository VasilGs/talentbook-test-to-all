/*
  # Update handle_new_user function

  1. Function Updates
    - Properly parse full_name into first_name and last_name
    - Handle both job_seeker and company user types
    - Insert into appropriate tables based on user_type
    - Add error handling and fallback logic

  2. Security
    - Uses SECURITY DEFINER to bypass RLS during initial user creation
    - Includes proper error handling for unexpected user types

  3. Changes
    - Conditional insertion based on user_type from signup metadata
    - Proper name parsing using split_part function
    - Fallback handling for unknown user types
*/

-- Update the handle_new_user function to properly handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _user_type TEXT;
  _full_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
BEGIN
  -- Retrieve user_type and full_name from the new user's metadata
  _user_type := NEW.raw_user_meta_data->>'user_type';
  _full_name := NEW.raw_user_meta_data->>'full_name';

  -- Split the full_name into first_name and last_name
  -- COALESCE handles cases where full_name might be null or empty
  _first_name := COALESCE(split_part(_full_name, ' ', 1), '');
  _last_name := COALESCE(split_part(_full_name, ' ', 2), '');

  -- Conditionally insert into the appropriate table based on user_type
  IF _user_type = 'job_seeker' THEN
    -- Insert into the profiles table for job seekers
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (NEW.id, _first_name, _last_name);
  ELSIF _user_type = 'company' THEN
    -- Insert into the companies table for company users
    -- Use the full_name as a placeholder for company_name
    INSERT INTO public.companies (user_id, company_name)
    VALUES (NEW.id, COALESCE(_full_name, 'New Company'));
  ELSE
    -- Log a warning for unexpected user types and insert a basic profile
    -- to prevent the trigger from failing completely
    RAISE WARNING 'Unknown user_type: % for user %', _user_type, NEW.id;
    -- Fallback: Insert a basic profile into 'profiles' if user_type is unrecognized
    INSERT INTO public.profiles (id, first_name, last_name)
    VALUES (NEW.id, _first_name, _last_name);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to call handle_new_user after user insertion
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();