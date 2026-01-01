-- =====================================================
-- NUTECH ECMS V3.0 - Safe Incremental Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add new columns to profiles (if they don't exist)
DO $$ 
BEGIN
    -- Add secondary_role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'secondary_role') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_role TEXT;
        RAISE NOTICE 'Added secondary_role column';
    END IF;

    -- Add secondary_lab_id column  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'secondary_lab_id') THEN
        ALTER TABLE public.profiles ADD COLUMN secondary_lab_id UUID REFERENCES public.labs(id);
        RAISE NOTICE 'Added secondary_lab_id column';
    END IF;

    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;

    -- Add notification_preferences column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'notification_preferences') THEN
        ALTER TABLE public.profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}';
        RAISE NOTICE 'Added notification_preferences column';
    END IF;

    -- Add contact_no column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'contact_no') THEN
        ALTER TABLE public.profiles ADD COLUMN contact_no TEXT;
        RAISE NOTICE 'Added contact_no column';
    END IF;
END $$;

-- Step 2: Add new columns to borrow_requests for approval tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'borrow_requests' 
                   AND column_name = 'current_stage') THEN
        
        ALTER TABLE public.borrow_requests 
            ADD COLUMN current_stage INT DEFAULT 1,
            ADD COLUMN stage1_approved_by UUID REFERENCES public.profiles(id),
            ADD COLUMN stage1_approved_at TIMESTAMPTZ,
            ADD COLUMN stage2_oic_approved_by UUID REFERENCES public.profiles(id),
            ADD COLUMN stage2_oic_approved_at TIMESTAMPTZ,
            ADD COLUMN stage2_asst_approved_by UUID REFERENCES public.profiles(id),
            ADD COLUMN stage2_asst_approved_at TIMESTAMPTZ,
            ADD COLUMN stage3_approved_by UUID REFERENCES public.profiles(id),
            ADD COLUMN stage3_approved_at TIMESTAMPTZ,
            ADD COLUMN handed_over_by UUID REFERENCES public.profiles(id),
            ADD COLUMN handed_over_at TIMESTAMPTZ,
            ADD COLUMN returned_received_by UUID REFERENCES public.profiles(id),
            ADD COLUMN returned_at TIMESTAMPTZ,
            ADD COLUMN rejected_by UUID REFERENCES public.profiles(id),
            ADD COLUMN rejected_at TIMESTAMPTZ,
            ADD COLUMN rejection_stage INT;
        
        RAISE NOTICE 'Added approval tracking columns to borrow_requests';
    END IF;
END $$;

-- Step 3: Update the role column to TEXT (to accept any role value)
-- This is safer than using ENUM since we can add new roles without migration
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;

-- Update the check constraint for valid roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs', 'lab_engineer', 'lab_assistant', 'student', 'admin', 'lab_admin'));

-- Step 4: Map old roles to new roles (if needed)
UPDATE public.profiles SET role = 'lab_engineer' WHERE role = 'lab_incharge';

-- Step 5: Create role hierarchy helper function
CREATE OR REPLACE FUNCTION public.get_role_level(p_role TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_role
    WHEN 'hod' THEN 1
    WHEN 'pro_hod' THEN 2
    WHEN 'oic_cen_labs' THEN 3
    WHEN 'asst_oic_cen_labs' THEN 4
    WHEN 'lab_engineer' THEN 5
    WHEN 'lab_assistant' THEN 6
    WHEN 'student' THEN 7
    WHEN 'admin' THEN 1  -- Legacy admin = HOD level
    WHEN 'lab_admin' THEN 5  -- Legacy lab_admin = Lab Engineer level
    ELSE 99
  END;
$$;

-- Step 6: Create can_manage_role function
CREATE OR REPLACE FUNCTION public.can_manage_role(manager_role TEXT, target_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN manager_role = 'hod' OR manager_role = 'admin' THEN true
    WHEN manager_role = 'pro_hod' AND target_role NOT IN ('hod', 'admin') THEN true
    WHEN manager_role = 'oic_cen_labs' AND public.get_role_level(target_role) > 2 THEN true
    WHEN manager_role = 'asst_oic_cen_labs' AND public.get_role_level(target_role) > 3 THEN true
    ELSE false
  END;
$$;

-- Done!
SELECT 'V3.0 Migration Complete!' as status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' 
ORDER BY ordinal_position;
