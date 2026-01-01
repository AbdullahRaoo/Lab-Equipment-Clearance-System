-- =====================================================
-- DELETE ORPHAN DATA FOR prohod@nutech.edu.pk
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Delete from auth.identities
DELETE FROM auth.identities WHERE email = 'prohod@nutech.edu.pk';

-- Step 2: Get user ID first, then delete related records
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'prohod@nutech.edu.pk';
    
    IF target_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user ID: %', target_user_id;
        
        -- Delete sessions (cast to match column type)
        DELETE FROM auth.sessions WHERE user_id = target_user_id::uuid;
        RAISE NOTICE 'Deleted sessions';
        
        -- Delete refresh tokens (user_id might be varchar, cast accordingly)
        DELETE FROM auth.refresh_tokens WHERE user_id::uuid = target_user_id;
        RAISE NOTICE 'Deleted refresh tokens';
        
        -- Delete MFA factors
        DELETE FROM auth.mfa_factors WHERE user_id = target_user_id::uuid;
        RAISE NOTICE 'Deleted MFA factors';
        
        -- Delete the auth user
        DELETE FROM auth.users WHERE id = target_user_id;
        RAISE NOTICE 'Deleted auth user';
    ELSE
        RAISE NOTICE 'No user found with this email';
    END IF;
END $$;

-- Step 3: Delete profile (if exists)  
DELETE FROM public.profiles WHERE email = 'prohod@nutech.edu.pk';

-- Verify cleanup
SELECT 'Done! All records deleted.' as status;
