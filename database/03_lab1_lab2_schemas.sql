-- =====================================================
-- ECMS Lab 1 & Lab 2 Schemas - Database Setup (M2 Task)
-- Stage 1: Foundation & Database Setup
-- =====================================================

-- Create Lab 1 Schema
CREATE SCHEMA IF NOT EXISTS lab1;

-- Create Lab 2 Schema
CREATE SCHEMA IF NOT EXISTS lab2;

-- =====================================================
-- LAB 1 INVENTORY TABLE
-- =====================================================
CREATE TABLE lab1.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., "LAB1-EQ-001"
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., "Electronics", "Mechanical", "Chemical"
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance', 'retired')),
  
  -- JSONB for flexible equipment metadata
  metadata JSONB NOT NULL DEFAULT '{}', -- {brand, model, specs, purchase_date, warranty_info, etc.}
  
  -- Borrowing information
  borrowed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  borrowed_at TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  
  -- Tracking
  location VARCHAR(255), -- Physical location in lab
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 INVENTORY TABLE
-- =====================================================
CREATE TABLE lab2.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(50) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed', 'maintenance', 'retired')),
  
  metadata JSONB NOT NULL DEFAULT '{}',
  
  borrowed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  borrowed_at TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  
  location VARCHAR(255),
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 1 ISSUES TABLE
-- =====================================================
CREATE TABLE lab1.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES lab1.inventory(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  issue_type VARCHAR(100) NOT NULL, -- e.g., "damage", "malfunction", "missing_parts", "other"
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  -- Resolution tracking
  assigned_to UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  attachments JSONB DEFAULT '[]', -- Array of file URLs or metadata
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 ISSUES TABLE
-- =====================================================
CREATE TABLE lab2.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES lab2.inventory(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  issue_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  assigned_to UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 1 RETURNS TABLE
-- =====================================================
CREATE TABLE lab1.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab1.inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  borrowed_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  
  -- Return status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'late')),
  is_late BOOLEAN DEFAULT false,
  late_days INTEGER DEFAULT 0,
  
  -- Condition on return
  condition_on_return VARCHAR(50) CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  condition_notes TEXT,
  
  -- Verification
  verified_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Penalties or fees
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10, 2) DEFAULT 0.00,
  penalty_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 RETURNS TABLE
-- =====================================================
CREATE TABLE lab2.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab2.inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  borrowed_at TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'late')),
  is_late BOOLEAN DEFAULT false,
  late_days INTEGER DEFAULT 0,
  
  condition_on_return VARCHAR(50) CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  condition_notes TEXT,
  
  verified_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  penalty_applied BOOLEAN DEFAULT false,
  penalty_amount DECIMAL(10, 2) DEFAULT 0.00,
  penalty_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE (Lab 1)
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab1_inventory_status ON lab1.inventory(status);
CREATE INDEX idx_lab1_inventory_borrowed_by ON lab1.inventory(borrowed_by);
CREATE INDEX idx_lab1_inventory_category ON lab1.inventory(category);
CREATE INDEX idx_lab1_inventory_equipment_code ON lab1.inventory(equipment_code);
CREATE INDEX idx_lab1_inventory_metadata_gin ON lab1.inventory USING gin(metadata); -- For JSONB queries

-- Issues indexes
CREATE INDEX idx_lab1_issues_equipment_id ON lab1.issues(equipment_id);
CREATE INDEX idx_lab1_issues_reported_by ON lab1.issues(reported_by);
CREATE INDEX idx_lab1_issues_status ON lab1.issues(status);
CREATE INDEX idx_lab1_issues_severity ON lab1.issues(severity);
CREATE INDEX idx_lab1_issues_created_at ON lab1.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab1_returns_equipment_id ON lab1.returns(equipment_id);
CREATE INDEX idx_lab1_returns_user_id ON lab1.returns(user_id);
CREATE INDEX idx_lab1_returns_status ON lab1.returns(status);
CREATE INDEX idx_lab1_returns_is_late ON lab1.returns(is_late);
CREATE INDEX idx_lab1_returns_returned_at ON lab1.returns(returned_at DESC);

-- =====================================================
-- INDEXES FOR PERFORMANCE (Lab 2)
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab2_inventory_status ON lab2.inventory(status);
CREATE INDEX idx_lab2_inventory_borrowed_by ON lab2.inventory(borrowed_by);
CREATE INDEX idx_lab2_inventory_category ON lab2.inventory(category);
CREATE INDEX idx_lab2_inventory_equipment_code ON lab2.inventory(equipment_code);
CREATE INDEX idx_lab2_inventory_metadata_gin ON lab2.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab2_issues_equipment_id ON lab2.issues(equipment_id);
CREATE INDEX idx_lab2_issues_reported_by ON lab2.issues(reported_by);
CREATE INDEX idx_lab2_issues_status ON lab2.issues(status);
CREATE INDEX idx_lab2_issues_severity ON lab2.issues(severity);
CREATE INDEX idx_lab2_issues_created_at ON lab2.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab2_returns_equipment_id ON lab2.returns(equipment_id);
CREATE INDEX idx_lab2_returns_user_id ON lab2.returns(user_id);
CREATE INDEX idx_lab2_returns_status ON lab2.returns(status);
CREATE INDEX idx_lab2_returns_is_late ON lab2.returns(is_late);
CREATE INDEX idx_lab2_returns_returned_at ON lab2.returns(returned_at DESC);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS
-- =====================================================

-- Lab 1 triggers
CREATE TRIGGER update_lab1_inventory_updated_at
  BEFORE UPDATE ON lab1.inventory
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab1_issues_updated_at
  BEFORE UPDATE ON lab1.issues
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab1_returns_updated_at
  BEFORE UPDATE ON lab1.returns
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- Lab 2 triggers
CREATE TRIGGER update_lab2_inventory_updated_at
  BEFORE UPDATE ON lab2.inventory
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab2_issues_updated_at
  BEFORE UPDATE ON lab2.issues
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab2_returns_updated_at
  BEFORE UPDATE ON lab2.returns
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();
