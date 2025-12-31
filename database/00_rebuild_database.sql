-- =====================================================
-- ECMS V2.1: Advanced ERP Architecture (NUTECH Edition)
-- =====================================================

-- ⚠️ WARNING: THIS SCRIPT DESTRUCTIVELY DROPS EXISTING SCHEMAS
BEGIN;

-- 1. CLEANUP
DROP SCHEMA IF EXISTS central CASCADE;
DROP SCHEMA IF EXISTS lab1 CASCADE;
DROP SCHEMA IF EXISTS lab2 CASCADE;
DROP SCHEMA IF EXISTS lab3 CASCADE;
DROP SCHEMA IF EXISTS lab4 CASCADE;
DROP SCHEMA IF EXISTS lab5 CASCADE;

-- 2. RESET PUBLIC TABLES
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

-- 3. ENUMS
-- DROP TYPES (Cleanup)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS inventory_status CASCADE;
DROP TYPE IF EXISTS condition_type CASCADE;
DROP TYPE IF EXISTS issue_severity CASCADE;
DROP TYPE IF EXISTS maintenance_type CASCADE;
DROP TYPE IF EXISTS procurement_status CASCADE;

CREATE TYPE user_role AS ENUM ('hod', 'pro_hod', 'lab_incharge', 'lab_assistant', 'student');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'returned', 'overdue', 'cancelled');
CREATE TYPE inventory_status AS ENUM ('available', 'borrowed', 'maintenance', 'lost', 'retired');
CREATE TYPE condition_type AS ENUM ('excellent', 'good', 'fair', 'poor', 'damaged');
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE maintenance_type AS ENUM ('preventive', 'corrective', 'calibration');
CREATE TYPE procurement_status AS ENUM ('pending_hod', 'approved', 'rejected', 'ordered', 'delivered');

-- 3. CORE TABLES

-- LABS
CREATE TABLE public.labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(100), -- Room number/Block
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Review Reliability Score added)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    reg_no VARCHAR(50), 
    department VARCHAR(100),
    contact_no VARCHAR(20),
    avatar_url TEXT,
    
    -- Metrics
    reliability_score INT DEFAULT 100 CHECK (reliability_score BETWEEN 0 AND 100),
    
    -- Role Specifics
    assigned_lab_id UUID REFERENCES public.labs(id),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY (Advanced Asset Tracking)
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES public.labs(id) ON DELETE CASCADE,
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    serial_no VARCHAR(100),
    asset_tag VARCHAR(50) UNIQUE, -- Internal ID
    qr_code TEXT UNIQUE, -- Generated QR content
    
    -- Status
    status inventory_status DEFAULT 'available',
    condition condition_type DEFAULT 'good',
    
    -- Financial
    purchase_date DATE,
    price DECIMAL(10,2),
    supplier VARCHAR(255),
    
    -- Maintenance tracking
    maintenance_interval_days INT, -- e.g., 180 for 6 months
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BORROW REQUESTS (FYP & Usage tracking)
CREATE TABLE public.borrow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    lab_id UUID NOT NULL REFERENCES public.labs(id),
    
    request_type VARCHAR(20) CHECK (request_type IN ('university', 'home')),
    purpose TEXT NOT NULL,
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    return_time TIMESTAMPTZ, -- Actual return
    
    -- Group / FYP
    is_group_project BOOLEAN DEFAULT false,
    group_members JSONB DEFAULT '[]', 
    supervisor_name VARCHAR(255),
    
    status request_status DEFAULT 'pending',
    
    -- Approval Chain
    approved_by UUID REFERENCES public.profiles(id),
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,
    
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOIN TABLE for REQUESTS <-> INVENTORY
CREATE TABLE public.borrow_request_items (
    request_id UUID REFERENCES public.borrow_requests(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id),
    PRIMARY KEY (request_id, inventory_id)
);

-- ISSUES (Damages & Fines)
CREATE TABLE public.issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_id UUID NOT NULL REFERENCES public.labs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    inventory_id UUID REFERENCES public.inventory(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity issue_severity DEFAULT 'medium',
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'open',
    
    reported_by UUID REFERENCES public.profiles(id),
    evidence_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MAINTENANCE LOGS (New)
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

-- PROCUREMENT REQUESTS (New)
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

-- NOTIFICATIONS (New)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLEARANCE CERTIFICATES
CREATE TABLE public.clearance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    status VARCHAR(20) DEFAULT 'pending',
    approvals JSONB DEFAULT '{}',
    certificate_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SEED DATA
INSERT INTO public.labs (name, code) VALUES 
('Robotic Lab', 'ROBO'),
('DLD Lab', 'DLD'),
('IOT Lab', 'IOT'),
('Embedded Design Lab', 'EMB'),
('Computer & Network Lab', 'CNET');

-- 5. RLS & SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Labs" ON public.labs FOR SELECT USING (true);
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins full access" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('hod', 'pro_hod'))
);
-- (More specific policies will be added in implementation phase)

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'student');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
SELECT 'Database Rebuild Complete. V2.1 Schema Applied.' as status;
