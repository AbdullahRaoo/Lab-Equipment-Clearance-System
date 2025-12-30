-- =====================================================
-- Stage 2 M2: Labs 1-2 Triggers and Business Logic
-- =====================================================
-- This script implements automated workflows for lab1 and lab2:
-- 1. Inventory status update triggers
-- 2. Return processing with late fees
-- 3. Issue management workflows
-- 4. Equipment availability tracking

-- =====================================================
-- LAB1: INVENTORY STATUS TRIGGERS
-- =====================================================

-- Function: Update inventory status when borrowed
CREATE OR REPLACE FUNCTION lab1.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- When equipment is borrowed, update inventory status
  UPDATE lab1.inventory
  SET 
    status = 'borrowed',
    current_borrower_id = NEW.borrower_id,
    borrowed_at = NEW.borrowed_at,
    expected_return_date = NEW.expected_return_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On return record creation (status = 'pending')
CREATE OR REPLACE TRIGGER trigger_lab1_inventory_borrow
  AFTER INSERT ON lab1.returns
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION lab1.update_inventory_on_borrow();

-- Function: Update inventory status when returned
CREATE OR REPLACE FUNCTION lab1.update_inventory_on_return()
RETURNS TRIGGER AS $$
BEGIN
  -- When equipment is returned, update inventory status
  IF NEW.status = 'returned' AND OLD.status = 'pending' THEN
    UPDATE lab1.inventory
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
CREATE OR REPLACE TRIGGER trigger_lab1_inventory_return
  AFTER UPDATE ON lab1.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab1.update_inventory_on_return();

-- =====================================================
-- LAB1: RETURN PROCESSING WITH LATE FEES
-- =====================================================

-- Function: Calculate and process late fees
CREATE OR REPLACE FUNCTION lab1.process_late_return_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL(10,2);
  v_late_fee_per_day DECIMAL(10,2) := 5.00; -- $5 per day late fee
BEGIN
  -- Calculate late fee when equipment is returned late
  IF NEW.status = 'returned' AND NEW.actual_return_date > NEW.expected_return_date THEN
    v_days_overdue := EXTRACT(DAY FROM (NEW.actual_return_date - NEW.expected_return_date))::INTEGER;
    v_late_fee := v_days_overdue * v_late_fee_per_day;
    
    -- Update the late fee in returns table
    UPDATE lab1.returns
    SET late_fee = v_late_fee
    WHERE id = NEW.id;
    
    -- Create an issue record for late return with financial impact
    INSERT INTO lab1.issues (
      equipment_id,
      reporter_id,
      issue_type,
      severity,
      description,
      status,
      amount,
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
      format('Equipment returned %s days late. Late fee: $%s', v_days_overdue, v_late_fee),
      'open',
      v_late_fee,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Process late fees on return
CREATE OR REPLACE TRIGGER trigger_lab1_late_return_fee
  AFTER UPDATE ON lab1.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab1.process_late_return_fee();

-- =====================================================
-- LAB1: ISSUE RESOLUTION WORKFLOW
-- =====================================================

-- Function: Auto-resolve low severity issues after 30 days
CREATE OR REPLACE FUNCTION lab1.auto_resolve_old_issues()
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  -- Auto-resolve low severity issues older than 30 days
  UPDATE lab1.issues
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

-- Function: Update equipment status when issue is created
CREATE OR REPLACE FUNCTION lab1.update_equipment_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- If issue is critical (damage or malfunction), update equipment status
  IF NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical') THEN
    UPDATE lab1.inventory
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

-- Trigger: Update equipment status when critical issue is created
CREATE OR REPLACE TRIGGER trigger_lab1_equipment_issue
  AFTER INSERT ON lab1.issues
  FOR EACH ROW
  WHEN (NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION lab1.update_equipment_on_issue();

-- =====================================================
-- LAB2: INVENTORY STATUS TRIGGERS
-- =====================================================

-- Function: Update inventory status when borrowed
CREATE OR REPLACE FUNCTION lab2.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- When equipment is borrowed, update inventory status
  UPDATE lab2.inventory
  SET 
    status = 'borrowed',
    current_borrower_id = NEW.borrower_id,
    borrowed_at = NEW.borrowed_at,
    expected_return_date = NEW.expected_return_date,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: On return record creation (status = 'pending')
CREATE OR REPLACE TRIGGER trigger_lab2_inventory_borrow
  AFTER INSERT ON lab2.returns
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION lab2.update_inventory_on_borrow();

-- Function: Update inventory status when returned
CREATE OR REPLACE FUNCTION lab2.update_inventory_on_return()
RETURNS TRIGGER AS $$
BEGIN
  -- When equipment is returned, update inventory status
  IF NEW.status = 'returned' AND OLD.status = 'pending' THEN
    UPDATE lab2.inventory
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
CREATE OR REPLACE TRIGGER trigger_lab2_inventory_return
  AFTER UPDATE ON lab2.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab2.update_inventory_on_return();

-- =====================================================
-- LAB2: RETURN PROCESSING WITH LATE FEES
-- =====================================================

-- Function: Calculate and process late fees
CREATE OR REPLACE FUNCTION lab2.process_late_return_fee()
RETURNS TRIGGER AS $$
DECLARE
  v_days_overdue INTEGER;
  v_late_fee DECIMAL(10,2);
  v_late_fee_per_day DECIMAL(10,2) := 5.00; -- $5 per day late fee
BEGIN
  -- Calculate late fee when equipment is returned late
  IF NEW.status = 'returned' AND NEW.actual_return_date > NEW.expected_return_date THEN
    v_days_overdue := EXTRACT(DAY FROM (NEW.actual_return_date - NEW.expected_return_date))::INTEGER;
    v_late_fee := v_days_overdue * v_late_fee_per_day;
    
    -- Update the late fee in returns table
    UPDATE lab2.returns
    SET late_fee = v_late_fee
    WHERE id = NEW.id;
    
    -- Create an issue record for late return with financial impact
    INSERT INTO lab2.issues (
      equipment_id,
      reporter_id,
      issue_type,
      severity,
      description,
      status,
      amount,
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
      format('Equipment returned %s days late. Late fee: $%s', v_days_overdue, v_late_fee),
      'open',
      v_late_fee,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Process late fees on return
CREATE OR REPLACE TRIGGER trigger_lab2_late_return_fee
  AFTER UPDATE ON lab2.returns
  FOR EACH ROW
  WHEN (NEW.status = 'returned' AND OLD.status = 'pending')
  EXECUTE FUNCTION lab2.process_late_return_fee();

-- =====================================================
-- LAB2: ISSUE RESOLUTION WORKFLOW
-- =====================================================

-- Function: Auto-resolve low severity issues after 30 days
CREATE OR REPLACE FUNCTION lab2.auto_resolve_old_issues()
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  -- Auto-resolve low severity issues older than 30 days
  UPDATE lab2.issues
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

-- Function: Update equipment status when issue is created
CREATE OR REPLACE FUNCTION lab2.update_equipment_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- If issue is critical (damage or malfunction), update equipment status
  IF NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical') THEN
    UPDATE lab2.inventory
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

-- Trigger: Update equipment status when critical issue is created
CREATE OR REPLACE TRIGGER trigger_lab2_equipment_issue
  AFTER INSERT ON lab2.issues
  FOR EACH ROW
  WHEN (NEW.issue_type IN ('damage', 'malfunction') AND NEW.severity IN ('high', 'critical'))
  EXECUTE FUNCTION lab2.update_equipment_on_issue();

-- =====================================================
-- EQUIPMENT AVAILABILITY TRACKING FUNCTIONS
-- =====================================================

-- Function: Get real-time equipment availability for lab1
CREATE OR REPLACE FUNCTION lab1.get_equipment_availability()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  status VARCHAR,
  is_available BOOLEAN,
  current_borrower_id UUID,
  expected_return_date TIMESTAMP,
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
    (SELECT COUNT(*) FROM lab1.issues WHERE equipment_id = i.id AND status = 'open')
  FROM lab1.inventory i
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get real-time equipment availability for lab2
CREATE OR REPLACE FUNCTION lab2.get_equipment_availability()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  status VARCHAR,
  is_available BOOLEAN,
  current_borrower_id UUID,
  expected_return_date TIMESTAMP,
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
    (SELECT COUNT(*) FROM lab2.issues WHERE equipment_id = i.id AND status = 'open')
  FROM lab2.inventory i
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BORROWED EQUIPMENT TRACKING
-- =====================================================

-- Function: Get all currently borrowed equipment in lab1
CREATE OR REPLACE FUNCTION lab1.get_currently_borrowed_equipment()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrower_id UUID,
  borrower_name VARCHAR,
  borrowed_at TIMESTAMP,
  expected_return_date TIMESTAMP,
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
    EXTRACT(DAY FROM (i.expected_return_date - NOW()))::INTEGER,
    CASE WHEN i.expected_return_date < NOW() THEN true ELSE false END
  FROM lab1.inventory i
  JOIN central.users u ON i.current_borrower_id = u.id
  WHERE i.status = 'borrowed'
  ORDER BY i.expected_return_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all currently borrowed equipment in lab2
CREATE OR REPLACE FUNCTION lab2.get_currently_borrowed_equipment()
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  equipment_code VARCHAR,
  borrower_id UUID,
  borrower_name VARCHAR,
  borrowed_at TIMESTAMP,
  expected_return_date TIMESTAMP,
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
    EXTRACT(DAY FROM (i.expected_return_date - NOW()))::INTEGER,
    CASE WHEN i.expected_return_date < NOW() THEN true ELSE false END
  FROM lab2.inventory i
  JOIN central.users u ON i.current_borrower_id = u.id
  WHERE i.status = 'borrowed'
  ORDER BY i.expected_return_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MAINTENANCE SCHEDULING
-- =====================================================

-- Function: Schedule maintenance for equipment (lab1)
CREATE OR REPLACE FUNCTION lab1.schedule_maintenance(
  p_equipment_id UUID,
  p_maintenance_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update equipment status to maintenance
  UPDATE lab1.inventory
  SET 
    status = 'maintenance',
    updated_at = NOW()
  WHERE id = p_equipment_id;
  
  -- Create a maintenance issue
  INSERT INTO lab1.issues (
    equipment_id,
    reporter_id,
    issue_type,
    severity,
    description,
    status,
    created_at
  ) VALUES (
    p_equipment_id,
    (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1), -- System admin
    'malfunction',
    'low',
    p_maintenance_notes,
    'in_progress',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Schedule maintenance for equipment (lab2)
CREATE OR REPLACE FUNCTION lab2.schedule_maintenance(
  p_equipment_id UUID,
  p_maintenance_notes TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update equipment status to maintenance
  UPDATE lab2.inventory
  SET 
    status = 'maintenance',
    updated_at = NOW()
  WHERE id = p_equipment_id;
  
  -- Create a maintenance issue
  INSERT INTO lab2.issues (
    equipment_id,
    reporter_id,
    issue_type,
    severity,
    description,
    status,
    created_at
  ) VALUES (
    p_equipment_id,
    (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1), -- System admin
    'malfunction',
    'low',
    p_maintenance_notes,
    'in_progress',
    NOW()
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOG INTEGRATION
-- =====================================================

-- Function: Log equipment status changes to central audit log
CREATE OR REPLACE FUNCTION central.log_equipment_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_lab_name VARCHAR;
BEGIN
  -- Extract lab name from trigger schema
  v_lab_name := TG_TABLE_SCHEMA;
  
  -- Log status change to central audit
  IF NEW.status != OLD.status THEN
    INSERT INTO central.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by,
      created_at
    ) VALUES (
      v_lab_name || '.inventory',
      NEW.id,
      'UPDATE',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      COALESCE(
        (SELECT id FROM central.users WHERE auth_id = auth.uid()),
        (SELECT id FROM central.users WHERE role = 'admin' LIMIT 1)
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Log lab1 inventory status changes
CREATE OR REPLACE TRIGGER trigger_lab1_inventory_audit
  AFTER UPDATE ON lab1.inventory
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION central.log_equipment_status_change();

-- Trigger: Log lab2 inventory status changes
CREATE OR REPLACE TRIGGER trigger_lab2_inventory_audit
  AFTER UPDATE ON lab2.inventory
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION central.log_equipment_status_change();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify Lab1 Triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'lab1'
ORDER BY event_object_table, trigger_name;

-- Verify Lab2 Triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'lab2'
ORDER BY event_object_table, trigger_name;

-- Test Equipment Availability
-- SELECT * FROM lab1.get_equipment_availability();
-- SELECT * FROM lab2.get_equipment_availability();

-- Test Currently Borrowed Equipment
-- SELECT * FROM lab1.get_currently_borrowed_equipment();
-- SELECT * FROM lab2.get_currently_borrowed_equipment();
