-- =====================================================
-- ECMS Central Schema - Row Level Security (RLS) Policies
-- M1 Task - Security Layer
-- =====================================================

-- Enable RLS on users table
ALTER TABLE central.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs table
ALTER TABLE central.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on system_settings table
ALTER TABLE central.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Policy: Admins can view all users
CREATE POLICY "Admins can view all users"
  ON central.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON central.users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Policy: Lab admins can view users assigned to their labs
CREATE POLICY "Lab admins can view assigned users"
  ON central.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'lab_admin'
      AND u.assigned_labs && central.users.assigned_labs
    )
  );

-- Policy: Admins can insert new users
CREATE POLICY "Admins can insert users"
  ON central.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admins can update all users
CREATE POLICY "Admins can update all users"
  ON central.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Users can update their own non-critical fields
CREATE POLICY "Users can update own profile"
  ON central.users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (
    auth_id = auth.uid()
    AND role = (SELECT role FROM central.users WHERE auth_id = auth.uid())
    AND assigned_labs = (SELECT assigned_labs FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Admins can delete users (soft delete preferred)
CREATE POLICY "Admins can delete users"
  ON central.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON central.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON central.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Lab admins can view logs related to their labs
CREATE POLICY "Lab admins can view lab audit logs"
  ON central.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users u
      WHERE u.auth_id = auth.uid()
      AND u.role = 'lab_admin'
      AND central.audit_logs.schema_name = ANY(u.assigned_labs)
    )
  );

-- Policy: Authenticated users can insert audit logs (app-level logging)
CREATE POLICY "Authenticated users can insert audit logs"
  ON central.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Service role can do everything (for system operations)
CREATE POLICY "Service role full access audit logs"
  ON central.audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SYSTEM SETTINGS POLICIES
-- =====================================================

-- Policy: Everyone can read system settings
CREATE POLICY "Everyone can read system settings"
  ON central.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can modify system settings
CREATE POLICY "Admins can modify system settings"
  ON central.system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- HELPER FUNCTION: Get Current User Info
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_current_user()
RETURNS TABLE (
  user_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  assigned_labs TEXT[]
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, users.email, users.full_name, users.role, users.assigned_labs
  FROM central.users
  WHERE auth_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: Log Action
-- =====================================================
CREATE OR REPLACE FUNCTION central.log_action(
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id VARCHAR DEFAULT NULL,
  p_schema_name VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT id INTO v_user_id
  FROM central.users
  WHERE auth_id = auth.uid();

  -- Insert audit log
  INSERT INTO central.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    schema_name,
    details
  ) VALUES (
    v_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_schema_name,
    p_details
  );
END;
$$ LANGUAGE plpgsql;
