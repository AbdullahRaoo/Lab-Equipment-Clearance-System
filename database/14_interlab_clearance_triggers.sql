-- =====================================================
-- Stage 2 M4: Inter-lab Clearance System
-- =====================================================
-- This script implements:
-- 1. Multi-schema clearance check stored procedure
-- 2. Cross-lab aggregation functions
-- 3. Inter-lab transfer logic and triggers
-- 4. Clearance certificate generation
-- 5. Clearance validation algorithm (all 5 labs)

-- =====================================================
-- CENTRAL NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS central.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'clearance_submitted', 'clearance_approved', 'clearance_rejected', 
    'lab_cleared', 'certificate_generated', 'transfer_request', 'system_alert'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_central_notifications_user ON central.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_central_notifications_read ON central.notifications(is_read);

-- =====================================================
-- INTER-LAB TRANSFER TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS central.equipment_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  source_lab VARCHAR(10) NOT NULL CHECK (source_lab IN ('lab1', 'lab2', 'lab3', 'lab4', 'lab5')),
  destination_lab VARCHAR(10) NOT NULL CHECK (destination_lab IN ('lab1', 'lab2', 'lab3', 'lab4', 'lab5')),
  equipment_code VARCHAR(100) NOT NULL,
  equipment_name VARCHAR(255) NOT NULL,
  equipment_data JSONB NOT NULL, -- Full equipment record for restoration
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'completed', 'cancelled')),
  
  requested_by UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES central.users(id) ON DELETE SET NULL,
  
  transfer_notes TEXT,
  rejection_reason TEXT,
  
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_transfers_status ON central.equipment_transfers(status);
CREATE INDEX IF NOT EXISTS idx_equipment_transfers_source ON central.equipment_transfers(source_lab);
CREATE INDEX IF NOT EXISTS idx_equipment_transfers_dest ON central.equipment_transfers(destination_lab);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_equipment_transfers_updated_at ON central.equipment_transfers;
CREATE TRIGGER update_equipment_transfers_updated_at
  BEFORE UPDATE ON central.equipment_transfers
  FOR EACH ROW
  EXECUTE FUNCTION central.update_updated_at_column();

-- =====================================================
-- MULTI-SCHEMA CLEARANCE CHECK STORED PROCEDURE
-- =====================================================

CREATE OR REPLACE FUNCTION central.perform_full_clearance_check(p_user_id UUID)
RETURNS TABLE (
  overall_cleared BOOLEAN,
  lab1_cleared BOOLEAN,
  lab1_issues TEXT,
  lab2_cleared BOOLEAN,
  lab2_issues TEXT,
  lab3_cleared BOOLEAN,
  lab3_issues TEXT,
  lab4_cleared BOOLEAN,
  lab4_issues TEXT,
  lab5_cleared BOOLEAN,
  lab5_issues TEXT,
  total_unpaid_amount DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lab1_cleared BOOLEAN := true;
  v_lab1_issues TEXT := '';
  v_lab2_cleared BOOLEAN := true;
  v_lab2_issues TEXT := '';
  v_lab3_cleared BOOLEAN := true;
  v_lab3_issues TEXT := '';
  v_lab4_cleared BOOLEAN := true;
  v_lab4_issues TEXT := '';
  v_lab5_cleared BOOLEAN := true;
  v_lab5_issues TEXT := '';
  v_total_unpaid DECIMAL := 0;
  v_temp_count INTEGER;
  v_temp_amount DECIMAL;
BEGIN
  -- Check Lab 1
  SELECT COUNT(*) INTO v_temp_count FROM lab1.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed';
  IF v_temp_count > 0 THEN
    v_lab1_cleared := false;
    v_lab1_issues := v_lab1_issues || format('%s borrowed items; ', v_temp_count);
  END IF;
  
  SELECT COALESCE(SUM(damage_cost + fine_amount), 0) INTO v_temp_amount 
  FROM lab1.issues WHERE reported_by = p_user_id AND paid = false;
  IF v_temp_amount > 0 THEN
    v_lab1_cleared := false;
    v_lab1_issues := v_lab1_issues || format('$%.2f unpaid; ', v_temp_amount);
    v_total_unpaid := v_total_unpaid + v_temp_amount;
  END IF;
  
  SELECT COUNT(*) INTO v_temp_count FROM lab1.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress');
  IF v_temp_count > 0 THEN
    v_lab1_cleared := false;
    v_lab1_issues := v_lab1_issues || format('%s open issues; ', v_temp_count);
  END IF;
  
  -- Check Lab 2
  SELECT COUNT(*) INTO v_temp_count FROM lab2.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed';
  IF v_temp_count > 0 THEN
    v_lab2_cleared := false;
    v_lab2_issues := v_lab2_issues || format('%s borrowed items; ', v_temp_count);
  END IF;
  
  SELECT COALESCE(SUM(damage_cost + fine_amount), 0) INTO v_temp_amount 
  FROM lab2.issues WHERE reported_by = p_user_id AND paid = false;
  IF v_temp_amount > 0 THEN
    v_lab2_cleared := false;
    v_lab2_issues := v_lab2_issues || format('$%.2f unpaid; ', v_temp_amount);
    v_total_unpaid := v_total_unpaid + v_temp_amount;
  END IF;
  
  SELECT COUNT(*) INTO v_temp_count FROM lab2.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress');
  IF v_temp_count > 0 THEN
    v_lab2_cleared := false;
    v_lab2_issues := v_lab2_issues || format('%s open issues; ', v_temp_count);
  END IF;
  
  -- Check Lab 3
  SELECT COUNT(*) INTO v_temp_count FROM lab3.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed';
  IF v_temp_count > 0 THEN
    v_lab3_cleared := false;
    v_lab3_issues := v_lab3_issues || format('%s borrowed items; ', v_temp_count);
  END IF;
  
  SELECT COALESCE(SUM(damage_cost + fine_amount), 0) INTO v_temp_amount 
  FROM lab3.issues WHERE reported_by = p_user_id AND paid = false;
  IF v_temp_amount > 0 THEN
    v_lab3_cleared := false;
    v_lab3_issues := v_lab3_issues || format('$%.2f unpaid; ', v_temp_amount);
    v_total_unpaid := v_total_unpaid + v_temp_amount;
  END IF;
  
  SELECT COUNT(*) INTO v_temp_count FROM lab3.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress');
  IF v_temp_count > 0 THEN
    v_lab3_cleared := false;
    v_lab3_issues := v_lab3_issues || format('%s open issues; ', v_temp_count);
  END IF;
  
  -- Check Lab 4
  SELECT COUNT(*) INTO v_temp_count FROM lab4.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed';
  IF v_temp_count > 0 THEN
    v_lab4_cleared := false;
    v_lab4_issues := v_lab4_issues || format('%s borrowed items; ', v_temp_count);
  END IF;
  
  SELECT COALESCE(SUM(damage_cost + fine_amount), 0) INTO v_temp_amount 
  FROM lab4.issues WHERE reported_by = p_user_id AND paid = false;
  IF v_temp_amount > 0 THEN
    v_lab4_cleared := false;
    v_lab4_issues := v_lab4_issues || format('$%.2f unpaid; ', v_temp_amount);
    v_total_unpaid := v_total_unpaid + v_temp_amount;
  END IF;
  
  SELECT COUNT(*) INTO v_temp_count FROM lab4.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress');
  IF v_temp_count > 0 THEN
    v_lab4_cleared := false;
    v_lab4_issues := v_lab4_issues || format('%s open issues; ', v_temp_count);
  END IF;
  
  -- Check Lab 5
  SELECT COUNT(*) INTO v_temp_count FROM lab5.inventory WHERE current_borrower_id = p_user_id AND status = 'borrowed';
  IF v_temp_count > 0 THEN
    v_lab5_cleared := false;
    v_lab5_issues := v_lab5_issues || format('%s borrowed items; ', v_temp_count);
  END IF;
  
  SELECT COALESCE(SUM(damage_cost + fine_amount), 0) INTO v_temp_amount 
  FROM lab5.issues WHERE reported_by = p_user_id AND paid = false;
  IF v_temp_amount > 0 THEN
    v_lab5_cleared := false;
    v_lab5_issues := v_lab5_issues || format('$%.2f unpaid; ', v_temp_amount);
    v_total_unpaid := v_total_unpaid + v_temp_amount;
  END IF;
  
  SELECT COUNT(*) INTO v_temp_count FROM lab5.issues WHERE reported_by = p_user_id AND status IN ('open', 'in_progress');
  IF v_temp_count > 0 THEN
    v_lab5_cleared := false;
    v_lab5_issues := v_lab5_issues || format('%s open issues; ', v_temp_count);
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    (v_lab1_cleared AND v_lab2_cleared AND v_lab3_cleared AND v_lab4_cleared AND v_lab5_cleared),
    v_lab1_cleared, NULLIF(v_lab1_issues, ''),
    v_lab2_cleared, NULLIF(v_lab2_issues, ''),
    v_lab3_cleared, NULLIF(v_lab3_issues, ''),
    v_lab4_cleared, NULLIF(v_lab4_issues, ''),
    v_lab5_cleared, NULLIF(v_lab5_issues, ''),
    v_total_unpaid;
END;
$$;

-- =====================================================
-- CREATE CLEARANCE REQUEST STORED PROCEDURE
-- =====================================================

CREATE OR REPLACE FUNCTION central.create_clearance_request(
  p_user_id UUID,
  p_request_type VARCHAR,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_clearance_check RECORD;
BEGIN
  -- Check if user already has a pending request
  IF EXISTS (
    SELECT 1 FROM central.clearance_requests 
    WHERE user_id = p_user_id AND status IN ('pending', 'in_review')
  ) THEN
    RAISE EXCEPTION 'User already has a pending clearance request';
  END IF;
  
  -- Perform clearance check
  SELECT * INTO v_clearance_check FROM central.perform_full_clearance_check(p_user_id);
  
  -- Create the request
  INSERT INTO central.clearance_requests (
    user_id,
    request_type,
    reason,
    status,
    lab1_status,
    lab2_status,
    lab3_status,
    lab4_status,
    lab5_status,
    lab1_notes,
    lab2_notes,
    lab3_notes,
    lab4_notes,
    lab5_notes,
    valid_until,
    created_at
  ) VALUES (
    p_user_id,
    p_request_type,
    p_reason,
    CASE WHEN v_clearance_check.overall_cleared THEN 'approved' ELSE 'pending' END,
    CASE WHEN v_clearance_check.lab1_cleared THEN 'cleared' ELSE 'issues_found' END,
    CASE WHEN v_clearance_check.lab2_cleared THEN 'cleared' ELSE 'issues_found' END,
    CASE WHEN v_clearance_check.lab3_cleared THEN 'cleared' ELSE 'issues_found' END,
    CASE WHEN v_clearance_check.lab4_cleared THEN 'cleared' ELSE 'issues_found' END,
    CASE WHEN v_clearance_check.lab5_cleared THEN 'cleared' ELSE 'issues_found' END,
    v_clearance_check.lab1_issues,
    v_clearance_check.lab2_issues,
    v_clearance_check.lab3_issues,
    v_clearance_check.lab4_issues,
    v_clearance_check.lab5_issues,
    CURRENT_DATE + INTERVAL '30 days',
    NOW()
  ) RETURNING id INTO v_request_id;
  
  -- Create notification
  INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    p_user_id,
    'clearance_submitted',
    'Clearance Request Submitted',
    CASE 
      WHEN v_clearance_check.overall_cleared THEN 'Your clearance request has been automatically approved. All labs are cleared.'
      ELSE format('Your clearance request has been submitted. Total outstanding amount: $%.2f', v_clearance_check.total_unpaid_amount)
    END,
    'clearance_request',
    v_request_id
  );
  
  RETURN v_request_id;
END;
$$;

-- =====================================================
-- APPROVE LAB CLEARANCE (Individual Lab Approval)
-- =====================================================

CREATE OR REPLACE FUNCTION central.approve_lab_clearance(
  p_request_id UUID,
  p_lab_schema VARCHAR,
  p_reviewer_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_all_cleared BOOLEAN;
BEGIN
  -- Get request user
  SELECT user_id INTO v_user_id FROM central.clearance_requests WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Clearance request not found';
  END IF;
  
  -- Update the specific lab status
  CASE p_lab_schema
    WHEN 'lab1' THEN
      UPDATE central.clearance_requests 
      SET lab1_status = 'cleared', lab1_reviewed_by = p_reviewer_id, lab1_reviewed_at = NOW(), lab1_notes = COALESCE(p_notes, lab1_notes)
      WHERE id = p_request_id;
    WHEN 'lab2' THEN
      UPDATE central.clearance_requests 
      SET lab2_status = 'cleared', lab2_reviewed_by = p_reviewer_id, lab2_reviewed_at = NOW(), lab2_notes = COALESCE(p_notes, lab2_notes)
      WHERE id = p_request_id;
    WHEN 'lab3' THEN
      UPDATE central.clearance_requests 
      SET lab3_status = 'cleared', lab3_reviewed_by = p_reviewer_id, lab3_reviewed_at = NOW(), lab3_notes = COALESCE(p_notes, lab3_notes)
      WHERE id = p_request_id;
    WHEN 'lab4' THEN
      UPDATE central.clearance_requests 
      SET lab4_status = 'cleared', lab4_reviewed_by = p_reviewer_id, lab4_reviewed_at = NOW(), lab4_notes = COALESCE(p_notes, lab4_notes)
      WHERE id = p_request_id;
    WHEN 'lab5' THEN
      UPDATE central.clearance_requests 
      SET lab5_status = 'cleared', lab5_reviewed_by = p_reviewer_id, lab5_reviewed_at = NOW(), lab5_notes = COALESCE(p_notes, lab5_notes)
      WHERE id = p_request_id;
  END CASE;
  
  -- Check if all labs are cleared
  SELECT 
    (lab1_status = 'cleared' AND lab2_status = 'cleared' AND lab3_status = 'cleared' AND lab4_status = 'cleared' AND lab5_status = 'cleared')
  INTO v_all_cleared
  FROM central.clearance_requests WHERE id = p_request_id;
  
  -- If all cleared, update overall status
  IF v_all_cleared THEN
    UPDATE central.clearance_requests
    SET status = 'approved', final_approved_by = p_reviewer_id, final_approved_at = NOW()
    WHERE id = p_request_id;
    
    -- Create notification
    INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
    VALUES (
      v_user_id,
      'clearance_approved',
      'Clearance Approved',
      'Congratulations! Your clearance request has been fully approved. You can now generate your clearance certificate.',
      'clearance_request',
      p_request_id
    );
  ELSE
    -- Create notification for individual lab clearance
    INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
    VALUES (
      v_user_id,
      'lab_cleared',
      format('%s Cleared', UPPER(p_lab_schema)),
      format('Your clearance for %s has been approved.', UPPER(p_lab_schema)),
      'clearance_request',
      p_request_id
    );
  END IF;
  
  RETURN true;
END;
$$;

-- =====================================================
-- REJECT LAB CLEARANCE
-- =====================================================

CREATE OR REPLACE FUNCTION central.reject_lab_clearance(
  p_request_id UUID,
  p_lab_schema VARCHAR,
  p_reviewer_id UUID,
  p_rejection_notes TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM central.clearance_requests WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Clearance request not found';
  END IF;
  
  CASE p_lab_schema
    WHEN 'lab1' THEN
      UPDATE central.clearance_requests 
      SET lab1_status = 'issues_found', lab1_reviewed_by = p_reviewer_id, lab1_reviewed_at = NOW(), lab1_notes = p_rejection_notes
      WHERE id = p_request_id;
    WHEN 'lab2' THEN
      UPDATE central.clearance_requests 
      SET lab2_status = 'issues_found', lab2_reviewed_by = p_reviewer_id, lab2_reviewed_at = NOW(), lab2_notes = p_rejection_notes
      WHERE id = p_request_id;
    WHEN 'lab3' THEN
      UPDATE central.clearance_requests 
      SET lab3_status = 'issues_found', lab3_reviewed_by = p_reviewer_id, lab3_reviewed_at = NOW(), lab3_notes = p_rejection_notes
      WHERE id = p_request_id;
    WHEN 'lab4' THEN
      UPDATE central.clearance_requests 
      SET lab4_status = 'issues_found', lab4_reviewed_by = p_reviewer_id, lab4_reviewed_at = NOW(), lab4_notes = p_rejection_notes
      WHERE id = p_request_id;
    WHEN 'lab5' THEN
      UPDATE central.clearance_requests 
      SET lab5_status = 'issues_found', lab5_reviewed_by = p_reviewer_id, lab5_reviewed_at = NOW(), lab5_notes = p_rejection_notes
      WHERE id = p_request_id;
  END CASE;
  
  -- Create notification
  INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    v_user_id,
    'clearance_rejected',
    format('%s Clearance Rejected', UPPER(p_lab_schema)),
    format('Your clearance for %s was not approved. Reason: %s', UPPER(p_lab_schema), p_rejection_notes),
    'clearance_request',
    p_request_id
  );
  
  RETURN true;
END;
$$;

-- =====================================================
-- GENERATE CLEARANCE CERTIFICATE
-- =====================================================

CREATE OR REPLACE FUNCTION central.generate_clearance_certificate(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_user RECORD;
  v_certificate JSONB;
  v_certificate_number VARCHAR;
BEGIN
  -- Get request details
  SELECT * INTO v_request FROM central.clearance_requests WHERE id = p_request_id;
  
  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Clearance request not found';
  END IF;
  
  IF v_request.status != 'approved' THEN
    RAISE EXCEPTION 'Clearance request is not approved';
  END IF;
  
  -- Get user details
  SELECT * INTO v_user FROM central.users WHERE id = v_request.user_id;
  
  -- Generate certificate number
  v_certificate_number := 'ECMS-' || TO_CHAR(NOW(), 'YYYY') || '-' || SUBSTRING(p_request_id::TEXT, 1, 8);
  
  -- Build certificate data
  v_certificate := jsonb_build_object(
    'certificate_number', v_certificate_number,
    'student_name', v_user.full_name,
    'student_email', v_user.email,
    'student_id', v_user.student_id,
    'request_type', v_request.request_type,
    'issue_date', CURRENT_DATE,
    'valid_until', v_request.valid_until,
    'labs_cleared', jsonb_build_object(
      'lab1', jsonb_build_object('status', 'cleared', 'cleared_at', v_request.lab1_reviewed_at),
      'lab2', jsonb_build_object('status', 'cleared', 'cleared_at', v_request.lab2_reviewed_at),
      'lab3', jsonb_build_object('status', 'cleared', 'cleared_at', v_request.lab3_reviewed_at),
      'lab4', jsonb_build_object('status', 'cleared', 'cleared_at', v_request.lab4_reviewed_at),
      'lab5', jsonb_build_object('status', 'cleared', 'cleared_at', v_request.lab5_reviewed_at)
    ),
    'approved_by', v_request.final_approved_by,
    'approved_at', v_request.final_approved_at,
    'verification_hash', MD5(p_request_id::TEXT || v_certificate_number || v_user.id::TEXT)
  );
  
  -- Update request with certificate info
  UPDATE central.clearance_requests
  SET 
    certificate_url = v_certificate_number,
    certificate_generated_at = NOW()
  WHERE id = p_request_id;
  
  -- Create notification
  INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    v_request.user_id,
    'certificate_generated',
    'Clearance Certificate Generated',
    format('Your clearance certificate (%s) has been generated and is ready for download.', v_certificate_number),
    'clearance_request',
    p_request_id
  );
  
  RETURN v_certificate;
END;
$$;

-- =====================================================
-- VALIDATE CLEARANCE CERTIFICATE
-- =====================================================

CREATE OR REPLACE FUNCTION central.validate_certificate(p_certificate_number VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_user RECORD;
  v_is_valid BOOLEAN;
BEGIN
  SELECT * INTO v_request FROM central.clearance_requests 
  WHERE certificate_url = p_certificate_number;
  
  IF v_request IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Certificate not found'
    );
  END IF;
  
  SELECT * INTO v_user FROM central.users WHERE id = v_request.user_id;
  
  v_is_valid := v_request.status = 'approved' AND v_request.valid_until >= CURRENT_DATE;
  
  RETURN jsonb_build_object(
    'valid', v_is_valid,
    'certificate_number', p_certificate_number,
    'student_name', v_user.full_name,
    'student_email', v_user.email,
    'request_type', v_request.request_type,
    'issue_date', v_request.certificate_generated_at::DATE,
    'valid_until', v_request.valid_until,
    'expired', v_request.valid_until < CURRENT_DATE
  );
END;
$$;

-- =====================================================
-- INTER-LAB TRANSFER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION central.request_equipment_transfer(
  p_equipment_id UUID,
  p_source_lab VARCHAR,
  p_destination_lab VARCHAR,
  p_requested_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_id UUID;
  v_equipment_code VARCHAR;
  v_equipment_name VARCHAR;
  v_equipment_data JSONB;
  v_equipment_status VARCHAR;
BEGIN
  -- Validate labs are different
  IF p_source_lab = p_destination_lab THEN
    RAISE EXCEPTION 'Source and destination labs must be different';
  END IF;
  
  -- Get equipment details based on source lab
  CASE p_source_lab
    WHEN 'lab1' THEN
      SELECT equipment_code, equipment_name, status, to_jsonb(lab1.inventory.*) 
      INTO v_equipment_code, v_equipment_name, v_equipment_status, v_equipment_data
      FROM lab1.inventory WHERE id = p_equipment_id;
    WHEN 'lab2' THEN
      SELECT equipment_code, equipment_name, status, to_jsonb(lab2.inventory.*)
      INTO v_equipment_code, v_equipment_name, v_equipment_status, v_equipment_data
      FROM lab2.inventory WHERE id = p_equipment_id;
    WHEN 'lab3' THEN
      SELECT equipment_code, equipment_name, status, to_jsonb(lab3.inventory.*)
      INTO v_equipment_code, v_equipment_name, v_equipment_status, v_equipment_data
      FROM lab3.inventory WHERE id = p_equipment_id;
    WHEN 'lab4' THEN
      SELECT equipment_code, equipment_name, status, to_jsonb(lab4.inventory.*)
      INTO v_equipment_code, v_equipment_name, v_equipment_status, v_equipment_data
      FROM lab4.inventory WHERE id = p_equipment_id;
    WHEN 'lab5' THEN
      SELECT equipment_code, equipment_name, status, to_jsonb(lab5.inventory.*)
      INTO v_equipment_code, v_equipment_name, v_equipment_status, v_equipment_data
      FROM lab5.inventory WHERE id = p_equipment_id;
  END CASE;
  
  IF v_equipment_code IS NULL THEN
    RAISE EXCEPTION 'Equipment not found in source lab';
  END IF;
  
  IF v_equipment_status != 'available' THEN
    RAISE EXCEPTION 'Equipment must be available for transfer (current status: %)', v_equipment_status;
  END IF;
  
  -- Create transfer request
  INSERT INTO central.equipment_transfers (
    equipment_id,
    source_lab,
    destination_lab,
    equipment_code,
    equipment_name,
    equipment_data,
    requested_by,
    transfer_notes
  ) VALUES (
    p_equipment_id,
    p_source_lab,
    p_destination_lab,
    v_equipment_code,
    v_equipment_name,
    v_equipment_data,
    p_requested_by,
    p_notes
  ) RETURNING id INTO v_transfer_id;
  
  -- Create notification
  INSERT INTO central.notifications (user_id, notification_type, title, message, related_entity_type, related_entity_id)
  VALUES (
    p_requested_by,
    'transfer_request',
    'Equipment Transfer Requested',
    format('Transfer request created for %s from %s to %s', v_equipment_name, UPPER(p_source_lab), UPPER(p_destination_lab)),
    'transfer',
    v_transfer_id
  );
  
  RETURN v_transfer_id;
END;
$$;

-- =====================================================
-- COMPLETE EQUIPMENT TRANSFER
-- =====================================================

CREATE OR REPLACE FUNCTION central.complete_equipment_transfer(
  p_transfer_id UUID,
  p_approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer RECORD;
  v_new_equipment_id UUID := gen_random_uuid();
BEGIN
  SELECT * INTO v_transfer FROM central.equipment_transfers WHERE id = p_transfer_id;
  
  IF v_transfer IS NULL THEN
    RAISE EXCEPTION 'Transfer request not found';
  END IF;
  
  IF v_transfer.status != 'pending' THEN
    RAISE EXCEPTION 'Transfer is not in pending status';
  END IF;
  
  -- Delete from source lab
  CASE v_transfer.source_lab
    WHEN 'lab1' THEN DELETE FROM lab1.inventory WHERE id = v_transfer.equipment_id;
    WHEN 'lab2' THEN DELETE FROM lab2.inventory WHERE id = v_transfer.equipment_id;
    WHEN 'lab3' THEN DELETE FROM lab3.inventory WHERE id = v_transfer.equipment_id;
    WHEN 'lab4' THEN DELETE FROM lab4.inventory WHERE id = v_transfer.equipment_id;
    WHEN 'lab5' THEN DELETE FROM lab5.inventory WHERE id = v_transfer.equipment_id;
  END CASE;
  
  -- Insert into destination lab
  CASE v_transfer.destination_lab
    WHEN 'lab1' THEN
      INSERT INTO lab1.inventory (id, equipment_code, equipment_name, category, metadata, status, condition, location, notes, created_at)
      VALUES (
        v_new_equipment_id,
        v_transfer.equipment_code,
        v_transfer.equipment_name,
        v_transfer.equipment_data->>'category',
        v_transfer.equipment_data->'metadata',
        'available',
        v_transfer.equipment_data->>'condition',
        format('Transferred from %s', UPPER(v_transfer.source_lab)),
        format('Transferred on %s. Original notes: %s', CURRENT_DATE, v_transfer.equipment_data->>'notes'),
        NOW()
      );
    WHEN 'lab2' THEN
      INSERT INTO lab2.inventory (id, equipment_code, equipment_name, category, metadata, status, condition, location, notes, created_at)
      VALUES (
        v_new_equipment_id,
        v_transfer.equipment_code,
        v_transfer.equipment_name,
        v_transfer.equipment_data->>'category',
        v_transfer.equipment_data->'metadata',
        'available',
        v_transfer.equipment_data->>'condition',
        format('Transferred from %s', UPPER(v_transfer.source_lab)),
        format('Transferred on %s. Original notes: %s', CURRENT_DATE, v_transfer.equipment_data->>'notes'),
        NOW()
      );
    WHEN 'lab3' THEN
      INSERT INTO lab3.inventory (id, equipment_code, equipment_name, category, metadata, status, condition, location, notes, created_at)
      VALUES (
        v_new_equipment_id,
        v_transfer.equipment_code,
        v_transfer.equipment_name,
        v_transfer.equipment_data->>'category',
        v_transfer.equipment_data->'metadata',
        'available',
        v_transfer.equipment_data->>'condition',
        format('Transferred from %s', UPPER(v_transfer.source_lab)),
        format('Transferred on %s. Original notes: %s', CURRENT_DATE, v_transfer.equipment_data->>'notes'),
        NOW()
      );
    WHEN 'lab4' THEN
      INSERT INTO lab4.inventory (id, equipment_code, equipment_name, category, metadata, status, condition, location, notes, created_at)
      VALUES (
        v_new_equipment_id,
        v_transfer.equipment_code,
        v_transfer.equipment_name,
        v_transfer.equipment_data->>'category',
        v_transfer.equipment_data->'metadata',
        'available',
        v_transfer.equipment_data->>'condition',
        format('Transferred from %s', UPPER(v_transfer.source_lab)),
        format('Transferred on %s. Original notes: %s', CURRENT_DATE, v_transfer.equipment_data->>'notes'),
        NOW()
      );
    WHEN 'lab5' THEN
      INSERT INTO lab5.inventory (id, equipment_code, equipment_name, category, metadata, status, condition, location, notes, created_at)
      VALUES (
        v_new_equipment_id,
        v_transfer.equipment_code,
        v_transfer.equipment_name,
        v_transfer.equipment_data->>'category',
        v_transfer.equipment_data->'metadata',
        'available',
        v_transfer.equipment_data->>'condition',
        format('Transferred from %s', UPPER(v_transfer.source_lab)),
        format('Transferred on %s. Original notes: %s', CURRENT_DATE, v_transfer.equipment_data->>'notes'),
        NOW()
      );
  END CASE;
  
  -- Update transfer status
  UPDATE central.equipment_transfers
  SET 
    status = 'completed',
    approved_by = p_approved_by,
    approved_at = NOW(),
    completed_at = NOW()
  WHERE id = p_transfer_id;
  
  -- Log to audit
  INSERT INTO central.audit_logs (table_name, record_id, action, old_data, new_data, changed_by, created_at)
  VALUES (
    'equipment_transfers',
    p_transfer_id,
    'TRANSFER_COMPLETED',
    jsonb_build_object('source_lab', v_transfer.source_lab, 'equipment_id', v_transfer.equipment_id),
    jsonb_build_object('destination_lab', v_transfer.destination_lab, 'new_equipment_id', v_new_equipment_id),
    p_approved_by,
    NOW()
  );
  
  RETURN true;
END;
$$;

-- =====================================================
-- AUTO-EXPIRE OLD CLEARANCE REQUESTS
-- =====================================================

CREATE OR REPLACE FUNCTION central.auto_expire_clearance_requests()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE central.clearance_requests
  SET status = 'expired'
  WHERE status IN ('pending', 'in_review')
  AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$;

-- =====================================================
-- CROSS-LAB REPORT FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION central.get_clearance_report_summary()
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  approved_requests BIGINT,
  rejected_requests BIGINT,
  avg_processing_days NUMERIC,
  requests_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT,
    ROUND(AVG(EXTRACT(DAY FROM (COALESCE(final_approved_at, NOW()) - created_at)))::NUMERIC, 1),
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT
  FROM central.clearance_requests;
END;
$$;

-- =====================================================
-- TRIGGER: AUTO-UPDATE CLEARANCE STATUS
-- =====================================================

CREATE OR REPLACE FUNCTION central.auto_update_clearance_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all labs are cleared
  IF NEW.lab1_status = 'cleared' 
     AND NEW.lab2_status = 'cleared' 
     AND NEW.lab3_status = 'cleared' 
     AND NEW.lab4_status = 'cleared' 
     AND NEW.lab5_status = 'cleared' 
     AND NEW.status != 'approved' THEN
    NEW.status := 'approved';
    NEW.final_approved_at := NOW();
  END IF;
  
  -- If any lab has issues and we're not already rejected, set to in_review
  IF (NEW.lab1_status = 'issues_found' 
      OR NEW.lab2_status = 'issues_found' 
      OR NEW.lab3_status = 'issues_found' 
      OR NEW.lab4_status = 'issues_found' 
      OR NEW.lab5_status = 'issues_found')
     AND NEW.status = 'pending' THEN
    NEW.status := 'in_review';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_clearance ON central.clearance_requests;
CREATE TRIGGER trigger_auto_update_clearance
  BEFORE UPDATE ON central.clearance_requests
  FOR EACH ROW
  EXECUTE FUNCTION central.auto_update_clearance_status();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify central functions
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'central'
AND routine_name LIKE '%clearance%' OR routine_name LIKE '%transfer%' OR routine_name LIKE '%certificate%'
ORDER BY routine_name;

-- Verify triggers on clearance_requests
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'clearance_requests'
ORDER BY trigger_name;
