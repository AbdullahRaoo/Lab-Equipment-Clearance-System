-- =====================================================
-- ECMS Lab 3, Lab 4 & Lab 5 Schemas - Database Setup (M3 Task)
-- =====================================================

-- =====================================================
-- CREATE LAB SCHEMAS
-- =====================================================
CREATE SCHEMA IF NOT EXISTS lab3;
CREATE SCHEMA IF NOT EXISTS lab4;
CREATE SCHEMA IF NOT EXISTS lab5;

-- =====================================================
-- LAB 3 - INVENTORY TABLE
-- =====================================================
CREATE TABLE lab3.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(100) UNIQUE NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  -- JSONB for flexible equipment metadata
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
-- LAB 3 - ISSUES TABLE
-- =====================================================
CREATE TABLE lab3.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab3.inventory(id) ON DELETE CASCADE,
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
-- LAB 3 - RETURNS TABLE
-- =====================================================
CREATE TABLE lab3.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab3.inventory(id) ON DELETE CASCADE,
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
-- LAB 4 - INVENTORY TABLE
-- =====================================================
CREATE TABLE lab4.inventory (
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
-- LAB 4 - ISSUES TABLE
-- =====================================================
CREATE TABLE lab4.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab4.inventory(id) ON DELETE CASCADE,
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
-- LAB 4 - RETURNS TABLE
-- =====================================================
CREATE TABLE lab4.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab4.inventory(id) ON DELETE CASCADE,
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
-- LAB 5 - INVENTORY TABLE
-- =====================================================
CREATE TABLE lab5.inventory (
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
-- LAB 5 - ISSUES TABLE
-- =====================================================
CREATE TABLE lab5.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab5.inventory(id) ON DELETE CASCADE,
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
-- LAB 5 - RETURNS TABLE
-- =====================================================
CREATE TABLE lab5.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES lab5.inventory(id) ON DELETE CASCADE,
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
-- INDEXES FOR LAB 3
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab3_inventory_status ON lab3.inventory(status);
CREATE INDEX idx_lab3_inventory_category ON lab3.inventory(category);
CREATE INDEX idx_lab3_inventory_borrower ON lab3.inventory(current_borrower_id);
CREATE INDEX idx_lab3_inventory_code ON lab3.inventory(equipment_code);
CREATE INDEX idx_lab3_inventory_metadata ON lab3.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab3_issues_equipment ON lab3.issues(equipment_id);
CREATE INDEX idx_lab3_issues_reporter ON lab3.issues(reported_by);
CREATE INDEX idx_lab3_issues_status ON lab3.issues(status);
CREATE INDEX idx_lab3_issues_type ON lab3.issues(issue_type);
CREATE INDEX idx_lab3_issues_created ON lab3.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab3_returns_equipment ON lab3.returns(equipment_id);
CREATE INDEX idx_lab3_returns_borrower ON lab3.returns(borrower_id);
CREATE INDEX idx_lab3_returns_status ON lab3.returns(status);
CREATE INDEX idx_lab3_returns_expected_date ON lab3.returns(expected_return_date);
CREATE INDEX idx_lab3_returns_created ON lab3.returns(created_at DESC);

-- =====================================================
-- INDEXES FOR LAB 4
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab4_inventory_status ON lab4.inventory(status);
CREATE INDEX idx_lab4_inventory_category ON lab4.inventory(category);
CREATE INDEX idx_lab4_inventory_borrower ON lab4.inventory(current_borrower_id);
CREATE INDEX idx_lab4_inventory_code ON lab4.inventory(equipment_code);
CREATE INDEX idx_lab4_inventory_metadata ON lab4.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab4_issues_equipment ON lab4.issues(equipment_id);
CREATE INDEX idx_lab4_issues_reporter ON lab4.issues(reported_by);
CREATE INDEX idx_lab4_issues_status ON lab4.issues(status);
CREATE INDEX idx_lab4_issues_type ON lab4.issues(issue_type);
CREATE INDEX idx_lab4_issues_created ON lab4.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab4_returns_equipment ON lab4.returns(equipment_id);
CREATE INDEX idx_lab4_returns_borrower ON lab4.returns(borrower_id);
CREATE INDEX idx_lab4_returns_status ON lab4.returns(status);
CREATE INDEX idx_lab4_returns_expected_date ON lab4.returns(expected_return_date);
CREATE INDEX idx_lab4_returns_created ON lab4.returns(created_at DESC);

-- =====================================================
-- INDEXES FOR LAB 5
-- =====================================================

-- Inventory indexes
CREATE INDEX idx_lab5_inventory_status ON lab5.inventory(status);
CREATE INDEX idx_lab5_inventory_category ON lab5.inventory(category);
CREATE INDEX idx_lab5_inventory_borrower ON lab5.inventory(current_borrower_id);
CREATE INDEX idx_lab5_inventory_code ON lab5.inventory(equipment_code);
CREATE INDEX idx_lab5_inventory_metadata ON lab5.inventory USING gin(metadata);

-- Issues indexes
CREATE INDEX idx_lab5_issues_equipment ON lab5.issues(equipment_id);
CREATE INDEX idx_lab5_issues_reporter ON lab5.issues(reported_by);
CREATE INDEX idx_lab5_issues_status ON lab5.issues(status);
CREATE INDEX idx_lab5_issues_type ON lab5.issues(issue_type);
CREATE INDEX idx_lab5_issues_created ON lab5.issues(created_at DESC);

-- Returns indexes
CREATE INDEX idx_lab5_returns_equipment ON lab5.returns(equipment_id);
CREATE INDEX idx_lab5_returns_borrower ON lab5.returns(borrower_id);
CREATE INDEX idx_lab5_returns_status ON lab5.returns(status);
CREATE INDEX idx_lab5_returns_expected_date ON lab5.returns(expected_return_date);
CREATE INDEX idx_lab5_returns_created ON lab5.returns(created_at DESC);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS FOR LAB 3
-- =====================================================

CREATE TRIGGER update_lab3_inventory_updated_at
  BEFORE UPDATE ON lab3.inventory
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab3_issues_updated_at
  BEFORE UPDATE ON lab3.issues
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab3_returns_updated_at
  BEFORE UPDATE ON lab3.returns
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS FOR LAB 4
-- =====================================================

CREATE TRIGGER update_lab4_inventory_updated_at
  BEFORE UPDATE ON lab4.inventory
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab4_issues_updated_at
  BEFORE UPDATE ON lab4.issues
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab4_returns_updated_at
  BEFORE UPDATE ON lab4.returns
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- AUTO-UPDATE TIMESTAMP TRIGGERS FOR LAB 5
-- =====================================================

CREATE TRIGGER update_lab5_inventory_updated_at
  BEFORE UPDATE ON lab5.inventory
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab5_issues_updated_at
  BEFORE UPDATE ON lab5.issues
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

CREATE TRIGGER update_lab5_returns_updated_at
  BEFORE UPDATE ON lab5.returns
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- =====================================================

-- Sample Lab 3 Equipment
INSERT INTO lab3.inventory (equipment_code, equipment_name, category, metadata, status, condition, location, purchase_date, purchase_price) VALUES
  ('LAB3-BIO-001', 'Microscope', 'Biology',
   '{"manufacturer": "Olympus", "model": "CX23", "magnification": "40x-1000x", "type": "Compound"}',
   'available', 'excellent', 'Biology Station 1', '2023-02-10', 950.00),
  
  ('LAB3-BIO-002', 'Centrifuge', 'Biology',
   '{"manufacturer": "Eppendorf", "model": "5424", "max_rpm": "15000", "capacity": "24 tubes"}',
   'available', 'good', 'Biology Station 2', '2023-03-15', 1200.00),
  
  ('LAB3-CHM-001', 'Spectrophotometer', 'Chemistry',
   '{"manufacturer": "Thermo Fisher", "model": "Genesys 10S", "wavelength_range": "325-1100 nm"}',
   'available', 'excellent', 'Chemistry Bench A', '2023-04-20', 2500.00);

-- Sample Lab 4 Equipment
INSERT INTO lab4.inventory (equipment_code, equipment_name, category, metadata, status, condition, location, purchase_date, purchase_price) VALUES
  ('LAB4-PHY-001', 'Laser Meter', 'Physics',
   '{"manufacturer": "Coherent", "model": "FieldMax", "wavelength": "400-1100 nm", "power_range": "1nW-10W"}',
   'available', 'good', 'Optics Station', '2023-05-10', 1800.00),
  
  ('LAB4-ELC-001', 'Signal Generator', 'Electronics',
   '{"manufacturer": "Agilent", "model": "33220A", "frequency": "20 MHz", "waveforms": "sine, square, ramp"}',
   'available', 'excellent', 'Electronics Bench 1', '2023-06-15', 1100.00),
  
  ('LAB4-MCH-001', 'Vernier Caliper', 'Mechanical',
   '{"manufacturer": "Starrett", "model": "799A", "resolution": "0.02 mm", "range": "0-300 mm"}',
   'available', 'good', 'Tool Station', '2023-07-01', 180.00);

-- Sample Lab 5 Equipment
INSERT INTO lab5.inventory (equipment_code, equipment_name, category, metadata, status, condition, location, purchase_date, purchase_price) VALUES
  ('LAB5-COM-001', 'Logic Analyzer', 'Computer Engineering',
   '{"manufacturer": "Saleae", "model": "Logic Pro 16", "channels": "16", "sample_rate": "500 MS/s"}',
   'available', 'excellent', 'Digital Lab Station 1', '2023-08-05', 1500.00),
  
  ('LAB5-COM-002', 'Raspberry Pi Kit', 'Computer Engineering',
   '{"model": "Raspberry Pi 4", "ram": "8GB", "accessories": "camera, sensors, GPIO kit"}',
   'available', 'excellent', 'Embedded Systems Area', '2023-09-10', 250.00),
  
  ('LAB5-NET-001', 'Network Analyzer', 'Networking',
   '{"manufacturer": "Fluke Networks", "model": "CableIQ", "tests": "length, wiremap, performance"}',
   'available', 'good', 'Network Lab', '2023-10-12', 800.00);
