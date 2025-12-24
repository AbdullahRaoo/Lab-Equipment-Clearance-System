-- =====================================================
-- ECMS Clearance Request RLS & Helper Functions (M4 Task)
-- =====================================================

-- Enable RLS on clearance requests
ALTER TABLE central.clearance_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR CLEARANCE REQUESTS
-- =====================================================

-- Policy: Users can view their own clearance requests
CREATE POLICY "Users can view own clearance requests"
  ON central.clearance_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Admins and lab admins can view all clearance requests
CREATE POLICY "Admins can view all clearance requests"
  ON central.clearance_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'lab_admin')
    )
  );

-- Policy: Users can create their own clearance requests
CREATE POLICY "Users can create clearance requests"
  ON central.clearance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM central.users WHERE auth_id = auth.uid())
  );

-- Policy: Lab admins can update clearance requests for their labs
CREATE POLICY "Lab admins can update clearance requests"
  ON central.clearance_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM central.users
      WHERE auth_id = auth.uid()
      AND (role = 'admin' OR role = 'lab_admin')
    )
  );

-- Policy: Admins can delete clearance requests
CREATE POLICY "Admins can delete clearance requests"
  ON central.clearance_requests
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
-- FUNCTION: Create Clearance Request
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
  v_eligibility RECORD;
  v_has_issues BOOLEAN := false;
BEGIN
  -- Check if user already has a pending request
  IF EXISTS(
    SELECT 1 FROM central.clearance_requests
    WHERE user_id = p_user_id
    AND status IN ('pending', 'in_review')
  ) THEN
    RAISE EXCEPTION 'User already has a pending clearance request';
  END IF;
  
  -- Create the request
  INSERT INTO central.clearance_requests (
    user_id,
    request_type,
    reason,
    status,
    valid_until
  ) VALUES (
    p_user_id,
    p_request_type,
    p_reason,
    'pending',
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id INTO v_request_id;
  
  -- Perform initial eligibility check and update lab statuses
  FOR v_eligibility IN 
    SELECT * FROM central.check_user_clearance_eligibility(p_user_id)
  LOOP
    IF NOT v_eligibility.is_eligible THEN
      v_has_issues := true;
    END IF;
    
    -- Update individual lab status based on eligibility
    CASE v_eligibility.lab_schema
      WHEN 'lab1' THEN
        UPDATE central.clearance_requests
        SET lab1_status = CASE WHEN v_eligibility.is_eligible THEN 'cleared' ELSE 'issues_found' END
        WHERE id = v_request_id;
      WHEN 'lab2' THEN
        UPDATE central.clearance_requests
        SET lab2_status = CASE WHEN v_eligibility.is_eligible THEN 'cleared' ELSE 'issues_found' END
        WHERE id = v_request_id;
      WHEN 'lab3' THEN
        UPDATE central.clearance_requests
        SET lab3_status = CASE WHEN v_eligibility.is_eligible THEN 'cleared' ELSE 'issues_found' END
        WHERE id = v_request_id;
      WHEN 'lab4' THEN
        UPDATE central.clearance_requests
        SET lab4_status = CASE WHEN v_eligibility.is_eligible THEN 'cleared' ELSE 'issues_found' END
        WHERE id = v_request_id;
      WHEN 'lab5' THEN
        UPDATE central.clearance_requests
        SET lab5_status = CASE WHEN v_eligibility.is_eligible THEN 'cleared' ELSE 'issues_found' END
        WHERE id = v_request_id;
    END CASE;
  END LOOP;
  
  -- Update overall status
  IF NOT v_has_issues THEN
    UPDATE central.clearance_requests
    SET status = 'approved'
    WHERE id = v_request_id;
  ELSE
    UPDATE central.clearance_requests
    SET status = 'in_review'
    WHERE id = v_request_id;
  END IF;
  
  -- Log the action
  PERFORM central.log_action(
    'create_clearance_request',
    'clearance_request',
    v_request_id::VARCHAR,
    NULL,
    jsonb_build_object('request_type', p_request_type)
  );
  
  RETURN v_request_id;
END;
$$;

-- =====================================================
-- FUNCTION: Update Lab Clearance Status
-- =====================================================
CREATE OR REPLACE FUNCTION central.update_lab_clearance_status(
  p_request_id UUID,
  p_lab_schema VARCHAR,
  p_status VARCHAR,
  p_notes TEXT DEFAULT NULL,
  p_reviewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_all_cleared BOOLEAN;
BEGIN
  -- Validate lab schema
  IF p_lab_schema NOT IN ('lab1', 'lab2', 'lab3', 'lab4', 'lab5') THEN
    RAISE EXCEPTION 'Invalid lab schema';
  END IF;
  
  -- Validate status
  IF p_status NOT IN ('pending', 'cleared', 'issues_found') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  
  -- Update the appropriate lab status
  CASE p_lab_schema
    WHEN 'lab1' THEN
      UPDATE central.clearance_requests
      SET lab1_status = p_status,
          lab1_notes = p_notes,
          lab1_reviewed_by = p_reviewer_id,
          lab1_reviewed_at = NOW()
      WHERE id = p_request_id;
    WHEN 'lab2' THEN
      UPDATE central.clearance_requests
      SET lab2_status = p_status,
          lab2_notes = p_notes,
          lab2_reviewed_by = p_reviewer_id,
          lab2_reviewed_at = NOW()
      WHERE id = p_request_id;
    WHEN 'lab3' THEN
      UPDATE central.clearance_requests
      SET lab3_status = p_status,
          lab3_notes = p_notes,
          lab3_reviewed_by = p_reviewer_id,
          lab3_reviewed_at = NOW()
      WHERE id = p_request_id;
    WHEN 'lab4' THEN
      UPDATE central.clearance_requests
      SET lab4_status = p_status,
          lab4_notes = p_notes,
          lab4_reviewed_by = p_reviewer_id,
          lab4_reviewed_at = NOW()
      WHERE id = p_request_id;
    WHEN 'lab5' THEN
      UPDATE central.clearance_requests
      SET lab5_status = p_status,
          lab5_notes = p_notes,
          lab5_reviewed_by = p_reviewer_id,
          lab5_reviewed_at = NOW()
      WHERE id = p_request_id;
  END CASE;
  
  -- Check if all labs are cleared
  SELECT 
    (lab1_status = 'cleared' AND 
     lab2_status = 'cleared' AND 
     lab3_status = 'cleared' AND 
     lab4_status = 'cleared' AND 
     lab5_status = 'cleared')
  INTO v_all_cleared
  FROM central.clearance_requests
  WHERE id = p_request_id;
  
  -- Update overall status if all cleared
  IF v_all_cleared THEN
    UPDATE central.clearance_requests
    SET status = 'approved',
        final_approved_by = p_reviewer_id,
        final_approved_at = NOW()
    WHERE id = p_request_id;
  END IF;
  
  -- Log the action
  PERFORM central.log_action(
    'update_lab_clearance',
    'clearance_request',
    p_request_id::VARCHAR,
    p_lab_schema,
    jsonb_build_object('status', p_status, 'lab', p_lab_schema)
  );
  
  RETURN v_all_cleared;
END;
$$;

-- =====================================================
-- FUNCTION: Get Clearance Request Details with Full Info
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_clearance_request_details(p_request_id UUID)
RETURNS TABLE (
  request_id UUID,
  user_id UUID,
  user_name VARCHAR,
  user_email VARCHAR,
  status VARCHAR,
  request_type VARCHAR,
  reason TEXT,
  lab1_status VARCHAR,
  lab2_status VARCHAR,
  lab3_status VARCHAR,
  lab4_status VARCHAR,
  lab5_status VARCHAR,
  borrowed_equipment_count BIGINT,
  unpaid_issues_count BIGINT,
  total_unpaid_amount DECIMAL,
  created_at TIMESTAMPTZ,
  valid_until DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.user_id,
    u.full_name,
    u.email,
    cr.status,
    cr.request_type,
    cr.reason,
    cr.lab1_status,
    cr.lab2_status,
    cr.lab3_status,
    cr.lab4_status,
    cr.lab5_status,
    (SELECT COUNT(*) FROM central.get_all_user_borrowed_equipment(cr.user_id))::BIGINT,
    (SELECT COUNT(*) FROM central.get_all_user_unpaid_issues(cr.user_id))::BIGINT,
    (SELECT COALESCE(SUM(total_amount), 0) FROM central.get_all_user_unpaid_issues(cr.user_id)),
    cr.created_at,
    cr.valid_until
  FROM central.clearance_requests cr
  JOIN central.users u ON cr.user_id = u.id
  WHERE cr.id = p_request_id;
END;
$$;

-- =====================================================
-- FUNCTION: Get User's Latest Clearance Request
-- =====================================================
CREATE OR REPLACE FUNCTION central.get_user_latest_clearance_request(p_user_id UUID)
RETURNS TABLE (
  request_id UUID,
  status VARCHAR,
  request_type VARCHAR,
  lab1_status VARCHAR,
  lab2_status VARCHAR,
  lab3_status VARCHAR,
  lab4_status VARCHAR,
  lab5_status VARCHAR,
  created_at TIMESTAMPTZ,
  valid_until DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    clearance_requests.status,
    request_type,
    lab1_status,
    lab2_status,
    lab3_status,
    lab4_status,
    lab5_status,
    clearance_requests.created_at,
    valid_until
  FROM central.clearance_requests
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- FUNCTION: Generate Clearance Report Summary
-- =====================================================
CREATE OR REPLACE FUNCTION central.generate_clearance_report_summary(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_requests BIGINT,
  pending_requests BIGINT,
  approved_requests BIGINT,
  rejected_requests BIGINT,
  in_review_requests BIGINT,
  avg_processing_days NUMERIC
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
    COUNT(*) FILTER (WHERE status = 'in_review')::BIGINT,
    AVG(EXTRACT(DAY FROM (COALESCE(final_approved_at, NOW()) - created_at)))::NUMERIC
  FROM central.clearance_requests
  WHERE (p_start_date IS NULL OR created_at::DATE >= p_start_date)
  AND (p_end_date IS NULL OR created_at::DATE <= p_end_date);
END;
$$;

-- =====================================================
-- VIEW: Active Clearance Requests Summary
-- =====================================================
CREATE OR REPLACE VIEW central.active_clearance_requests AS
SELECT 
  cr.id,
  cr.user_id,
  u.full_name as user_name,
  u.email as user_email,
  u.student_id,
  cr.status,
  cr.request_type,
  cr.lab1_status,
  cr.lab2_status,
  cr.lab3_status,
  cr.lab4_status,
  cr.lab5_status,
  cr.created_at,
  cr.valid_until,
  CASE 
    WHEN cr.lab1_status = 'cleared' AND 
         cr.lab2_status = 'cleared' AND 
         cr.lab3_status = 'cleared' AND 
         cr.lab4_status = 'cleared' AND 
         cr.lab5_status = 'cleared' 
    THEN true 
    ELSE false 
  END as all_labs_cleared
FROM central.clearance_requests cr
JOIN central.users u ON cr.user_id = u.id
WHERE cr.status IN ('pending', 'in_review')
ORDER BY cr.created_at DESC;
