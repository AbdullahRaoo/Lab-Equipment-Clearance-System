-- =====================================================
-- 🧹 COMPREHENSIVE AUTH CLEANUP
-- Deletes ALL traces of a user from Auth and Public tables
-- =====================================================

-- Target email to clean up
DO $$
DECLARE
    v_target_email TEXT := 'hod@nutech.edu.pk';
    v_user_id UUID;
BEGIN
    RAISE NOTICE 'Starting cleanup for: %', v_target_email;

    -- 1. Find the user ID in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found auth.users record: %', v_user_id;

        -- Delete from auth.identities first (FK constraint)
        DELETE FROM auth.identities WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted from auth.identities';

        -- Delete from auth.sessions
        DELETE FROM auth.sessions WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted from auth.sessions';

        -- Delete from auth.refresh_tokens
        DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted from auth.refresh_tokens';

        -- Delete from auth.mfa_factors
        DELETE FROM auth.mfa_factors WHERE user_id = v_user_id;
        RAISE NOTICE 'Deleted from auth.mfa_factors';

        -- Delete from public.profiles (our app table)
        DELETE FROM public.profiles WHERE id = v_user_id;
        RAISE NOTICE 'Deleted from public.profiles';

        -- Finally, delete from auth.users
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE 'Deleted from auth.users';

    ELSE
        RAISE NOTICE 'No user found in auth.users with email: %', v_target_email;
    END IF;

    -- Also cleanup any orphan profiles (email exists but no auth.users record)
    DELETE FROM public.profiles WHERE email = v_target_email;
    RAISE NOTICE 'Cleaned up orphan profiles (if any)';

    RAISE NOTICE '✅ Cleanup Complete for: %', v_target_email;
END $$;

-- Also ensure trigger is disabled
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

SELECT 'Cleanup Complete. Auth tables cleaned.' as status;
