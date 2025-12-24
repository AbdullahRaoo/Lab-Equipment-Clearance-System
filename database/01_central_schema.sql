-- =====================================================
-- ECMS Central Schema - Database Setup (M1 Task)
-- =====================================================

-- Create central schema
CREATE SCHEMA IF NOT EXISTS central;

-- =====================================================
-- USERS TABLE (with Role-Based Access Control)
-- =====================================================
CREATE TABLE central.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lab_admin', 'student', 'faculty')),
  department VARCHAR(255),
  student_id VARCHAR(50),
  phone VARCHAR(20),
  assigned_labs TEXT[] DEFAULT '{}', -- Array of lab IDs user has access to
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_users_auth_id ON central.users(auth_id);
CREATE INDEX idx_users_role ON central.users(role);
CREATE INDEX idx_users_email ON central.users(email);

-- =====================================================
-- GLOBAL AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE central.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES central.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- e.g., 'login', 'create_issue', 'approve_clearance'
  entity_type VARCHAR(100), -- e.g., 'user', 'equipment', 'clearance_request'
  entity_id VARCHAR(255),
  schema_name VARCHAR(50), -- Which lab schema this action relates to
  details JSONB, -- Additional context about the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_audit_logs_user_id ON central.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON central.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON central.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_schema_name ON central.audit_logs(schema_name);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION central.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON central.users
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- SYSTEM SETTINGS TABLE (Optional but useful)
-- =====================================================
CREATE TABLE central.system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO central.system_settings (key, value, description) VALUES
  ('clearance_workflow', '{"require_all_labs": true, "auto_approve_threshold_days": 90}', 'Clearance workflow configuration'),
  ('lab_schemas', '["lab1", "lab2", "lab3", "lab4", "lab5"]', 'List of lab schema names'),
  ('notification_enabled', 'true', 'Enable/disable system notifications');
