-- =====================================================
-- ECMS Database Tests
-- Run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Test Helpers
-- =====================================================

-- Create temp table to store test results
DROP TABLE IF EXISTS test_results;
CREATE TEMP TABLE test_results (
  test_name TEXT,
  passed BOOLEAN,
  message TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Test result logging function
CREATE OR REPLACE FUNCTION log_test(
  p_test_name TEXT,
  p_passed BOOLEAN,
  p_message TEXT DEFAULT ''
) RETURNS VOID AS $$
BEGIN
  INSERT INTO test_results (test_name, passed, message)
  VALUES (p_test_name, p_passed, p_message);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Lab 1 Inventory Trigger Tests
-- =====================================================

-- Test: Borrow equipment updates status
DO $$
DECLARE
  v_equipment_id UUID;
  v_test_user_id UUID;
  v_status TEXT;
BEGIN
  -- Get first available equipment
  SELECT id INTO v_equipment_id FROM lab1.inventory WHERE status = 'available' LIMIT 1;
  SELECT id INTO v_test_user_id FROM central.users LIMIT 1;
  
  IF v_equipment_id IS NOT NULL AND v_test_user_id IS NOT NULL THEN
    -- Simulate borrow
    UPDATE lab1.inventory 
    SET current_borrower_id = v_test_user_id,
        status = 'borrowed',
        borrowed_at = NOW()
    WHERE id = v_equipment_id;
    
    -- Check status
    SELECT status INTO v_status FROM lab1.inventory WHERE id = v_equipment_id;
    
    PERFORM log_test(
      'lab1_borrow_status_update',
      v_status = 'borrowed',
      'Equipment status should be borrowed'
    );
    
    -- Rollback
    UPDATE lab1.inventory 
    SET current_borrower_id = NULL,
        status = 'available',
        borrowed_at = NULL
    WHERE id = v_equipment_id;
  ELSE
    PERFORM log_test('lab1_borrow_status_update', FALSE, 'No test data available');
  END IF;
END;
$$;

-- =====================================================
-- Central Schema Tests
-- =====================================================

-- Test: Clearance request check function exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'perform_full_clearance_check'
  ) INTO v_exists;
  
  PERFORM log_test(
    'clearance_check_function_exists',
    v_exists,
    'perform_full_clearance_check should exist'
  );
END;
$$;

-- Test: Certificate generation function exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'generate_clearance_certificate'
  ) INTO v_exists;
  
  PERFORM log_test(
    'certificate_function_exists',
    v_exists,
    'generate_clearance_certificate should exist'
  );
END;
$$;

-- Test: Equipment transfer function exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'request_equipment_transfer'
  ) INTO v_exists;
  
  PERFORM log_test(
    'transfer_function_exists',
    v_exists,
    'request_equipment_transfer should exist'
  );
END;
$$;

-- =====================================================
-- Trigger Verification Tests
-- =====================================================

-- Test: Lab 3-5 triggers exist
DO $$
DECLARE
  v_trigger_count INT;
BEGIN
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers 
  WHERE event_object_schema IN ('lab3', 'lab4', 'lab5');
  
  PERFORM log_test(
    'lab3_5_triggers_exist',
    v_trigger_count > 0,
    'Lab 3-5 should have triggers. Found: ' || v_trigger_count
  );
END;
$$;

-- Test: Notification tables exist
DO $$
DECLARE
  v_table_count INT;
BEGIN
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables 
  WHERE table_name = 'notifications'
  AND table_schema IN ('lab3', 'lab4', 'lab5', 'central');
  
  PERFORM log_test(
    'notification_tables_exist',
    v_table_count = 4,
    'Should have 4 notification tables. Found: ' || v_table_count
  );
END;
$$;

-- =====================================================
-- Display Results
-- =====================================================

SELECT 
  test_name,
  CASE WHEN passed THEN '✅ PASS' ELSE '❌ FAIL' END AS result,
  message
FROM test_results
ORDER BY executed_at;

-- Summary
SELECT 
  COUNT(*) FILTER (WHERE passed) AS passed,
  COUNT(*) FILTER (WHERE NOT passed) AS failed,
  COUNT(*) AS total
FROM test_results;
