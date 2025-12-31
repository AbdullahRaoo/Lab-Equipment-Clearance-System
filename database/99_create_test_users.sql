-- =====================================================
-- Create Test Users Script
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper function to create user
CREATE OR REPLACE FUNCTION create_test_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_assigned_labs TEXT[] DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_auth_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
BEGIN
  -- Generate hash for password (using bcrypt)
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- 1. Create Identity in auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_auth_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_pw,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Create Profile in central.users
  INSERT INTO central.users (
    auth_id,
    email,
    full_name,
    role,
    assigned_labs,
    student_id
  ) VALUES (
    v_auth_id,
    p_email,
    p_full_name,
    p_role,
    COALESCE(p_assigned_labs, '{}'),
    CASE WHEN p_role = 'student' THEN 'ST-' || floor(random() * 10000)::text ELSE NULL END
  );

  RAISE NOTICE 'Created user % with role %', p_email, p_role;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Execution
-- =====================================================

DO $$
BEGIN
  -- 1. Create Admin User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com') THEN
    PERFORM create_test_user(
      'admin@test.com',
      'password123',
      'System Admin',
      'admin'
    );
  END IF;

  -- 2. Create Lab Admin User (Assigned to Lab 1 & 2)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'labadmin@test.com') THEN
    PERFORM create_test_user(
      'labadmin@test.com',
      'password123',
      'Physics Lab Admin',
      'lab_admin',
      ARRAY['lab1', 'lab2']
    );
  END IF;

  -- 3. Create Student User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@test.com') THEN
    PERFORM create_test_user(
      'student@test.com',
      'password123',
      'John Student',
      'student'
    );
  END IF;

  -- 4. Create Another Student User
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student2@test.com') THEN
    PERFORM create_test_user(
      'student2@test.com',
      'password123',
      'Jane Scholar',
      'student'
    );
  END IF;

END $$;

-- Clean up helper function (optional, kept for reuse)
-- DROP FUNCTION create_test_user;

SELECT email, role, full_name FROM central.users WHERE email LIKE '%@test.com';
