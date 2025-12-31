-- =====================================================
-- 🛑 EMERGENCY: DISABLE TRIGGER
-- dropping the signup trigger to see if it unblocks User Creation
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Also ensure public.profiles is clean for HOD
DELETE FROM public.profiles WHERE email = 'hod@nutech.edu.pk';

SELECT 'Trigger Dropped. You can now use the Dev Setup tool.' as status;
