-- =====================================================
-- ECMS Lab 3, 4 & 5 - Row Level Security Policies
-- M3 Task - Security Layer
-- =====================================================

-- =====================================================
-- LAB 3 - RLS POLICIES
-- =====================================================

-- Enable RLS on Lab 3 tables
ALTER TABLE lab3.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab3.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab3.returns ENABLE ROW LEVEL SECURITY;

-- ==================== INVENTORY POLICIES ====================

CREATE POLICY "Everyone can view lab3 inventory"
  ON lab3.inventory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lab admins can insert lab3 inventory"
  ON lab3.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can update lab3 inventory"
  ON lab3.inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can delete lab3 inventory"
  ON lab3.inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
  );

-- ==================== ISSUES POLICIES ====================

CREATE POLICY "Everyone can view lab3 issues"
  ON lab3.issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create lab3 issues"
  ON lab3.issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Lab admins can update lab3 issues"
  ON lab3.issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
    OR reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- ==================== RETURNS POLICIES ====================

CREATE POLICY "Users can view own lab3 returns"
  ON lab3.returns
  FOR SELECT
  TO authenticated
  USING (
    borrower_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "System can create lab3 returns"
  ON lab3.returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Lab admins can update lab3 returns"
  ON lab3.returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab3' = ANY(assigned_labs)))
    )
  );

-- =====================================================
-- LAB 4 - RLS POLICIES
-- =====================================================

-- Enable RLS on Lab 4 tables
ALTER TABLE lab4.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab4.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab4.returns ENABLE ROW LEVEL SECURITY;

-- ==================== INVENTORY POLICIES ====================

CREATE POLICY "Everyone can view lab4 inventory"
  ON lab4.inventory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lab admins can insert lab4 inventory"
  ON lab4.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can update lab4 inventory"
  ON lab4.inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can delete lab4 inventory"
  ON lab4.inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
  );

-- ==================== ISSUES POLICIES ====================

CREATE POLICY "Everyone can view lab4 issues"
  ON lab4.issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create lab4 issues"
  ON lab4.issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Lab admins can update lab4 issues"
  ON lab4.issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
    OR reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- ==================== RETURNS POLICIES ====================

CREATE POLICY "Users can view own lab4 returns"
  ON lab4.returns
  FOR SELECT
  TO authenticated
  USING (
    borrower_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "System can create lab4 returns"
  ON lab4.returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Lab admins can update lab4 returns"
  ON lab4.returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab4' = ANY(assigned_labs)))
    )
  );

-- =====================================================
-- LAB 5 - RLS POLICIES
-- =====================================================

-- Enable RLS on Lab 5 tables
ALTER TABLE lab5.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab5.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab5.returns ENABLE ROW LEVEL SECURITY;

-- ==================== INVENTORY POLICIES ====================

CREATE POLICY "Everyone can view lab5 inventory"
  ON lab5.inventory
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lab admins can insert lab5 inventory"
  ON lab5.inventory
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can update lab5 inventory"
  ON lab5.inventory
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "Lab admins can delete lab5 inventory"
  ON lab5.inventory
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
  );

-- ==================== ISSUES POLICIES ====================

CREATE POLICY "Everyone can view lab5 issues"
  ON lab5.issues
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create lab5 issues"
  ON lab5.issues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Lab admins can update lab5 issues"
  ON lab5.issues
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
    OR reported_by = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- ==================== RETURNS POLICIES ====================

CREATE POLICY "Users can view own lab5 returns"
  ON lab5.returns
  FOR SELECT
  TO authenticated
  USING (
    borrower_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
  );

CREATE POLICY "System can create lab5 returns"
  ON lab5.returns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Lab admins can update lab5 returns"
  ON lab5.returns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR (role = 'lab_admin' AND 'lab5' = ANY(assigned_labs)))
    )
  );

-- =====================================================
-- HELPER FUNCTIONS FOR LAB 3, 4 & 5
-- =====================================================

-- Lab 3 Helper Functions
CREATE OR REPLACE FUNCTION lab3.get_available_equipment_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lab3.inventory
  WHERE status = 'available';
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION lab3.get_user_borrowed_equipment(p_user_id UUID)
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
  FROM lab3.inventory
  WHERE current_borrower_id = p_user_id
  AND status = 'borrowed';
END;
$$;

CREATE OR REPLACE FUNCTION lab3.get_overdue_returns()
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
  FROM lab3.returns r
  JOIN lab3.inventory i ON r.equipment_id = i.id
  JOIN central.users u ON r.borrower_id = u.id
  WHERE r.status = 'overdue'
  ORDER BY r.expected_return_date ASC;
END;
$$;

-- Lab 4 Helper Functions
CREATE OR REPLACE FUNCTION lab4.get_available_equipment_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lab4.inventory
  WHERE status = 'available';
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION lab4.get_user_borrowed_equipment(p_user_id UUID)
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
  FROM lab4.inventory
  WHERE current_borrower_id = p_user_id
  AND status = 'borrowed';
END;
$$;

CREATE OR REPLACE FUNCTION lab4.get_overdue_returns()
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
  FROM lab4.returns r
  JOIN lab4.inventory i ON r.equipment_id = i.id
  JOIN central.users u ON r.borrower_id = u.id
  WHERE r.status = 'overdue'
  ORDER BY r.expected_return_date ASC;
END;
$$;

-- Lab 5 Helper Functions
CREATE OR REPLACE FUNCTION lab5.get_available_equipment_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM lab5.inventory
  WHERE status = 'available';
  
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION lab5.get_user_borrowed_equipment(p_user_id UUID)
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
  FROM lab5.inventory
  WHERE current_borrower_id = p_user_id
  AND status = 'borrowed';
END;
$$;

CREATE OR REPLACE FUNCTION lab5.get_overdue_returns()
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
  FROM lab5.returns r
  JOIN lab5.inventory i ON r.equipment_id = i.id
  JOIN central.users u ON r.borrower_id = u.id
  WHERE r.status = 'overdue'
  ORDER BY r.expected_return_date ASC;
END;
$$;
