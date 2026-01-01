-- =====================================================
-- Fix handle_new_user Trigger (Run in Supabase SQL Editor)
-- This trigger runs when Auth creates a user and creates the profile
-- =====================================================

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a robust, error-tolerant trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into profiles with basic info
  -- The role defaults to 'student', can be updated later
  INSERT INTO public.profiles (id, email, full_name, role, is_active, reliability_score)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student',  -- Default role for self-registered users
    true,
    100
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'handle_new_user trigger error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;

-- Verify
SELECT 'Trigger fixed!' as status;
SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
