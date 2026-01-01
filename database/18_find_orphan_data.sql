-- =====================================================
-- FIND AND CLEAN HIDDEN ORPHAN DATA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Replace this with the email that's failing
DO $$
DECLARE
    target_email TEXT := 'prohod@nutech.edu.pk';
    found_count INT := 0;
BEGIN
    RAISE NOTICE '=== Searching for orphan data for: % ===', target_email;
    
    -- Check auth.users
    SELECT COUNT(*) INTO found_count FROM auth.users WHERE email = target_email;
    RAISE NOTICE 'auth.users: % records', found_count;
    
    -- Check auth.identities (this is often where orphan data hides!)
    SELECT COUNT(*) INTO found_count FROM auth.identities WHERE email = target_email;
    RAISE NOTICE 'auth.identities: % records', found_count;
    
    -- Check public.profiles
    SELECT COUNT(*) INTO found_count FROM public.profiles WHERE email = target_email;
    RAISE NOTICE 'public.profiles: % records', found_count;
END $$;

-- Show all data for this email
SELECT 'auth.users' as table_name, id::text, email, created_at::text 
FROM auth.users WHERE email = 'prohod@nutech.edu.pk'
UNION ALL
SELECT 'auth.identities', id::text, email, created_at::text 
FROM auth.identities WHERE email = 'prohod@nutech.edu.pk'
UNION ALL
SELECT 'public.profiles', id::text, email, created_at::text 
FROM public.profiles WHERE email = 'prohod@nutech.edu.pk';

-- =====================================================
-- IF DATA IS FOUND, RUN THIS TO DELETE IT:
-- =====================================================

-- First, find the user_id from auth.identities (if exists)
-- DELETE FROM auth.identities WHERE email = 'prohod@nutech.edu.pk';

-- Then delete any sessions
-- DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'prohod@nutech.edu.pk');

-- Delete refresh tokens
-- DELETE FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'prohod@nutech.edu.pk');

-- Delete MFA
-- DELETE FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'prohod@nutech.edu.pk');

-- Finally delete the user
-- DELETE FROM auth.users WHERE email = 'prohod@nutech.edu.pk';

-- And profile
-- DELETE FROM public.profiles WHERE email = 'prohod@nutech.edu.pk';
