-- =====================================================
-- ECMS Lab 1 & Lab 2 - Business Logic & Triggers (M2 Task)
-- Stage 2: Core Business Logic & Triggers
-- =====================================================

-- =====================================================
-- INVENTORY STATUS UPDATE TRIGGERS (Lab 1)
-- =====================================================

-- Trigger function to update inventory status when borrowed
CREATE OR REPLACE FUNCTION lab1.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set status to borrowed when borrowed_by is set
  IF NEW.borrowed_by IS NOT NULL AND OLD.borrowed_by IS NULL THEN
    NEW.status := 'borrowed';
    NEW.borrowed_at := NOW();
    
    -- Log the action
    PERFORM central.log_action(
      'equipment_borrowed',
      'inventory',
      NEW.id::VARCHAR,
      'lab1',
      jsonb_build_object(
        'equipment_code', NEW.equipment_code,
        'equipment_name', NEW.equipment_name,
        'borrowed_by', NEW.borrowed_by
      )
    );
  END IF;
  
  -- Automatically set status to available when returned
  IF NEW.borrowed_by IS NULL AND OLD.borrowed_by IS NOT NULL THEN
    NEW.status := 'available';
    NEW.borrowed_at := NULL;
    NEW.expected_return_date := NULL;
    
    -- Log the action
    PERFORM central.log_action(
      'equipment_returned',
      'inventory',
      NEW.id::VARCHAR,
      'lab1',
      jsonb_build_object(
        'equipment_code', NEW.equipment_code,
        'equipment_name', NEW.equipment_name,
        'previous_borrower', OLD.borrowed_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab1_inventory_status_update
  BEFORE UPDATE ON lab1.inventory
  FOR EACH ROW
  EXECUTE FUNCTION lab1.update_inventory_on_borrow();

-- =====================================================
-- INVENTORY STATUS UPDATE TRIGGERS (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.update_inventory_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.borrowed_by IS NOT NULL AND OLD.borrowed_by IS NULL THEN
    NEW.status := 'borrowed';
    NEW.borrowed_at := NOW();
    
    PERFORM central.log_action(
      'equipment_borrowed',
      'inventory',
      NEW.id::VARCHAR,
      'lab2',
      jsonb_build_object(
        'equipment_code', NEW.equipment_code,
        'equipment_name', NEW.equipment_name,
        'borrowed_by', NEW.borrowed_by
      )
    );
  END IF;
  
  IF NEW.borrowed_by IS NULL AND OLD.borrowed_by IS NOT NULL THEN
    NEW.status := 'available';
    NEW.borrowed_at := NULL;
    NEW.expected_return_date := NULL;
    
    PERFORM central.log_action(
      'equipment_returned',
      'inventory',
      NEW.id::VARCHAR,
      'lab2',
      jsonb_build_object(
        'equipment_code', NEW.equipment_code,
        'equipment_name', NEW.equipment_name,
        'previous_borrower', OLD.borrowed_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lab2_inventory_status_update
  BEFORE UPDATE ON lab2.inventory
  FOR EACH ROW
  EXECUTE FUNCTION lab2.update_inventory_on_borrow();

-- =====================================================
-- ISSUE REGISTRATION STORED PROCEDURES (Lab 1)
-- =====================================================

CREATE OR REPLACE FUNCTION lab1.register_issue(
  p_equipment_id UUID,
  p_reported_by UUID,
  p_issue_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_description TEXT,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_issue_id UUID;
  v_equipment_code VARCHAR;
BEGIN
  -- Get equipment code for logging
  SELECT equipment_code INTO v_equipment_code
  FROM lab1.inventory
  WHERE id = p_equipment_id;
  
  IF v_equipment_code IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;
  
  -- Insert the issue
  INSERT INTO lab1.issues (
    equipment_id,
    reported_by,
    issue_type,
    severity,
    title,
    description,
    attachments,
    status
  ) VALUES (
    p_equipment_id,
    p_reported_by,
    p_issue_type,
    p_severity,
    p_title,
    p_description,
    p_attachments,
    'open'
  ) RETURNING id INTO v_issue_id;
  
  -- Update equipment status if severity is high or critical
  IF p_severity IN ('high', 'critical') THEN
    UPDATE lab1.inventory
    SET status = 'maintenance'
    WHERE id = p_equipment_id;
  END IF;
  
  -- Log the action
  PERFORM central.log_action(
    'issue_registered',
    'issue',
    v_issue_id::VARCHAR,
    'lab1',
    jsonb_build_object(
      'equipment_code', v_equipment_code,
      'issue_type', p_issue_type,
      'severity', p_severity
    )
  );
  
  RETURN v_issue_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ISSUE REGISTRATION STORED PROCEDURES (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.register_issue(
  p_equipment_id UUID,
  p_reported_by UUID,
  p_issue_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_description TEXT,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
  v_issue_id UUID;
  v_equipment_code VARCHAR;
BEGIN
  SELECT equipment_code INTO v_equipment_code
  FROM lab2.inventory
  WHERE id = p_equipment_id;
  
  IF v_equipment_code IS NULL THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;
  
  INSERT INTO lab2.issues (
    equipment_id,
    reported_by,
    issue_type,
    severity,
    title,
    description,
    attachments,
    status
  ) VALUES (
    p_equipment_id,
    p_reported_by,
    p_issue_type,
    p_severity,
    p_title,
    p_description,
    p_attachments,
    'open'
  ) RETURNING id INTO v_issue_id;
  
  IF p_severity IN ('high', 'critical') THEN
    UPDATE lab2.inventory
    SET status = 'maintenance'
    WHERE id = p_equipment_id;
  END IF;
  
  PERFORM central.log_action(
    'issue_registered',
    'issue',
    v_issue_id::VARCHAR,
    'lab2',
    jsonb_build_object(
      'equipment_code', v_equipment_code,
      'issue_type', p_issue_type,
      'severity', p_severity
    )
  );
  
  RETURN v_issue_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RETURN WORKFLOW LOGIC (Lab 1)
-- =====================================================

CREATE OR REPLACE FUNCTION lab1.process_return(
  p_equipment_id UUID,
  p_user_id UUID,
  p_condition_on_return VARCHAR,
  p_condition_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_return_id UUID;
  v_borrowed_at TIMESTAMPTZ;
  v_expected_return_date TIMESTAMPTZ;
  v_is_late BOOLEAN := false;
  v_late_days INTEGER := 0;
  v_equipment_code VARCHAR;
BEGIN
  -- Get borrowing information
  SELECT borrowed_at, expected_return_date, equipment_code
  INTO v_borrowed_at, v_expected_return_date, v_equipment_code
  FROM lab1.inventory
  WHERE id = p_equipment_id AND borrowed_by = p_user_id;
  
  IF v_borrowed_at IS NULL THEN
    RAISE EXCEPTION 'Equipment is not currently borrowed by this user';
  END IF;
  
  -- Check if return is late
  IF v_expected_return_date < NOW() THEN
    v_is_late := true;
    v_late_days := EXTRACT(DAY FROM NOW() - v_expected_return_date)::INTEGER;
  END IF;
  
  -- Create return record
  INSERT INTO lab1.returns (
    equipment_id,
    user_id,
    borrowed_at,
    returned_at,
    expected_return_date,
    status,
    is_late,
    late_days,
    condition_on_return,
    condition_notes
  ) VALUES (
    p_equipment_id,
    p_user_id,
    v_borrowed_at,
    NOW(),
    v_expected_return_date,
    CASE WHEN v_is_late THEN 'late' ELSE 'pending' END,
    v_is_late,
    v_late_days,
    p_condition_on_return,
    p_condition_notes
  ) RETURNING id INTO v_return_id;
  
  -- Update inventory - clear borrower
  UPDATE lab1.inventory
  SET 
    borrowed_by = NULL,
    borrowed_at = NULL,
    expected_return_date = NULL,
    status = 'available',
    condition = p_condition_on_return
  WHERE id = p_equipment_id;
  
  -- Log the action
  PERFORM central.log_action(
    'equipment_return_processed',
    'return',
    v_return_id::VARCHAR,
    'lab1',
    jsonb_build_object(
      'equipment_code', v_equipment_code,
      'is_late', v_is_late,
      'late_days', v_late_days,
      'condition', p_condition_on_return
    )
  );
  
  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RETURN WORKFLOW LOGIC (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.process_return(
  p_equipment_id UUID,
  p_user_id UUID,
  p_condition_on_return VARCHAR,
  p_condition_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_return_id UUID;
  v_borrowed_at TIMESTAMPTZ;
  v_expected_return_date TIMESTAMPTZ;
  v_is_late BOOLEAN := false;
  v_late_days INTEGER := 0;
  v_equipment_code VARCHAR;
BEGIN
  SELECT borrowed_at, expected_return_date, equipment_code
  INTO v_borrowed_at, v_expected_return_date, v_equipment_code
  FROM lab2.inventory
  WHERE id = p_equipment_id AND borrowed_by = p_user_id;
  
  IF v_borrowed_at IS NULL THEN
    RAISE EXCEPTION 'Equipment is not currently borrowed by this user';
  END IF;
  
  IF v_expected_return_date < NOW() THEN
    v_is_late := true;
    v_late_days := EXTRACT(DAY FROM NOW() - v_expected_return_date)::INTEGER;
  END IF;
  
  INSERT INTO lab2.returns (
    equipment_id,
    user_id,
    borrowed_at,
    returned_at,
    expected_return_date,
    status,
    is_late,
    late_days,
    condition_on_return,
    condition_notes
  ) VALUES (
    p_equipment_id,
    p_user_id,
    v_borrowed_at,
    NOW(),
    v_expected_return_date,
    CASE WHEN v_is_late THEN 'late' ELSE 'pending' END,
    v_is_late,
    v_late_days,
    p_condition_on_return,
    p_condition_notes
  ) RETURNING id INTO v_return_id;
  
  UPDATE lab2.inventory
  SET 
    borrowed_by = NULL,
    borrowed_at = NULL,
    expected_return_date = NULL,
    status = 'available',
    condition = p_condition_on_return
  WHERE id = p_equipment_id;
  
  PERFORM central.log_action(
    'equipment_return_processed',
    'return',
    v_return_id::VARCHAR,
    'lab2',
    jsonb_build_object(
      'equipment_code', v_equipment_code,
      'is_late', v_is_late,
      'late_days', v_late_days,
      'condition', p_condition_on_return
    )
  );
  
  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EQUIPMENT AVAILABILITY CHECK FUNCTIONS (Lab 1)
-- =====================================================

CREATE OR REPLACE FUNCTION lab1.check_equipment_availability(
  p_equipment_id UUID
)
RETURNS TABLE (
  is_available BOOLEAN,
  status VARCHAR,
  borrowed_by UUID,
  expected_return_date TIMESTAMPTZ,
  equipment_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (i.status = 'available' AND i.borrowed_by IS NULL) AS is_available,
    i.status,
    i.borrowed_by,
    i.expected_return_date,
    i.equipment_name
  FROM lab1.inventory i
  WHERE i.id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

-- Get all available equipment in Lab 1
CREATE OR REPLACE FUNCTION lab1.get_available_equipment()
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  condition VARCHAR,
  location VARCHAR,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.condition,
    i.location,
    i.metadata
  FROM lab1.inventory i
  WHERE i.status = 'available' AND i.borrowed_by IS NULL
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EQUIPMENT AVAILABILITY CHECK FUNCTIONS (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.check_equipment_availability(
  p_equipment_id UUID
)
RETURNS TABLE (
  is_available BOOLEAN,
  status VARCHAR,
  borrowed_by UUID,
  expected_return_date TIMESTAMPTZ,
  equipment_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (i.status = 'available' AND i.borrowed_by IS NULL) AS is_available,
    i.status,
    i.borrowed_by,
    i.expected_return_date,
    i.equipment_name
  FROM lab2.inventory i
  WHERE i.id = p_equipment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lab2.get_available_equipment()
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  condition VARCHAR,
  location VARCHAR,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.condition,
    i.location,
    i.metadata
  FROM lab2.inventory i
  WHERE i.status = 'available' AND i.borrowed_by IS NULL
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- JSONB SEARCH FUNCTIONS (Lab 1)
-- =====================================================

-- Search equipment by metadata fields
CREATE OR REPLACE FUNCTION lab1.search_equipment(
  p_search_term VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL,
  p_metadata_filter JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  status VARCHAR,
  condition VARCHAR,
  location VARCHAR,
  metadata JSONB,
  borrowed_by UUID,
  borrowed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.status,
    i.condition,
    i.location,
    i.metadata,
    i.borrowed_by,
    i.borrowed_at
  FROM lab1.inventory i
  WHERE 
    (p_search_term IS NULL OR 
     i.equipment_name ILIKE '%' || p_search_term || '%' OR
     i.equipment_code ILIKE '%' || p_search_term || '%' OR
     i.notes ILIKE '%' || p_search_term || '%')
    AND
    (p_category IS NULL OR i.category = p_category)
    AND
    (p_status IS NULL OR i.status = p_status)
    AND
    (p_metadata_filter IS NULL OR i.metadata @> p_metadata_filter)
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- JSONB SEARCH FUNCTIONS (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.search_equipment(
  p_search_term VARCHAR DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_status VARCHAR DEFAULT NULL,
  p_metadata_filter JSONB DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  status VARCHAR,
  condition VARCHAR,
  location VARCHAR,
  metadata JSONB,
  borrowed_by UUID,
  borrowed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.status,
    i.condition,
    i.location,
    i.metadata,
    i.borrowed_by,
    i.borrowed_at
  FROM lab2.inventory i
  WHERE 
    (p_search_term IS NULL OR 
     i.equipment_name ILIKE '%' || p_search_term || '%' OR
     i.equipment_code ILIKE '%' || p_search_term || '%' OR
     i.notes ILIKE '%' || p_search_term || '%')
    AND
    (p_category IS NULL OR i.category = p_category)
    AND
    (p_status IS NULL OR i.status = p_status)
    AND
    (p_metadata_filter IS NULL OR i.metadata @> p_metadata_filter)
  ORDER BY i.equipment_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY: Get User's Borrowed Equipment (Lab 1)
-- =====================================================

CREATE OR REPLACE FUNCTION lab1.get_user_borrowed_equipment(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  days_borrowed INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.borrowed_at,
    i.expected_return_date,
    EXTRACT(DAY FROM NOW() - i.borrowed_at)::INTEGER AS days_borrowed,
    (i.expected_return_date < NOW()) AS is_overdue
  FROM lab1.inventory i
  WHERE i.borrowed_by = p_user_id
  ORDER BY i.borrowed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY: Get User's Borrowed Equipment (Lab 2)
-- =====================================================

CREATE OR REPLACE FUNCTION lab2.get_user_borrowed_equipment(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  equipment_code VARCHAR,
  equipment_name VARCHAR,
  category VARCHAR,
  borrowed_at TIMESTAMPTZ,
  expected_return_date TIMESTAMPTZ,
  days_borrowed INTEGER,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.equipment_code,
    i.equipment_name,
    i.category,
    i.borrowed_at,
    i.expected_return_date,
    EXTRACT(DAY FROM NOW() - i.borrowed_at)::INTEGER AS days_borrowed,
    (i.expected_return_date < NOW()) AS is_overdue
  FROM lab2.inventory i
  WHERE i.borrowed_by = p_user_id
  ORDER BY i.borrowed_at DESC;
END;
$$ LANGUAGE plpgsql;
