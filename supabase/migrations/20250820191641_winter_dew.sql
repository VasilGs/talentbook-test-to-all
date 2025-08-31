/*
  # Add Spotlight Boost Feature to Profiles

  1. Schema Changes
    - Add `spotlight_boost_expires_at` column to `profiles` table
    - This column will store when the spotlight boost expires for a user
    - NULL value means no active boost

  2. Security
    - No additional RLS policies needed as existing profile policies cover this column
    - Users can only update their own profile's boost status

  3. Notes
    - The column allows NULL values (no active boost)
    - Uses timestamptz for timezone awareness
    - Will be used to prioritize profiles in search results
*/

-- Add spotlight boost expiration column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'spotlight_boost_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN spotlight_boost_expires_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add index for efficient querying of boosted profiles
CREATE INDEX IF NOT EXISTS profiles_spotlight_boost_expires_at_idx 
ON profiles (spotlight_boost_expires_at DESC) 
WHERE spotlight_boost_expires_at IS NOT NULL;

-- Add index for active spotlight boosts (not expired)
CREATE INDEX IF NOT EXISTS profiles_active_spotlight_boost_idx 
ON profiles (spotlight_boost_expires_at DESC) 
WHERE spotlight_boost_expires_at > now();