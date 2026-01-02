-- =====================================================
-- ECMS V3.1: Complete RLS Fix for Equipment Request Pipeline
-- =====================================================
-- This migration ensures the entire request flow works:
-- 1. Student can CREATE requests
-- 2. Student can VIEW their own requests
-- 3. Lab Staff can VIEW/UPDATE requests for their lab
-- 4. Admins can VIEW/UPDATE all requests
-- 5. Junction table (borrow_request_items) policies
-- =====================================================

BEGIN;

-- =====================================================
-- 1. DROP ALL EXISTING POLICIES (Clean Slate)
-- =====================================================

-- borrow_requests policies
DROP POLICY IF EXISTS "Students can create requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Students can view own requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Lab staff can view lab requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Lab staff can update lab requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.borrow_requests;
DROP POLICY IF EXISTS "Staff full access" ON public.borrow_requests;
DROP POLICY IF EXISTS "borrow_requests_select" ON public.borrow_requests;
DROP POLICY IF EXISTS "borrow_requests_insert" ON public.borrow_requests;
DROP POLICY IF EXISTS "borrow_requests_update" ON public.borrow_requests;

-- borrow_request_items policies
DROP POLICY IF EXISTS "Users can insert request items" ON public.borrow_request_items;
DROP POLICY IF EXISTS "Users can view request items" ON public.borrow_request_items;
DROP POLICY IF EXISTS "request_items_select" ON public.borrow_request_items;
DROP POLICY IF EXISTS "request_items_insert" ON public.borrow_request_items;

-- =====================================================
-- 2. HELPER FUNCTIONS (Avoid Recursion)
-- =====================================================

-- Check if current user is staff or admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs', 'lab_engineer', 'lab_assistant')
  );
$$;

-- Check if current user is admin (HOD/Pro-HOD/OIC level)
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
      AND role IN ('hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs')
  );
$$;

-- Get current user's assigned lab ID (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_lab_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT assigned_lab_id FROM public.profiles WHERE id = auth.uid();
$$;

-- =====================================================
-- 3. ENABLE RLS (Ensure it's on)
-- =====================================================

ALTER TABLE public.borrow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_request_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. BORROW_REQUESTS POLICIES
-- =====================================================

-- Policy 1: ANY authenticated user can INSERT their own request
CREATE POLICY "Anyone can create own request"
ON public.borrow_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 2: Users can SELECT their own requests
CREATE POLICY "Users can view own requests"
ON public.borrow_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Staff/Admin can SELECT all requests
CREATE POLICY "Staff can view all requests"
ON public.borrow_requests
FOR SELECT
TO authenticated
USING (public.check_is_staff_or_admin() = true);

-- Policy 4: Staff/Admin can UPDATE requests
CREATE POLICY "Staff can update requests"
ON public.borrow_requests
FOR UPDATE
TO authenticated
USING (public.check_is_staff_or_admin() = true)
WITH CHECK (public.check_is_staff_or_admin() = true);

-- Policy 5: Admin can DELETE requests (cleanup)
CREATE POLICY "Admin can delete requests"
ON public.borrow_requests
FOR DELETE
TO authenticated
USING (public.check_is_admin_safe() = true);

-- =====================================================
-- 5. BORROW_REQUEST_ITEMS POLICIES
-- =====================================================

-- Policy 1: Users can INSERT items for their own requests
CREATE POLICY "Users can add items to own requests"
ON public.borrow_request_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.borrow_requests
    WHERE id = request_id AND user_id = auth.uid()
  )
);

-- Policy 2: Users can VIEW items from their own requests
CREATE POLICY "Users can view own request items"
ON public.borrow_request_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.borrow_requests
    WHERE id = request_id AND user_id = auth.uid()
  )
);

-- Policy 3: Staff can VIEW all request items
CREATE POLICY "Staff can view all request items"
ON public.borrow_request_items
FOR SELECT
TO authenticated
USING (public.check_is_staff_or_admin() = true);

-- Policy 4: Staff can UPDATE/DELETE request items
CREATE POLICY "Staff can manage request items"
ON public.borrow_request_items
FOR ALL
TO authenticated
USING (public.check_is_staff_or_admin() = true)
WITH CHECK (public.check_is_staff_or_admin() = true);

-- =====================================================
-- 6. INVENTORY POLICIES (Ensure students can view)
-- =====================================================

DROP POLICY IF EXISTS "Public View Inventory" ON public.inventory;
DROP POLICY IF EXISTS "Admins Manage Inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff Manage Inventory" ON public.inventory;

-- Anyone can VIEW inventory
CREATE POLICY "Anyone can view inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (true);

-- Staff can manage inventory
CREATE POLICY "Staff can manage inventory"
ON public.inventory
FOR ALL
TO authenticated
USING (public.check_is_staff_or_admin() = true)
WITH CHECK (public.check_is_staff_or_admin() = true);

-- =====================================================
-- 7. PROFILES POLICIES (Fix if needed)
-- =====================================================

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins full access" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Staff/Admin can view all profiles (for approval dialogs, etc.)
CREATE POLICY "Staff can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.check_is_staff_or_admin() = true);

-- Admin can manage all profiles
CREATE POLICY "Admin can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.check_is_admin_safe() = true)
WITH CHECK (public.check_is_admin_safe() = true);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
SELECT 'RLS Policies Updated Successfully!' as status;

-- List all policies on borrow_requests
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'borrow_requests';
