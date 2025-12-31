-- =====================================================
-- 🔐 FINAL PASSWORD FIX
-- Force resets the HOD password ensuring proper hashing
-- =====================================================

-- 1. Ensure Extension exists in 'extensions' schema (standard for Supabase)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Update Password with explicit search path
DO $$
BEGIN
    -- Set path to find 'crypt' and 'gen_salt'
    PERFORM set_config('search_path', 'extensions,public', true);

    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'hod@nutech.edu.pk') THEN
        RAISE EXCEPTION 'User hod@nutech.edu.pk does not exist! Run the MASTER RESET script first.';
    END IF;

    -- Update Password to 'password123'
    UPDATE auth.users
    SET encrypted_password = crypt('password123', gen_salt('bf'))
    WHERE email = 'hod@nutech.edu.pk';

    RAISE NOTICE '✅ Password for HOD reset to: password123';
END $$;
