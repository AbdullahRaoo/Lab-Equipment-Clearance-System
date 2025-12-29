-- =====================================================
-- Public Schema RPC Wrappers for Central Schema Functions
-- These allow Supabase client to call central schema functions
-- =====================================================

-- Wrapper for create_user_profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_auth_id UUID,
  p_email VARCHAR,
  p_full_name VARCHAR,
  p_role VARCHAR,
  p_department VARCHAR DEFAULT NULL,
  p_student_id VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN central.create_user_profile(
    p_auth_id,
    p_email,
    p_full_name,
    p_role,
    p_department,
    p_student_id
  );
END;
$$;

-- Wrapper for get_user_by_auth_id
CREATE OR REPLACE FUNCTION public.get_user_by_auth_id(p_auth_id UUID)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  department VARCHAR,
  student_id VARCHAR,
  phone VARCHAR,
  assigned_labs TEXT[],
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM central.get_user_by_auth_id(p_auth_id);
END;
$$;

-- Wrapper for log_action
CREATE OR REPLACE FUNCTION public.log_action(
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id VARCHAR DEFAULT NULL,
  p_schema_name VARCHAR DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM central.log_action(
    p_action,
    p_entity_type,
    p_entity_id,
    p_schema_name,
    p_details
  );
END;
$$;
