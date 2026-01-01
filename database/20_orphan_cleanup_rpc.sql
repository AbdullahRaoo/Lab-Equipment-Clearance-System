-- =====================================================
-- ORPHAN CLEANUP RPC FUNCTION
-- Run this in Supabase SQL Editor once
-- This creates a database function that the app can call
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_orphan_identity(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Delete orphan identities (identities without matching users)
    DELETE FROM auth.identities 
    WHERE email = target_email 
    AND user_id NOT IN (SELECT id FROM auth.users);
    
    -- Also delete if user exists but we're trying to clean up
    DELETE FROM auth.identities WHERE email = target_email;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_identity(TEXT) TO service_role;

SELECT 'Cleanup RPC function created!' as status;
