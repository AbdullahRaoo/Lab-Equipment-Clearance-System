-- =====================================================
-- ECMS Lab 1 & Lab 2 - Row Level Security Policies
-- M2 Task - Security Layer
-- =====================================================

-- =====================================================
-- LAB 1 - RLS POLICIES
-- =====================================================

-- Enable RLS on Lab 1 tables
ALTER TABLE lab1.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab1.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab1.returns ENABLE ROW LEVEL SECURITY;

-- ==================== INVENTORY POLICIES ====================

-- Policy: Everyone can view available inventory
CREATE POLICY "Everyone can view lab1 inventory"
  ON lab1.inventory
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Lab admins can insert inventory
CREATE POLICY "Lab admins can insert lab1 inventory"
  ON lab1.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
  );

-- Policy: Lab admins can update inventory
CREATE POLICY "Lab admins can update lab1 inventory"
  ON lab1.inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
  );

-- Policy: Lab admins can delete inventory
CREATE POLICY "Lab admins can delete lab1 inventory"
  ON lab1.inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
  );

-- ==================== ISSUES POLICIES ====================

-- Policy: Everyone can view issues
CREATE POLICY "Everyone can view lab1 issues"
  ON lab1.issues
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can report issues
CREATE POLICY "Users can create lab1 issues"
  ON lab1.issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Lab admins and issue reporter can update issues
CREATE POLICY "Lab admins can update lab1 issues"
  ON lab1.issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
    OR reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- ==================== RETURNS POLICIES ====================

-- Policy: Users can view their own returns
CREATE POLICY "Users can view own lab1 returns"
  ON lab1.returns
  FOR SELECT
  TO authenticated
  USING (
    borrower_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
  );

-- Policy: System creates return records
CREATE POLICY "System can create lab1 returns"
  ON lab1.returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Lab admins can update returns
CREATE POLICY "Lab admins can update lab1 returns"
  ON lab1.returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab1' = ANY(assigned_labs)))
    )
  );

-- =====================================================
-- LAB 2 - RLS POLICIES
-- =====================================================

-- Enable RLS on Lab 2 tables
ALTER TABLE lab2.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab2.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab2.returns ENABLE ROW LEVEL SECURITY;

-- ==================== INVENTORY POLICIES ====================

-- Policy: Everyone can view available inventory
CREATE POLICY "Everyone can view lab2 inventory"
  ON lab2.inventory
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Lab admins can insert inventory
CREATE POLICY "Lab admins can insert lab2 inventory"
  ON lab2.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
  );

-- Policy: Lab admins can update inventory
CREATE POLICY "Lab admins can update lab2 inventory"
  ON lab2.inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
  );

-- Policy: Lab admins can delete inventory
CREATE POLICY "Lab admins can delete lab2 inventory"
  ON lab2.inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
  );

-- ==================== ISSUES POLICIES ====================

-- Policy: Everyone can view issues
CREATE POLICY "Everyone can view lab2 issues"
  ON lab2.issues
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can report issues
CREATE POLICY "Users can create lab2 issues"
  ON lab2.issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Lab admins and issue reporter can update issues
CREATE POLICY "Lab admins can update lab2 issues"
  ON lab2.issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
    OR reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- ==================== RETURNS POLICIES ====================

-- Policy: Users can view their own returns
CREATE POLICY "Users can view own lab2 returns"
  ON lab2.returns
  FOR SELECT
  TO authenticated
  USING (
    borrower_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
  );

-- Policy: System creates return records
CREATE POLICY "System can create lab2 returns"
  ON lab2.returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Lab admins can update returns
CREATE POLICY "Lab admins can update lab2 returns"
  ON lab2.returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab2' = ANY(assigned_labs)))
    )
  );

-- =====================================================
-- HELPER FUNCTIONS FOR LAB 1 & LAB 2
-- =====================================================

-- Function: Get available equipment count for lab
CREATE OR REPLACE FUNCTION lab1.get_available_equipment_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lab1.inventory
  WHERE status = 'available';
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION lab2.get_available_equipment_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lab2.inventory
  WHERE status = 'available';
  
  RETURN v_count;
END;
$$;

-- Function: Get user's borrowed equipment
CREATE OR REPLACE FUNCTION lab1.get_user_borrowed_equipment(p_user_id UUID)
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, inventory.equipment_name, equipment_code, inventory.borrowed_at, inventory.expected_return_date
  FROM lab1.inventory
  WHERE current_borrower_id = p_user_id
  AND status = 'borrowed';
END;
$$;

CREATE OR REPLACE FUNCTION lab2.get_user_borrowed_equipment(p_user_id UUID)
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, inventory.equipment_name, equipment_code, inventory.borrowed_at, inventory.expected_return_date
  FROM lab2.inventory
  WHERE current_borrower_id = p_user_id
  AND status = 'borrowed';
END;
$$;

-- Function: Get overdue returns
CREATE OR REPLACE FUNCTION lab1.get_overdue_returns()
RETURNS TABLE (
  return_id UUID,
  equipment_name VARCHAR,
  borrower_name VARCHAR,
  expected_date DATE,
  days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    i.equipment_name,
    u.full_name,
    r.expected_return_date,
    r.days_overdue
  FROM lab1.returns r
  JOIN lab1.inventory i ON r.equipment_id = i.id
  JOIN central.users u ON r.borrower_id = u.id
  WHERE r.status = 'overdue'
  ORDER BY r.expected_return_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION lab2.get_overdue_returns()
RETURNS TABLE (
  return_id UUID,
  equipment_name VARCHAR,
  borrower_name VARCHAR,
  expected_date DATE,
  days_overdue INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    i.equipment_name,
    u.full_name,
    r.expected_return_date,
    r.days_overdue
  FROM lab2.returns r
  JOIN lab2.inventory i ON r.equipment_id = i.id
  JOIN central.users u ON r.borrower_id = u.id
  WHERE r.status = 'overdue'
  ORDER BY r.expected_return_date ASC;
END;
$$;
