-- =====================================================
-- NUTECH ECMS V3.0 - Database Migration
-- New Role Hierarchy & Equipment Request Pipeline
-- =====================================================

BEGIN;

-- 1. DROP OLD ENUMS (They need to be recreated with new values)
-- First, update columns to TEXT temporarily
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT;
ALTER TABLE public.borrow_requests ALTER COLUMN status TYPE TEXT;

-- Drop old types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- 2. CREATE NEW ROLE ENUM (7 levels)
CREATE TYPE user_role AS ENUM (
  'hod',                   -- Level 1: Full access
  'pro_hod',               -- Level 2: Can't manage HOD
  'oic_cen_labs',          -- Level 3: Can't manage HOD/Pro-HOD
  'asst_oic_cen_labs',     -- Level 4: Can't manage OIC+
  'lab_engineer',          -- Level 5: No user management
  'lab_assistant',         -- Level 6: No user management
  'student'                -- Level 7: Can submit requests only
);

-- 3. CREATE NEW REQUEST STATUS ENUM (Pipeline stages)
CREATE TYPE request_status AS ENUM (
  'submitted',             -- Initial submission
  'stage1_pending',        -- Awaiting Lab Engineer/Assistant
  'stage1_approved',       -- Lab staff approved
  'stage2_pending',        -- Awaiting OIC & Asst. OIC
  'stage2_approved',       -- Both OIC & Asst. approved
  'stage3_pending',        -- Awaiting HOD/Pro-HOD
  'approved',              -- Fully approved, ready for pickup
  'handed_over',           -- Equipment with student
  'returned',              -- Equipment returned, complete
  'rejected'               -- Rejected at any stage
);

-- 4. CONVERT COLUMNS BACK TO ENUMS
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE public.borrow_requests ALTER COLUMN status TYPE request_status USING 
  CASE 
    WHEN status IN ('pending', 'submitted') THEN 'submitted'::request_status
    WHEN status = 'approved' THEN 'approved'::request_status
    WHEN status = 'rejected' THEN 'rejected'::request_status
    WHEN status = 'returned' THEN 'returned'::request_status
    ELSE 'submitted'::request_status
  END;

-- 5. ADD APPROVAL TRACKING COLUMNS TO borrow_requests
ALTER TABLE public.borrow_requests 
  ADD COLUMN IF NOT EXISTS current_stage INT DEFAULT 1,
  
  -- Stage 1: Lab Engineer/Assistant (any one)
  ADD COLUMN IF NOT EXISTS stage1_approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stage1_approved_at TIMESTAMPTZ,
  
  -- Stage 2: OIC (required)
  ADD COLUMN IF NOT EXISTS stage2_oic_approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stage2_oic_approved_at TIMESTAMPTZ,
  
  -- Stage 2: Asst. OIC (required)
  ADD COLUMN IF NOT EXISTS stage2_asst_approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stage2_asst_approved_at TIMESTAMPTZ,
  
  -- Stage 3: HOD/Pro-HOD (any one)
  ADD COLUMN IF NOT EXISTS stage3_approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS stage3_approved_at TIMESTAMPTZ,
  
  -- Handover tracking
  ADD COLUMN IF NOT EXISTS handed_over_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS handed_over_at TIMESTAMPTZ,
  
  -- Return tracking
  ADD COLUMN IF NOT EXISTS returned_received_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  
  -- Rejection tracking
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_stage INT;

-- 6. ADD SECONDARY ROLE FOR DUAL-ROLE SUPPORT
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS secondary_role user_role,
  ADD COLUMN IF NOT EXISTS secondary_lab_id UUID REFERENCES public.labs(id);

-- 7. UPDATE NOTIFICATION PREFERENCES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}';

-- 8. CREATE ROLE HIERARCHY FUNCTION
CREATE OR REPLACE FUNCTION public.get_role_level(p_role user_role)
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
    ELSE 99
  END;
$$;

-- 9. CREATE CAN_MANAGE_ROLE FUNCTION
CREATE OR REPLACE FUNCTION public.can_manage_role(manager_role user_role, target_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    -- HOD can manage everyone
    WHEN manager_role = 'hod' THEN true
    -- Pro-HOD can manage everyone except HOD
    WHEN manager_role = 'pro_hod' AND target_role != 'hod' THEN true
    -- OIC can manage below Pro-HOD
    WHEN manager_role = 'oic_cen_labs' AND public.get_role_level(target_role) > 2 THEN true
    -- Asst. OIC can manage below OIC
    WHEN manager_role = 'asst_oic_cen_labs' AND public.get_role_level(target_role) > 3 THEN true
    ELSE false
  END;
$$;

COMMIT;

-- Verification
SELECT 'V3.0 Migration Complete' as status;
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype ORDER BY enumsortorder;
