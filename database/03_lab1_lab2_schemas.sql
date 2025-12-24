-- =====================================================
-- ECMS Lab 1 & Lab 2 Schemas - Database Setup (M2 Task)
-- =====================================================

-- =====================================================
-- CREATE LAB SCHEMAS
-- =====================================================
CREATE SCHEMA IF NOT EXISTS lab1;
CREATE SCHEMA IF NOT EXISTS lab2;

-- =====================================================
-- LAB 1 - INVENTORY TABLE
-- =====================================================
CREATE TABLE lab1.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(100) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Electronics', 'Mechanical', 'Chemical'
  
  -- JSONB for flexible equipment metadata
  metadata JSONB DEFAULT '{}', -- Contains: manufacturer, model, serial_number, specifications, etc.
  
  status VARCHAR(50) NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available', 'borrowed', 'maintenance', 'damaged', 'retired')),
  
  condition VARCHAR(50) DEFAULT 'good' 
    CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  
  location VARCHAR(255), -- Physical location within the lab
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  
  -- Borrowing information
  current_borrower_id UUID REFERENCES central.users(id) ON DELETE SET NULL,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 1 - ISSUES TABLE
-- =====================================================
CREATE TABLE lab1.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab1.inventory(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('damage', 'malfunction', 'lost', 'late_return', 'other')),
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  resolution TEXT,
  resolved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Financial impact
  damage_cost DECIMAL(10, 2) DEFAULT 0.00,
  fine_amount DECIMAL(10, 2) DEFAULT 0.00,
  paid BOOLEAN DEFAULT false,
  
  attachments JSONB DEFAULT '[]', -- Array of file URLs/paths
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 1 - RETURNS TABLE
-- =====================================================
CREATE TABLE lab1.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab1.inventory(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  borrowed_date TIMESTAMPTZ NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date TIMESTAMPTZ,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'returned', 'overdue', 'lost')),
  
  condition_on_return VARCHAR(50) 
    CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  
  return_notes TEXT,
  inspected_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  
  -- Late return handling
  is_late BOOLEAN DEFAULT false,
  days_overdue INTEGER DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 - INVENTORY TABLE
-- =====================================================
CREATE TABLE lab2.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(100) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  metadata JSONB DEFAULT '{}',
  
  status VARCHAR(50) NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available', 'borrowed', 'maintenance', 'damaged', 'retired')),
  
  condition VARCHAR(50) DEFAULT 'good' 
    CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  
  location VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  
  current_borrower_id UUID REFERENCES central.users(id) ON DELETE SET NULL,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 - ISSUES TABLE
-- =====================================================
CREATE TABLE lab2.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab2.inventory(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('damage', 'malfunction', 'lost', 'late_return', 'other')),
  severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  
  resolution TEXT,
  resolved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  damage_cost DECIMAL(10, 2) DEFAULT 0.00,
  fine_amount DECIMAL(10, 2) DEFAULT 0.00,
  paid BOOLEAN DEFAULT false,
  
  attachments JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LAB 2 - RETURNS TABLE
-- =====================================================
CREATE TABLE lab2.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab2.inventory(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  borrowed_date TIMESTAMPTZ NOT NULL,
  expected_return_date DATE NOT NULL,
  actual_return_date TIMESTAMPTZ,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'returned', 'overdue', 'lost')),
  
  condition_on_return VARCHAR(50) 
    CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  
  return_notes TEXT,
  inspected_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  
  is_late BOOLEAN DEFAULT false,
  days_overdue INTEGER DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR LAB 1
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab1_inventory_status ON lab1.inventory(status);
CREATE INDEX idx_lab1_inventory_category ON lab1.inventory(category);
CREATE INDEX idx_lab1_inventory_borrower ON lab1.inventory(current_borrower_id);
CREATE INDEX idx_lab1_inventory_code ON lab1.inventory(equipment_code);
CREATE INDEX idx_lab1_inventory_metadata ON lab1.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab1_issues_equipment ON lab1.issues(equipment_id);
CREATE INDEX idx_lab1_issues_reporter ON lab1.issues(reported_by);
CREATE INDEX idx_lab1_issues_status ON lab1.issues(status);
CREATE INDEX idx_lab1_issues_type ON lab1.issues(issue_type);
CREATE INDEX idx_lab1_issues_created ON lab1.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab1_returns_equipment ON lab1.returns(equipment_id);
CREATE INDEX idx_lab1_returns_borrower ON lab1.returns(borrower_id);
CREATE INDEX idx_lab1_returns_status ON lab1.returns(status);
CREATE INDEX idx_lab1_returns_expected_date ON lab1.returns(expected_return_date);
CREATE INDEX idx_lab1_returns_created ON lab1.returns(created_at DESC);

-- =====================================================
-- INDEXES FOR LAB 2
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab2_inventory_status ON lab2.inventory(status);
CREATE INDEX idx_lab2_inventory_category ON lab2.inventory(category);
CREATE INDEX idx_lab2_inventory_borrower ON lab2.inventory(current_borrower_id);
CREATE INDEX idx_lab2_inventory_code ON lab2.inventory(equipment_code);
CREATE INDEX idx_lab2_inventory_metadata ON lab2.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab2_issues_equipment ON lab2.issues(equipment_id);
CREATE INDEX idx_lab2_issues_reporter ON lab2.issues(reported_by);
CREATE INDEX idx_lab2_issues_status ON lab2.issues(status);
CREATE INDEX idx_lab2_issues_type ON lab2.issues(issue_type);
CREATE INDEX idx_lab2_issues_created ON lab2.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab2_returns_equipment ON lab2.returns(equipment_id);
CREATE INDEX idx_lab2_returns_borrower ON lab2.returns(borrower_id);
CREATE INDEX idx_lab2_returns_status ON lab2.returns(status);
CREATE INDEX idx_lab2_returns_expected_date ON lab2.returns(expected_return_date);
CREATE INDEX idx_lab2_returns_created ON lab2.returns(created_at DESC);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS FOR LAB 1
-- =====================================================

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

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS FOR LAB 2
-- =====================================================

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

-- =====================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Sample Lab 1 Equipment
INSERT INTO lab1.inventory (equipment_code, equipment_name, category, metadata, status, condition, location, purchase_date, purchase_price) VALUES
  ('LAB1-ELC-001', 'Digital Oscilloscope', 'Electronics', 
   '{"manufacturer": "Tektronix", "model": "TBS1052B", "serial_number": "C012345", "bandwidth": "50 MHz"}',
   'available', 'excellent', 'Workstation A1', '2023-01-15', 1500.00),
  
  ('LAB1-ELC-002', 'Function Generator', 'Electronics',
   '{"manufacturer": "Keysight", "model": "33210A", "serial_number": "MY54321", "frequency_range": "10 MHz"}',
   'available', 'good', 'Workstation A2', '2023-02-20', 800.00),
  
  ('LAB1-MCH-001', 'Digital Caliper', 'Mechanical',
   '{"manufacturer": "Mitutoyo", "model": "500-196-30", "resolution": "0.01 mm", "range": "0-150 mm"}',
   'available', 'good', 'Tool Cabinet 1', '2023-03-10', 120.00);

-- Sample Lab 2 Equipment
INSERT INTO lab2.inventory (equipment_code, equipment_name, category, metadata, status, condition, location, purchase_date, purchase_price) VALUES
  ('LAB2-ELC-001', 'Power Supply Unit', 'Electronics',
   '{"manufacturer": "BK Precision", "model": "1698", "voltage_range": "0-60V", "current_range": "0-5A"}',
   'available', 'excellent', 'Bench Station 1', '2023-01-20', 450.00),
  
  ('LAB2-CHM-001', 'pH Meter', 'Chemical',
   '{"manufacturer": "Hanna Instruments", "model": "HI2211", "accuracy": "±0.01 pH", "range": "0-14 pH"}',
   'available', 'good', 'Chemical Station A', '2023-04-05', 350.00),
  
  ('LAB2-ELC-002', 'Multimeter', 'Electronics',
   '{"manufacturer": "Fluke", "model": "87V", "type": "Digital", "display": "4.5 digit"}',
   'available', 'excellent', 'Tool Storage', '2023-05-12', 420.00);
