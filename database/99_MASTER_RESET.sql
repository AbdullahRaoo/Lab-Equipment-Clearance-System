-- =====================================================
-- 🚨 ECMS MASTER RESET SCRIPT (NUTECH Edition) 🚨
-- =====================================================
-- Purpose:
-- 1. DROPS everything to ensure a clean slate.
-- 2. REBUILDS the schema (Tables, Enums, RLS).
-- 3. FIXES the "Recursive RLS" issue.
-- 4. FIXES the "Signup Trigger" permission issue.
-- 5. SEEDS initial Users (HOD, Pro HOD, Incharges).
-- 6. SEEDS Inventory items safely.
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. CLEANUP (Drop Old Objects)
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS central CASCADE;
DROP SCHEMA IF EXISTS lab1 CASCADE; 
DROP SCHEMA IF EXISTS lab2 CASCADE;
DROP SCHEMA IF EXISTS lab3 CASCADE;

DROP TABLE IF EXISTS public.borrow_request_items CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.maintenance_logs CASCADE;
DROP TABLE IF EXISTS public.procurement_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.borrow_requests CASCADE;
DROP TABLE IF EXISTS public.clearance_requests CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.labs CASCADE;

-- Cleanup Functions
DROP FUNCTION IF EXISTS public.check_is_admin_safe CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Cleanup Types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS inventory_status CASCADE;
DROP TYPE IF EXISTS condition_type CASCADE;
DROP TYPE IF EXISTS issue_severity CASCADE;
DROP TYPE IF EXISTS maintenance_type CASCADE;
DROP TYPE IF EXISTS procurement_status CASCADE;

-- -----------------------------------------------------
-- 2. REBUILD SCHEMA (Types & Tables)
-- -----------------------------------------------------
CREATE TYPE user_role AS ENUM ('hod', 'pro_hod', 'lab_incharge', 'lab_assistant', 'student');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue', 'cancelled');
CREATE TYPE inventory_status AS ENUM ('available', 'borrowed', 'maintenance', 'lost', 'retired');
CREATE TYPE condition_type AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'calibration');
CREATE TYPE procurement_status AS ENUM ('pending_hod', 'approved', 'rejected', 'ordered', 'delivered');

-- LABS
CREATE TABLE public.labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    reg_no VARCHAR(50), 
    department VARCHAR(100),
    contact_no VARCHAR(20),
    avatar_url TEXT,
    reliability_score INT DEFAULT 100 CHECK (reliability_score BETWEEN 0 AND 100),
    assigned_lab_id UUID REFERENCES public.labs(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_no VARCHAR(100),
    asset_tag VARCHAR(50) UNIQUE,
    qr_code TEXT UNIQUE,
    status inventory_status DEFAULT 'available',
    condition condition_type DEFAULT 'good',
    purchase_date DATE,
    price DECIMAL(10,2),
    supplier VARCHAR(255),
    maintenance_interval_days INT,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BORROW REQUESTS
CREATE TABLE public.borrow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    lab_id UUID NOT NULL REFERENCES public.labs(id),
    request_type VARCHAR(20) CHECK (request_type IN ('university', 'home')),
    purpose TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ,
    is_group_project BOOLEAN DEFAULT false,
    group_members JSONB DEFAULT '[]', 
    supervisor_name VARCHAR(255),
    status request_status DEFAULT 'pending',
    approved_by UUID REFERENCES public.profiles(id),
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REQUEST ITEMS JOIN
CREATE TABLE public.borrow_request_items (
    request_id UUID REFERENCES public.borrow_requests(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id),
    PRIMARY KEY (request_id, inventory_id)
);

-- MAINTENANCE LOGS
CREATE TABLE public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    maintenance_type maintenance_type NOT NULL,
    performed_by VARCHAR(255),
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cost DECIMAL(10,2) DEFAULT 0.00,
    technician_notes TEXT,
    next_due_date_set DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROCUREMENT
CREATE TABLE public.procurement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES public.labs(id),
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    item_name VARCHAR(255) NOT NULL,
    specification TEXT,
    quantity INT DEFAULT 1,
    estimated_cost_per_unit DECIMAL(10,2),
    justification TEXT NOT NULL,
    status procurement_status DEFAULT 'pending_hod',
    admin_comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- 3. SEED LABS
-- -----------------------------------------------------
INSERT INTO public.labs (name, code) VALUES 
('Robotic Lab', 'ROBO'),
('DLD Lab', 'DLD'),
('IOT Lab', 'IOT'),
('Embedded Design Lab', 'EMB'),
('Computer & Network Lab', 'CNET');

-- -----------------------------------------------------
-- 4. ENABLE RLS
-- -----------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 5. FIX RLS RECURSION (Critical Fix)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_is_admin_safe()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('hod', 'pro_hod', 'lab_incharge') -- Trusted roles
  );
$$;

-- RLS Policies
CREATE POLICY "Public Read Labs" ON public.labs FOR SELECT USING (true);
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());

-- Use the SAFE function to prevent recursion
CREATE POLICY "Admins full access" ON public.profiles FOR ALL USING (
    public.check_is_admin_safe() = true
);

-- Inventory Policies
CREATE POLICY "Public View Inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Admins Manage Inventory" ON public.inventory FOR ALL USING (
    public.check_is_admin_safe() = true
);

-- -----------------------------------------------------
-- 6. SETUP AUTH TRIGGER (Correct Permissions)
-- -----------------------------------------------------
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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER IS KEY HERE!

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- =====================================================
-- 🚨 PART 2: SEED USERS (The Fix for Invalid Creds)
-- =====================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- Helper to safely seed
CREATE OR REPLACE FUNCTION public.seed_user_safe(
    p_email TEXT,
    p_name TEXT,
    p_role user_role,
    p_lab_code TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_auth_id UUID;
    v_lab_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Get Lab ID if code provided
    IF p_lab_code IS NOT NULL THEN
        SELECT id INTO v_lab_id FROM public.labs WHERE code = p_lab_code;
    END IF;

    -- Generate a solid hash inside the function to avoid search_path issues
    -- Removing public. prefix to let search_path resolve it (Supabase puts it in extensions usually)
    v_encrypted_pw := crypt('password123', gen_salt('bf'));

    -- 1. DELETE EXISTING AUTH USER (Clean Slate)
    DELETE FROM auth.users WHERE email = p_email;
    
    -- 2. CREATE FRESH AUTH USER
    v_auth_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role
    ) VALUES (
        v_auth_id,
        p_email,
        v_encrypted_pw,
        now(),
        jsonb_build_object('full_name', p_name),
        'authenticated',
        'authenticated'
    );
    
    -- 3. ENSURE PROFILE (Upsert to be safe, though trigger should run)
    INSERT INTO public.profiles (id, email, full_name, role, assigned_lab_id)
    VALUES (v_auth_id, p_email, p_name, p_role, v_lab_id)
    ON CONFLICT (id) DO UPDATE
    SET 
        role = p_role, -- Force the role
        assigned_lab_id = v_lab_id,
        reliability_score = CASE WHEN p_role = 'student' THEN 80 ELSE 100 END;

END;
$$ LANGUAGE plpgsql;

-- Execute Seeding
DO $$
BEGIN
    PERFORM public.seed_user_safe('hod@nutech.edu.pk', 'Dr. System HOD', 'hod');
    PERFORM public.seed_user_safe('prohod@nutech.edu.pk', 'Dr. Pro HOD', 'pro_hod');
    PERFORM public.seed_user_safe('incharge.robo@nutech.edu.pk', 'Engr. Robo Head', 'lab_incharge', 'ROBO');
    PERFORM public.seed_user_safe('student1@nutech.edu.pk', 'Ali Khan', 'student');
END $$;

DROP FUNCTION public.seed_user_safe;
COMMIT;

-- =====================================================
-- 🚨 PART 3: SEED INVENTORY (Sample Data)
-- =====================================================
DO $$
DECLARE
    v_robo_id UUID;
BEGIN
    SELECT id INTO v_robo_id FROM public.labs WHERE code = 'ROBO';

    INSERT INTO public.inventory (lab_id, name, model, asset_tag, price, supplier, maintenance_interval_days) VALUES
    (v_robo_id, 'Dobot Magician', 'Lite', 'ROBO-001', 150000, 'Edutech', 180),
    (v_robo_id, 'KUKA Educational Robot', 'KR-3', 'ROBO-003', 2500000, 'Industrial Automation', 365)
    ON CONFLICT (asset_tag) DO NOTHING;
END $$;

SELECT 'MASTER RESET COMPLETE - SYSTEM READY' as status;
