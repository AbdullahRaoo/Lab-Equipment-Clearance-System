-- =====================================================
-- 🛡️ SAFE SIGNUP TRIGGER
-- Makes the user creation trigger "Crash Proof"
-- =====================================================

-- 1. Create the Function with Error Handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER -- Critical: Runs as Superuser to bypass RLS
AS $$
BEGIN
    -- Try to insert the profile
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
            'student' -- Default role
        )
        ON CONFLICT (id) DO NOTHING; -- If profile exists, do nothing (safe)
        
    EXCEPTION WHEN OTHERS THEN
        -- If something goes wrong (e.g. email unique constraint violation on public.profiles), 
        -- Log it but DO NOT FAIL the transaction.
        -- This allows the Auth User to be created even if the automatic profile fails.
        -- We can then fix the profile manually using the Dev Tool.
        RAISE WARNING 'handle_new_user trigger failed: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- 2. Re-Attach the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO postgres, service_role;
