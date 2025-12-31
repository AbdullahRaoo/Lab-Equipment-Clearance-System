-- =====================================================
-- Fix RLS Infinite Recursion (Profile Policy)
-- =====================================================

-- PROBLEM:
-- The policy "Admins full access" queries the 'profiles' table to check the user's role.
-- This triggers the policy again, creating an infinite loop (Recursion Error 42P17).

-- SOLUTION:
-- Use a SECURITY DEFINER function to check the role. 
-- SECURITY DEFINER functions run with the privileges of the creator (superuser), bypassing RLS.

BEGIN;

-- 1. Create the Helper Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin_safe() 
RETURNS BOOLEAN 
SECURITY DEFINER 
SET search_path = public, auth
LANGUAGE plpgsql 
AS $$
BEGIN
    -- Check if user exists and has admin role
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('hod', 'pro_hod')
    );
END;
$$;

-- 2. Drop the Broken Policy
DROP POLICY IF EXISTS "Admins full access" ON public.profiles;

-- 3. Create the New Non-Recursive Policy
CREATE POLICY "Admins full access" ON public.profiles 
FOR ALL 
USING ( public.check_is_admin_safe() );

-- 4. Ensure Self-View Policy exists (for non-admins)
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles 
FOR SELECT 
USING ( id = auth.uid() );

COMMIT;

SELECT 'Fixed RLS Recursion Policies.' as status;
