-- =====================================================
-- NUCLEAR FIX: Disable ALL auth triggers
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Drop ALL triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Step 2: Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 3: Verify no triggers remain
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Should return 0 rows if successful

-- Step 4: Clean up any orphan auth records
-- Delete any auth.identities for users that don't exist
DELETE FROM auth.identities 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Delete any auth.sessions for users that don't exist  
DELETE FROM auth.sessions 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 5: Check current auth.users count
SELECT 'Auth users' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles' as table_name, COUNT(*) as count FROM public.profiles;

-- Done!
SELECT 'Triggers disabled! Profile creation now handled by application.' as status;
