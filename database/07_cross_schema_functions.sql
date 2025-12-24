-- =====================================================
-- ECMS Cross-Schema Architecture & Clearance System (M4 Task)
-- =====================================================

-- =====================================================
-- CLEARANCE REQUEST TABLE (Central Schema)
-- =====================================================
CREATE TABLE central.clearance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  
  -- Clearance status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  
  -- Individual lab clearance status
  lab1_status VARCHAR(50) DEFAULT 'pending' CHECK (lab1_status IN ('pending', 'cleared', 'issues_found')),
  lab2_status VARCHAR(50) DEFAULT 'pending' CHECK (lab2_status IN ('pending', 'cleared', 'issues_found')),
  lab3_status VARCHAR(50) DEFAULT 'pending' CHECK (lab3_status IN ('pending', 'cleared', 'issues_found')),
  lab4_status VARCHAR(50) DEFAULT 'pending' CHECK (lab4_status IN ('pending', 'cleared', 'issues_found')),
  lab5_status VARCHAR(50) DEFAULT 'pending' CHECK (lab5_status IN ('pending', 'cleared', 'issues_found')),
  
  -- Lab-specific notes
  lab1_notes TEXT,
  lab2_notes TEXT,
  lab3_notes TEXT,
  lab4_notes TEXT,
  lab5_notes TEXT,
  
  -- Reviewers
  lab1_reviewed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  lab2_reviewed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  lab3_reviewed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  lab4_reviewed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  lab5_reviewed_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  
  lab1_reviewed_at TIMESTAMPTZ,
  lab2_reviewed_at TIMESTAMPTZ,
  lab3_reviewed_at TIMESTAMPTZ,
  lab4_reviewed_at TIMESTAMPTZ,
  lab5_reviewed_at TIMESTAMPTZ,
  
  -- Request details
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('graduation', 'transfer', 'withdrawal', 'other')),
  reason TEXT,
  
  -- Final approval
  final_approved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  final_approved_at TIMESTAMPTZ,
  
  -- Certificate
  certificate_url TEXT,
  certificate_generated_at TIMESTAMPTZ,
  
  -- Validity
  valid_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for clearance requests
CREATE INDEX idx_clearance_requests_user_id ON central.clearance_requests(user_id);
CREATE INDEX idx_clearance_requests_status ON central.clearance_requests(status);
CREATE INDEX idx_clearance_requests_created ON central.clearance_requests(created_at DESC);

-- Auto-update timestamp trigger
CREATE TRIGGER update_clearance_requests_updated_at
  BEFORE UPDATE ON central.clearance_requests
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- CROSS-LAB STATISTICS TABLE (For Performance)
-- =====================================================
CREATE TABLE central.lab_statistics (
  id BIGSERIAL PRIMARY KEY,
  lab_schema VARCHAR(10) NOT NULL CHECK (lab_schema IN ('lab1', 'lab2', 'lab3', 'lab4', 'lab5')),
  
  total_equipment INTEGER DEFAULT 0,
  available_equipment INTEGER DEFAULT 0,
  borrowed_equipment INTEGER DEFAULT 0,
  maintenance_equipment INTEGER DEFAULT 0,
  damaged_equipment INTEGER DEFAULT 0,
  
  total_issues INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  
  total_returns INTEGER DEFAULT 0,
  pending_returns INTEGER DEFAULT 0,
  overdue_returns INTEGER DEFAULT 0,
  
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(lab_schema)
);

-- Initialize statistics for all labs
INSERT INTO central.lab_statistics (lab_schema) VALUES
  ('lab1'), ('lab2'), ('lab3'), ('lab4'), ('lab5');

-- =====================================================
-- FUNCTION: Get All User's Borrowed Equipment Across All Labs
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_all_user_borrowed_equipment(p_user_id UUID)
RETURNS TABLE (
  lab_schema VARCHAR,
  equipment_id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  is_overdue BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Lab 1
  SELECT 
    'lab1'::VARCHAR,
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.borrowed_at,
    i.expected_return_date,
    (i.expected_return_date < CURRENT_DATE) as is_overdue
  FROM lab1.inventory i
  WHERE i.current_borrower_id = p_user_id
  AND i.status = 'borrowed'
  
  UNION ALL
  
  -- Lab 2
  SELECT 
    'lab2'::VARCHAR,
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.borrowed_at,
    i.expected_return_date,
    (i.expected_return_date < CURRENT_DATE) as is_overdue
  FROM lab2.inventory i
  WHERE i.current_borrower_id = p_user_id
  AND i.status = 'borrowed'
  
  UNION ALL
  
  -- Lab 3
  SELECT 
    'lab3'::VARCHAR,
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.borrowed_at,
    i.expected_return_date,
    (i.expected_return_date < CURRENT_DATE) as is_overdue
  FROM lab3.inventory i
  WHERE i.current_borrower_id = p_user_id
  AND i.status = 'borrowed'
  
  UNION ALL
  
  -- Lab 4
  SELECT 
    'lab4'::VARCHAR,
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.borrowed_at,
    i.expected_return_date,
    (i.expected_return_date < CURRENT_DATE) as is_overdue
  FROM lab4.inventory i
  WHERE i.current_borrower_id = p_user_id
  AND i.status = 'borrowed'
  
  UNION ALL
  
  -- Lab 5
  SELECT 
    'lab5'::VARCHAR,
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.borrowed_at,
    i.expected_return_date,
    (i.expected_return_date < CURRENT_DATE) as is_overdue
  FROM lab5.inventory i
  WHERE i.current_borrower_id = p_user_id
  AND i.status = 'borrowed'
  
  ORDER BY expected_return_date ASC;
END;
$$;

-- =====================================================
-- FUNCTION: Get All User's Unpaid Issues Across All Labs
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_all_user_unpaid_issues(p_user_id UUID)
RETURNS TABLE (
  lab_schema VARCHAR,
  issue_id UUID,
  equipment_name VARCHAR,
  issue_type VARCHAR,
  damage_cost DECIMAL,
  fine_amount DECIMAL,
  total_amount DECIMAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Lab 1
  SELECT 
    'lab1'::VARCHAR,
    iss.id,
    inv.equipment_name,
    iss.issue_type,
    iss.damage_cost,
    iss.fine_amount,
    (iss.damage_cost + iss.fine_amount) as total_amount,
    iss.created_at
  FROM lab1.issues iss
  JOIN lab1.inventory inv ON iss.equipment_id = inv.id
  WHERE iss.reported_by = p_user_id
  AND iss.paid = false
  AND (iss.damage_cost > 0 OR iss.fine_amount > 0)
  
  UNION ALL
  
  -- Lab 2
  SELECT 
    'lab2'::VARCHAR,
    iss.id,
    inv.equipment_name,
    iss.issue_type,
    iss.damage_cost,
    iss.fine_amount,
    (iss.damage_cost + iss.fine_amount) as total_amount,
    iss.created_at
  FROM lab2.issues iss
  JOIN lab2.inventory inv ON iss.equipment_id = inv.id
  WHERE iss.reported_by = p_user_id
  AND iss.paid = false
  AND (iss.damage_cost > 0 OR iss.fine_amount > 0)
  
  UNION ALL
  
  -- Lab 3
  SELECT 
    'lab3'::VARCHAR,
    iss.id,
    inv.equipment_name,
    iss.issue_type,
    iss.damage_cost,
    iss.fine_amount,
    (iss.damage_cost + iss.fine_amount) as total_amount,
    iss.created_at
  FROM lab3.issues iss
  JOIN lab3.inventory inv ON iss.equipment_id = inv.id
  WHERE iss.reported_by = p_user_id
  AND iss.paid = false
  AND (iss.damage_cost > 0 OR iss.fine_amount > 0)
  
  UNION ALL
  
  -- Lab 4
  SELECT 
    'lab4'::VARCHAR,
    iss.id,
    inv.equipment_name,
    iss.issue_type,
    iss.damage_cost,
    iss.fine_amount,
    (iss.damage_cost + iss.fine_amount) as total_amount,
    iss.created_at
  FROM lab4.issues iss
  JOIN lab4.inventory inv ON iss.equipment_id = inv.id
  WHERE iss.reported_by = p_user_id
  AND iss.paid = false
  AND (iss.damage_cost > 0 OR iss.fine_amount > 0)
  
  UNION ALL
  
  -- Lab 5
  SELECT 
    'lab5'::VARCHAR,
    iss.id,
    inv.equipment_name,
    iss.issue_type,
    iss.damage_cost,
    iss.fine_amount,
    (iss.damage_cost + iss.fine_amount) as total_amount,
    iss.created_at
  FROM lab5.issues iss
  JOIN lab5.inventory inv ON iss.equipment_id = inv.id
  WHERE iss.reported_by = p_user_id
  AND iss.paid = false
  AND (iss.damage_cost > 0 OR iss.fine_amount > 0)
  
  ORDER BY created_at DESC;
END;
$$;

-- =====================================================
-- FUNCTION: Check User Clearance Eligibility
-- =====================================================
CREATE OR REPLACE FUNCTION central.check_user_clearance_eligibility(p_user_id UUID)
RETURNS TABLE (
  is_eligible BOOLEAN,
  lab_schema VARCHAR,
  has_borrowed_equipment BOOLEAN,
  has_unpaid_fines BOOLEAN,
  has_overdue_returns BOOLEAN,
  total_issues_count INTEGER,
  total_unpaid_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH lab_checks AS (
    -- Check Lab 1
    SELECT 
      'lab1'::VARCHAR as lab,
      EXISTS(SELECT 1 FROM lab1.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed') as has_borrowed,
      EXISTS(SELECT 1 FROM lab1.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)) as has_unpaid,
      EXISTS(SELECT 1 FROM lab1.returns WHERE borrower_id = p_user_id AND status = 'overdue') as has_overdue,
      (SELECT COUNT(*)::INTEGER FROM lab1.issues WHERE reported_by = p_user_id AND status != 'closed') as issues_count,
      (SELECT COALESCE(SUM(damage_cost + fine_amount), 0) FROM lab1.issues WHERE reported_by = p_user_id AND paid = false) as unpaid_amount
    
    UNION ALL
    
    -- Check Lab 2
    SELECT 
      'lab2'::VARCHAR,
      EXISTS(SELECT 1 FROM lab2.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
      EXISTS(SELECT 1 FROM lab2.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
      EXISTS(SELECT 1 FROM lab2.returns WHERE borrower_id = p_user_id AND status = 'overdue'),
      (SELECT COUNT(*)::INTEGER FROM lab2.issues WHERE reported_by = p_user_id AND status != 'closed'),
      (SELECT COALESCE(SUM(damage_cost + fine_amount), 0) FROM lab2.issues WHERE reported_by = p_user_id AND paid = false)
    
    UNION ALL
    
    -- Check Lab 3
    SELECT 
      'lab3'::VARCHAR,
      EXISTS(SELECT 1 FROM lab3.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
      EXISTS(SELECT 1 FROM lab3.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
      EXISTS(SELECT 1 FROM lab3.returns WHERE borrower_id = p_user_id AND status = 'overdue'),
      (SELECT COUNT(*)::INTEGER FROM lab3.issues WHERE reported_by = p_user_id AND status != 'closed'),
      (SELECT COALESCE(SUM(damage_cost + fine_amount), 0) FROM lab3.issues WHERE reported_by = p_user_id AND paid = false)
    
    UNION ALL
    
    -- Check Lab 4
    SELECT 
      'lab4'::VARCHAR,
      EXISTS(SELECT 1 FROM lab4.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
      EXISTS(SELECT 1 FROM lab4.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
      EXISTS(SELECT 1 FROM lab4.returns WHERE borrower_id = p_user_id AND status = 'overdue'),
      (SELECT COUNT(*)::INTEGER FROM lab4.issues WHERE reported_by = p_user_id AND status != 'closed'),
      (SELECT COALESCE(SUM(damage_cost + fine_amount), 0) FROM lab4.issues WHERE reported_by = p_user_id AND paid = false)
    
    UNION ALL
    
    -- Check Lab 5
    SELECT 
      'lab5'::VARCHAR,
      EXISTS(SELECT 1 FROM lab5.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
      EXISTS(SELECT 1 FROM lab5.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
      EXISTS(SELECT 1 FROM lab5.returns WHERE borrower_id = p_user_id AND status = 'overdue'),
      (SELECT COUNT(*)::INTEGER FROM lab5.issues WHERE reported_by = p_user_id AND status != 'closed'),
      (SELECT COALESCE(SUM(damage_cost + fine_amount), 0) FROM lab5.issues WHERE reported_by = p_user_id AND paid = false)
  )
  SELECT 
    NOT (has_borrowed OR has_unpaid OR has_overdue) as is_eligible,
    lab,
    has_borrowed,
    has_unpaid,
    has_overdue,
    issues_count,
    unpaid_amount
  FROM lab_checks;
END;
$$;

-- =====================================================
-- FUNCTION: Get Cross-Lab Statistics Summary
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_cross_lab_statistics()
RETURNS TABLE (
  lab_schema VARCHAR,
  total_equipment BIGINT,
  available_equipment BIGINT,
  borrowed_equipment BIGINT,
  total_active_issues BIGINT,
  total_pending_returns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'lab1'::VARCHAR,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'available')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'borrowed')::BIGINT,
    (SELECT COUNT(*)::BIGINT FROM lab1.issues WHERE status IN ('open', 'in_progress')),
    (SELECT COUNT(*)::BIGINT FROM lab1.returns WHERE status = 'pending')
  FROM lab1.inventory
  
  UNION ALL
  
  SELECT 
    'lab2'::VARCHAR,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'available')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'borrowed')::BIGINT,
    (SELECT COUNT(*)::BIGINT FROM lab2.issues WHERE status IN ('open', 'in_progress')),
    (SELECT COUNT(*)::BIGINT FROM lab2.returns WHERE status = 'pending')
  FROM lab2.inventory
  
  UNION ALL
  
  SELECT 
    'lab3'::VARCHAR,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'available')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'borrowed')::BIGINT,
    (SELECT COUNT(*)::BIGINT FROM lab3.issues WHERE status IN ('open', 'in_progress')),
    (SELECT COUNT(*)::BIGINT FROM lab3.returns WHERE status = 'pending')
  FROM lab3.inventory
  
  UNION ALL
  
  SELECT 
    'lab4'::VARCHAR,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'available')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'borrowed')::BIGINT,
    (SELECT COUNT(*)::BIGINT FROM lab4.issues WHERE status IN ('open', 'in_progress')),
    (SELECT COUNT(*)::BIGINT FROM lab4.returns WHERE status = 'pending')
  FROM lab4.inventory
  
  UNION ALL
  
  SELECT 
    'lab5'::VARCHAR,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'available')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'borrowed')::BIGINT,
    (SELECT COUNT(*)::BIGINT FROM lab5.issues WHERE status IN ('open', 'in_progress')),
    (SELECT COUNT(*)::BIGINT FROM lab5.returns WHERE status = 'pending')
  FROM lab5.inventory;
END;
$$;

-- =====================================================
-- FUNCTION: Search Equipment Across All Labs
-- =====================================================
CREATE OR REPLACE FUNCTION central.search_equipment_all_labs(
  p_search_term VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  lab_schema VARCHAR,
  equipment_id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  status VARCHAR,
  condition VARCHAR,
  location VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'lab1'::VARCHAR, id, equipment_code, equipment_name, i.category, i.status, i.condition, i.location
  FROM lab1.inventory i
  WHERE (p_search_term IS NULL OR 
         equipment_name ILIKE '%' || p_search_term || '%' OR 
         equipment_code ILIKE '%' || p_search_term || '%')
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_status IS NULL OR i.status = p_status)
  
  UNION ALL
  
  SELECT 'lab2'::VARCHAR, id, equipment_code, equipment_name, i.category, i.status, i.condition, i.location
  FROM lab2.inventory i
  WHERE (p_search_term IS NULL OR 
         equipment_name ILIKE '%' || p_search_term || '%' OR 
         equipment_code ILIKE '%' || p_search_term || '%')
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_status IS NULL OR i.status = p_status)
  
  UNION ALL
  
  SELECT 'lab3'::VARCHAR, id, equipment_code, equipment_name, i.category, i.status, i.condition, i.location
  FROM lab3.inventory i
  WHERE (p_search_term IS NULL OR 
         equipment_name ILIKE '%' || p_search_term || '%' OR 
         equipment_code ILIKE '%' || p_search_term || '%')
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_status IS NULL OR i.status = p_status)
  
  UNION ALL
  
  SELECT 'lab4'::VARCHAR, id, equipment_code, equipment_name, i.category, i.status, i.condition, i.location
  FROM lab4.inventory i
  WHERE (p_search_term IS NULL OR 
         equipment_name ILIKE '%' || p_search_term || '%' OR 
         equipment_code ILIKE '%' || p_search_term || '%')
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_status IS NULL OR i.status = p_status)
  
  UNION ALL
  
  SELECT 'lab5'::VARCHAR, id, equipment_code, equipment_name, i.category, i.status, i.condition, i.location
  FROM lab5.inventory i
  WHERE (p_search_term IS NULL OR 
         equipment_name ILIKE '%' || p_search_term || '%' OR 
         equipment_code ILIKE '%' || p_search_term || '%')
  AND (p_category IS NULL OR i.category = p_category)
  AND (p_status IS NULL OR i.status = p_status)
  
  ORDER BY equipment_name;
END;
$$;
