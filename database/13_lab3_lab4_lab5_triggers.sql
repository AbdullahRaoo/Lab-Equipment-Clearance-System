-- =====================================================
-- Stage 2 M3: Labs 3-5 Triggers and Business Logic
-- =====================================================
-- This script implements automated workflows for lab3, lab4, and lab5:
-- 1. Inventory status update triggers
-- 2. Return processing with late fees
-- 3. Issue management workflows
-- 4. Clearance request handling
-- 5. Notification system for status changes

-- =====================================================
-- NOTIFICATION TABLES FOR LABS 3-5
-- =====================================================

-- Lab3 Notifications Table
CREATE TABLE IF NOT EXISTS lab3.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('status_change', 'clearance_update', 'issue_created', 'return_reminder', 'overdue_alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab4 Notifications Table
CREATE TABLE IF NOT EXISTS lab4.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('status_change', 'clearance_update', 'issue_created', 'return_reminder', 'overdue_alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab5 Notifications Table
CREATE TABLE IF NOT EXISTS lab5.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('status_change', 'clearance_update', 'issue_created', 'return_reminder', 'overdue_alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_lab3_notifications_user ON lab3.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lab3_notifications_read ON lab3.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_lab4_notifications_user ON lab4.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lab4_notifications_read ON lab4.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_lab5_notifications_user ON lab5.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lab5_notifications_read ON lab5.notifications(is_read);

-- =====================================================
-- LAB3: INVENTORY STATUS TRIGGERS
-- =====================================================

-- Function: Update inventory status when borrowed
CREATE OR REPLACE FUNCTION lab3.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lab3.inventory
  SET 
    status = 'borrowed',
    current_borrower_id = NEW.borrower_id,
    borrowed_at = NEW.borrowed_date,
    expected_return_date = NEW.expected_return_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On return record creation (status = 'pending')
DROP TRIGGER IF EXISTS trigger_lab3_inventory_borrow ON lab3.returns;
CREATE TRIGGER trigger_lab3_inventory_borrow
  AFTER INSERT ON lab3.returns
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION lab3.update_inventory_on_borrow();

-- Function: Update inventory status when returned
CREATE OR REPLACE FUNCTION lab3.update_inventory_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status = 'pending' THEN
    UPDATE lab3.inventory
    SET 
      status = CASE 
        WHEN NEW.condition_on_return IN ('excellent', 'good') THEN 'available'
        WHEN NEW.condition_on_return = 'fair' THEN 'maintenance'
        ELSE 'damaged'
      END,
      condition = NEW.condition_on_return,
      current_borrower_id = NULL,
      borrowed_at = NULL,
      expected_return_date = NULL,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On return status update to 'returned'
DROP TRIGGER IF EXISTS trigger_lab3_inventory_return ON lab3.returns;
CREATE TRIGGER trigger_lab3_inventory_return
  AFTER UPDATE ON lab3.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab3.update_inventory_on_return();

-- =====================================================
-- LAB3: RETURN PROCESSING WITH LATE FEES
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.process_late_return_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL(10,2);
  v_late_fee_per_day DECIMAL(10,2) := 5.00;
BEGIN
  IF NEW.status = 'returned' AND NEW.actual_return_date > NEW.expected_return_date::TIMESTAMPTZ THEN
    v_days_overdue := EXTRACT(DAY FROM (NEW.actual_return_date - NEW.expected_return_date::TIMESTAMPTZ))::INTEGER;
    v_late_fee := v_days_overdue * v_late_fee_per_day;
    
    -- Update the returns table
    UPDATE lab3.returns
    SET 
      late_fee = v_late_fee,
      is_late = true,
      days_overdue = v_days_overdue
    WHERE id = NEW.id;
    
    -- Create an issue record for late return
    INSERT INTO lab3.issues (
      equipment_id,
      reported_by,
      issue_type,
      severity,
      title,
      description,
      status,
      fine_amount,
      created_at
    ) VALUES (
      NEW.equipment_id,
      NEW.borrower_id,
      'late_return',
      CASE 
        WHEN v_days_overdue > 7 THEN 'high'
        WHEN v_days_overdue > 3 THEN 'medium'
        ELSE 'low'
      END,
      'Late Return Fee',
      format('Equipment returned %s days late. Late fee: $%s', v_days_overdue, v_late_fee),
      'open',
      v_late_fee,
      NOW()
    );
    
    -- Create notification for late return
    INSERT INTO lab3.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
    VALUES (
      NEW.borrower_id,
      'overdue_alert',
      'Late Return Fee Applied',
      format('A late fee of $%s has been applied for equipment returned %s days late.', v_late_fee, v_days_overdue),
      'return',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab3_late_return_fee ON lab3.returns;
CREATE TRIGGER trigger_lab3_late_return_fee
  AFTER UPDATE ON lab3.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab3.process_late_return_fee();

-- =====================================================
-- LAB3: ISSUE MANAGEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.update_equipment_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical') THEN
    UPDATE lab3.inventory
    SET 
      status = CASE 
        WHEN NEW.issue_type = 'damage' THEN 'damaged'
        ELSE 'maintenance'
      END,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab3_equipment_issue ON lab3.issues;
CREATE TRIGGER trigger_lab3_equipment_issue
  AFTER INSERT ON lab3.issues
  FOR EACH ROW
  WHEN (NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION lab3.update_equipment_on_issue();

-- Auto-resolve old low-severity issues
CREATE OR REPLACE FUNCTION lab3.auto_resolve_old_issues()
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  UPDATE lab3.issues
  SET 
    status = 'resolved',
    resolution = 'Auto-resolved: Issue expired after 30 days',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'open'
    AND severity = 'low'
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LAB4: INVENTORY STATUS TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION lab4.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lab4.inventory
  SET 
    status = 'borrowed',
    current_borrower_id = NEW.borrower_id,
    borrowed_at = NEW.borrowed_date,
    expected_return_date = NEW.expected_return_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab4_inventory_borrow ON lab4.returns;
CREATE TRIGGER trigger_lab4_inventory_borrow
  AFTER INSERT ON lab4.returns
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION lab4.update_inventory_on_borrow();

CREATE OR REPLACE FUNCTION lab4.update_inventory_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status = 'pending' THEN
    UPDATE lab4.inventory
    SET 
      status = CASE 
        WHEN NEW.condition_on_return IN ('excellent', 'good') THEN 'available'
        WHEN NEW.condition_on_return = 'fair' THEN 'maintenance'
        ELSE 'damaged'
      END,
      condition = NEW.condition_on_return,
      current_borrower_id = NULL,
      borrowed_at = NULL,
      expected_return_date = NULL,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab4_inventory_return ON lab4.returns;
CREATE TRIGGER trigger_lab4_inventory_return
  AFTER UPDATE ON lab4.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab4.update_inventory_on_return();

-- =====================================================
-- LAB4: RETURN PROCESSING WITH LATE FEES
-- =====================================================

CREATE OR REPLACE FUNCTION lab4.process_late_return_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL(10,2);
  v_late_fee_per_day DECIMAL(10,2) := 5.00;
BEGIN
  IF NEW.status = 'returned' AND NEW.actual_return_date > NEW.expected_return_date::TIMESTAMPTZ THEN
    v_days_overdue := EXTRACT(DAY FROM (NEW.actual_return_date - NEW.expected_return_date::TIMESTAMPTZ))::INTEGER;
    v_late_fee := v_days_overdue * v_late_fee_per_day;
    
    UPDATE lab4.returns
    SET 
      late_fee = v_late_fee,
      is_late = true,
      days_overdue = v_days_overdue
    WHERE id = NEW.id;
    
    INSERT INTO lab4.issues (
      equipment_id,
      reported_by,
      issue_type,
      severity,
      title,
      description,
      status,
      fine_amount,
      created_at
    ) VALUES (
      NEW.equipment_id,
      NEW.borrower_id,
      'late_return',
      CASE 
        WHEN v_days_overdue > 7 THEN 'high'
        WHEN v_days_overdue > 3 THEN 'medium'
        ELSE 'low'
      END,
      'Late Return Fee',
      format('Equipment returned %s days late. Late fee: $%s', v_days_overdue, v_late_fee),
      'open',
      v_late_fee,
      NOW()
    );
    
    INSERT INTO lab4.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
    VALUES (
      NEW.borrower_id,
      'overdue_alert',
      'Late Return Fee Applied',
      format('A late fee of $%s has been applied for equipment returned %s days late.', v_late_fee, v_days_overdue),
      'return',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab4_late_return_fee ON lab4.returns;
CREATE TRIGGER trigger_lab4_late_return_fee
  AFTER UPDATE ON lab4.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab4.process_late_return_fee();

-- =====================================================
-- LAB4: ISSUE MANAGEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION lab4.update_equipment_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical') THEN
    UPDATE lab4.inventory
    SET 
      status = CASE 
        WHEN NEW.issue_type = 'damage' THEN 'damaged'
        ELSE 'maintenance'
      END,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab4_equipment_issue ON lab4.issues;
CREATE TRIGGER trigger_lab4_equipment_issue
  AFTER INSERT ON lab4.issues
  FOR EACH ROW
  WHEN (NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION lab4.update_equipment_on_issue();

CREATE OR REPLACE FUNCTION lab4.auto_resolve_old_issues()
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  UPDATE lab4.issues
  SET 
    status = 'resolved',
    resolution = 'Auto-resolved: Issue expired after 30 days',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'open'
    AND severity = 'low'
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- LAB5: INVENTORY STATUS TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION lab5.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lab5.inventory
  SET 
    status = 'borrowed',
    current_borrower_id = NEW.borrower_id,
    borrowed_at = NEW.borrowed_date,
    expected_return_date = NEW.expected_return_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab5_inventory_borrow ON lab5.returns;
CREATE TRIGGER trigger_lab5_inventory_borrow
  AFTER INSERT ON lab5.returns
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION lab5.update_inventory_on_borrow();

CREATE OR REPLACE FUNCTION lab5.update_inventory_on_return()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'returned' AND OLD.status = 'pending' THEN
    UPDATE lab5.inventory
    SET 
      status = CASE 
        WHEN NEW.condition_on_return IN ('excellent', 'good') THEN 'available'
        WHEN NEW.condition_on_return = 'fair' THEN 'maintenance'
        ELSE 'damaged'
      END,
      condition = NEW.condition_on_return,
      current_borrower_id = NULL,
      borrowed_at = NULL,
      expected_return_date = NULL,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab5_inventory_return ON lab5.returns;
CREATE TRIGGER trigger_lab5_inventory_return
  AFTER UPDATE ON lab5.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab5.update_inventory_on_return();

-- =====================================================
-- LAB5: RETURN PROCESSING WITH LATE FEES
-- =====================================================

CREATE OR REPLACE FUNCTION lab5.process_late_return_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL(10,2);
  v_late_fee_per_day DECIMAL(10,2) := 5.00;
BEGIN
  IF NEW.status = 'returned' AND NEW.actual_return_date > NEW.expected_return_date::TIMESTAMPTZ THEN
    v_days_overdue := EXTRACT(DAY FROM (NEW.actual_return_date - NEW.expected_return_date::TIMESTAMPTZ))::INTEGER;
    v_late_fee := v_days_overdue * v_late_fee_per_day;
    
    UPDATE lab5.returns
    SET 
      late_fee = v_late_fee,
      is_late = true,
      days_overdue = v_days_overdue
    WHERE id = NEW.id;
    
    INSERT INTO lab5.issues (
      equipment_id,
      reported_by,
      issue_type,
      severity,
      title,
      description,
      status,
      fine_amount,
      created_at
    ) VALUES (
      NEW.equipment_id,
      NEW.borrower_id,
      'late_return',
      CASE 
        WHEN v_days_overdue > 7 THEN 'high'
        WHEN v_days_overdue > 3 THEN 'medium'
        ELSE 'low'
      END,
      'Late Return Fee',
      format('Equipment returned %s days late. Late fee: $%s', v_days_overdue, v_late_fee),
      'open',
      v_late_fee,
      NOW()
    );
    
    INSERT INTO lab5.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
    VALUES (
      NEW.borrower_id,
      'overdue_alert',
      'Late Return Fee Applied',
      format('A late fee of $%s has been applied for equipment returned %s days late.', v_late_fee, v_days_overdue),
      'return',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab5_late_return_fee ON lab5.returns;
CREATE TRIGGER trigger_lab5_late_return_fee
  AFTER UPDATE ON lab5.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab5.process_late_return_fee();

-- =====================================================
-- LAB5: ISSUE MANAGEMENT
-- =====================================================

CREATE OR REPLACE FUNCTION lab5.update_equipment_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical') THEN
    UPDATE lab5.inventory
    SET 
      status = CASE 
        WHEN NEW.issue_type = 'damage' THEN 'damaged'
        ELSE 'maintenance'
      END,
      updated_at = NOW()
    WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab5_equipment_issue ON lab5.issues;
CREATE TRIGGER trigger_lab5_equipment_issue
  AFTER INSERT ON lab5.issues
  FOR EACH ROW
  WHEN (NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION lab5.update_equipment_on_issue();

CREATE OR REPLACE FUNCTION lab5.auto_resolve_old_issues()
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  UPDATE lab5.issues
  SET 
    status = 'resolved',
    resolution = 'Auto-resolved: Issue expired after 30 days',
    resolved_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'open'
    AND severity = 'low'
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EQUIPMENT AVAILABILITY FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.get_equipment_availability()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  status VARCHAR,
  is_available BOOLEAN,
  current_borrower_id UUID,
  expected_return_date DATE,
  active_issues_count BIGINT
) AS $$
BEGIN   
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.status,
    CASE WHEN i.status = 'available' THEN true ELSE false END,
    i.current_borrower_id,
    i.expected_return_date,
    (SELECT COUNT(*) FROM lab3.issues WHERE equipment_id = i.id AND status = 'open')
  FROM lab3.inventory i
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab4.get_equipment_availability()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  status VARCHAR,
  is_available BOOLEAN,
  current_borrower_id UUID,
  expected_return_date DATE,
  active_issues_count BIGINT
) AS $$
BEGIN   
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.status,
    CASE WHEN i.status = 'available' THEN true ELSE false END,
    i.current_borrower_id,
    i.expected_return_date,
    (SELECT COUNT(*) FROM lab4.issues WHERE equipment_id = i.id AND status = 'open')
  FROM lab4.inventory i
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab5.get_equipment_availability()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  status VARCHAR,
  is_available BOOLEAN,
  current_borrower_id UUID,
  expected_return_date DATE,
  active_issues_count BIGINT
) AS $$
BEGIN   
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.status,
    CASE WHEN i.status = 'available' THEN true ELSE false END,
    i.current_borrower_id,
    i.expected_return_date,
    (SELECT COUNT(*) FROM lab5.issues WHERE equipment_id = i.id AND status = 'open')
  FROM lab5.inventory i
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BORROWED EQUIPMENT TRACKING
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.get_currently_borrowed_equipment()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrower_id UUID,
  borrower_name VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.current_borrower_id,
    u.full_name,
    i.borrowed_at,
    i.expected_return_date,
    EXTRACT(DAY FROM (i.expected_return_date - CURRENT_DATE))::INTEGER,
    CASE WHEN i.expected_return_date < CURRENT_DATE THEN true ELSE false END
  FROM lab3.inventory i
  JOIN central.users u ON i.current_borrower_id = u.id
  WHERE i.status = 'borrowed'
  ORDER BY i.expected_return_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab4.get_currently_borrowed_equipment()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrower_id UUID,
  borrower_name VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.current_borrower_id,
    u.full_name,
    i.borrowed_at,
    i.expected_return_date,
    EXTRACT(DAY FROM (i.expected_return_date - CURRENT_DATE))::INTEGER,
    CASE WHEN i.expected_return_date < CURRENT_DATE THEN true ELSE false END
  FROM lab4.inventory i
  JOIN central.users u ON i.current_borrower_id = u.id
  WHERE i.status = 'borrowed'
  ORDER BY i.expected_return_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab5.get_currently_borrowed_equipment()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrower_id UUID,
  borrower_name VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date DATE,
  days_until_due INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_name,
    i.equipment_code,
    i.current_borrower_id,
    u.full_name,
    i.borrowed_at,
    i.expected_return_date,
    EXTRACT(DAY FROM (i.expected_return_date - CURRENT_DATE))::INTEGER,
    CASE WHEN i.expected_return_date < CURRENT_DATE THEN true ELSE false END
  FROM lab5.inventory i
  JOIN central.users u ON i.current_borrower_id = u.id
  WHERE i.status = 'borrowed'
  ORDER BY i.expected_return_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CLEARANCE REQUEST FUNCTIONS (Labs 3-5 Specific)
-- =====================================================

-- Function to check if user is cleared in a specific lab
CREATE OR REPLACE FUNCTION lab3.check_user_clearance_status(p_user_id UUID)
RETURNS TABLE (
  is_cleared BOOLEAN,
  has_borrowed_equipment BOOLEAN,
  has_unpaid_fines BOOLEAN,
  has_open_issues BOOLEAN,
  total_unpaid_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT (
      EXISTS(SELECT 1 FROM lab3.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed')
      OR EXISTS(SELECT 1 FROM lab3.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0))
      OR EXISTS(SELECT 1 FROM lab3.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress'))
    ),
    EXISTS(SELECT 1 FROM lab3.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
    EXISTS(SELECT 1 FROM lab3.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
    EXISTS(SELECT 1 FROM lab3.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress')),
    COALESCE((SELECT SUM(damage_cost + fine_amount) FROM lab3.issues WHERE reported_by = p_user_id AND paid = false), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab4.check_user_clearance_status(p_user_id UUID)
RETURNS TABLE (
  is_cleared BOOLEAN,
  has_borrowed_equipment BOOLEAN,
  has_unpaid_fines BOOLEAN,
  has_open_issues BOOLEAN,
  total_unpaid_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT (
      EXISTS(SELECT 1 FROM lab4.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed')
      OR EXISTS(SELECT 1 FROM lab4.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0))
      OR EXISTS(SELECT 1 FROM lab4.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress'))
    ),
    EXISTS(SELECT 1 FROM lab4.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
    EXISTS(SELECT 1 FROM lab4.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
    EXISTS(SELECT 1 FROM lab4.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress')),
    COALESCE((SELECT SUM(damage_cost + fine_amount) FROM lab4.issues WHERE reported_by = p_user_id AND paid = false), 0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab5.check_user_clearance_status(p_user_id UUID)
RETURNS TABLE (
  is_cleared BOOLEAN,
  has_borrowed_equipment BOOLEAN,
  has_unpaid_fines BOOLEAN,
  has_open_issues BOOLEAN,
  total_unpaid_amount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    NOT (
      EXISTS(SELECT 1 FROM lab5.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed')
      OR EXISTS(SELECT 1 FROM lab5.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0))
      OR EXISTS(SELECT 1 FROM lab5.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress'))
    ),
    EXISTS(SELECT 1 FROM lab5.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed'),
    EXISTS(SELECT 1 FROM lab5.issues WHERE reported_by = p_user_id AND paid = false AND (damage_cost > 0 OR fine_amount > 0)),
    EXISTS(SELECT 1 FROM lab5.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress')),
    COALESCE((SELECT SUM(damage_cost + fine_amount) FROM lab5.issues WHERE reported_by = p_user_id AND paid = false), 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE SCHEDULING
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.schedule_maintenance(
  p_equipment_id UUID,
  p_maintenance_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lab3.inventory
  SET 
    status = 'maintenance',
    updated_at = NOW()
  WHERE id = p_equipment_id;
  
  INSERT INTO lab3.issues (
    equipment_id,
    reported_by,
    issue_type,
    severity,
    title,
    description,
    status,
    created_at
  ) VALUES (
    p_equipment_id,
    (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1),
    'malfunction',
    'low',
    'Scheduled Maintenance',
    p_maintenance_notes,
    'in_progress',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab4.schedule_maintenance(
  p_equipment_id UUID,
  p_maintenance_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lab4.inventory
  SET 
    status = 'maintenance',
    updated_at = NOW()
  WHERE id = p_equipment_id;
  
  INSERT INTO lab4.issues (
    equipment_id,
    reported_by,
    issue_type,
    severity,
    title,
    description,
    status,
    created_at
  ) VALUES (
    p_equipment_id,
    (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1),
    'malfunction',
    'low',
    'Scheduled Maintenance',
    p_maintenance_notes,
    'in_progress',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab5.schedule_maintenance(
  p_equipment_id UUID,
  p_maintenance_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lab5.inventory
  SET 
    status = 'maintenance',
    updated_at = NOW()
  WHERE id = p_equipment_id;
  
  INSERT INTO lab5.issues (
    equipment_id,
    reported_by,
    issue_type,
    severity,
    title,
    description,
    status,
    created_at
  ) VALUES (
    p_equipment_id,
    (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1),
    'malfunction',
    'low',
    'Scheduled Maintenance',
    p_maintenance_notes,
    'in_progress',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOG INTEGRATION FOR LABS 3-5
-- =====================================================

DROP TRIGGER IF EXISTS trigger_lab3_inventory_audit ON lab3.inventory;
CREATE TRIGGER trigger_lab3_inventory_audit
  AFTER UPDATE ON lab3.inventory
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION central.log_equipment_status_change();

DROP TRIGGER IF EXISTS trigger_lab4_inventory_audit ON lab4.inventory;
CREATE TRIGGER trigger_lab4_inventory_audit
  AFTER UPDATE ON lab4.inventory
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION central.log_equipment_status_change();

DROP TRIGGER IF EXISTS trigger_lab5_inventory_audit ON lab5.inventory;
CREATE TRIGGER trigger_lab5_inventory_audit
  AFTER UPDATE ON lab5.inventory
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION central.log_equipment_status_change();

-- =====================================================
-- NOTIFICATION TRIGGERS FOR STATUS CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION lab3.notify_issue_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lab3.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    NEW.reported_by,
    'issue_created',
    'Issue Reported',
    format('An issue has been reported: %s', NEW.title),
    'issue',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab3_notify_issue ON lab3.issues;
CREATE TRIGGER trigger_lab3_notify_issue
  AFTER INSERT ON lab3.issues
  FOR EACH ROW
  EXECUTE FUNCTION lab3.notify_issue_created();

CREATE OR REPLACE FUNCTION lab4.notify_issue_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lab4.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    NEW.reported_by,
    'issue_created',
    'Issue Reported',
    format('An issue has been reported: %s', NEW.title),
    'issue',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab4_notify_issue ON lab4.issues;
CREATE TRIGGER trigger_lab4_notify_issue
  AFTER INSERT ON lab4.issues
  FOR EACH ROW
  EXECUTE FUNCTION lab4.notify_issue_created();

CREATE OR REPLACE FUNCTION lab5.notify_issue_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lab5.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    NEW.reported_by,
    'issue_created',
    'Issue Reported',
    format('An issue has been reported: %s', NEW.title),
    'issue',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lab5_notify_issue ON lab5.issues;
CREATE TRIGGER trigger_lab5_notify_issue
  AFTER INSERT ON lab5.issues
  FOR EACH ROW
  EXECUTE FUNCTION lab5.notify_issue_created();

-- =====================================================
-- PENDING REQUESTS BY USER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION central.get_pending_clearance_requests_by_user(p_user_id UUID)
RETURNS TABLE (
  request_id UUID,
  status VARCHAR,
  request_type VARCHAR,
  lab1_status VARCHAR,
  lab2_status VARCHAR,
  lab3_status VARCHAR,
  lab4_status VARCHAR,
  lab5_status VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.status,
    cr.request_type,
    cr.lab1_status,
    cr.lab2_status,
    cr.lab3_status,
    cr.lab4_status,
    cr.lab5_status,
    cr.created_at
  FROM central.clearance_requests cr
  WHERE cr.user_id = p_user_id
  AND cr.status IN ('pending', 'in_review')
  ORDER BY cr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify Lab3 Triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'lab3'
ORDER BY event_object_table, trigger_name;

-- Verify Lab4 Triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'lab4'
ORDER BY event_object_table, trigger_name;

-- Verify Lab5 Triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'lab5'
ORDER BY event_object_table, trigger_name;

-- Test Equipment Availability
-- SELECT * FROM lab3.get_equipment_availability();
-- SELECT * FROM lab4.get_equipment_availability();
-- SELECT * FROM lab5.get_equipment_availability();

-- Test Currently Borrowed Equipment
-- SELECT * FROM lab3.get_currently_borrowed_equipment();
-- SELECT * FROM lab4.get_currently_borrowed_equipment();
-- SELECT * FROM lab5.get_currently_borrowed_equipment();
