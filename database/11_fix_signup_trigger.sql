-- Fix for Signup Trigger failure
-- The trigger was failing because RLS is enabled on public.profiles, but no INSERT policy exists.
-- Adding SECURITY DEFINER allows the function to bypass RLS and insert the profile with superuser privileges.

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 
        'student'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Added SECURITY DEFINER
