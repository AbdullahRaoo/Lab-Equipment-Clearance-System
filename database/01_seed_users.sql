-- =====================================================
-- Seed Users Script (NUTECH Edition)
-- Creates HOD, Pro HOD, Incharges, Assistants, and Students
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper to create user and update profile
CREATE OR REPLACE FUNCTION public.seed_user(
    p_email TEXT,
    p_name TEXT,
    p_role user_role,
    p_lab_code TEXT DEFAULT NULL -- Lab Code (ROBO, DLD, etc.)
) RETURNS VOID AS $$
DECLARE
    v_auth_id UUID := gen_random_uuid();
    v_lab_id UUID;
BEGIN
    -- Get Lab ID if code provided
    IF p_lab_code IS NOT NULL THEN
        SELECT id INTO v_lab_id FROM public.labs WHERE code = p_lab_code;
    END IF;

    -- 1. Create Identity (Trigger will create student profile)
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role
    ) VALUES (
        v_auth_id,
        p_email,
        crypt('password123', gen_salt('bf')), -- Default password
        now(),
        jsonb_build_object('full_name', p_name),
        'authenticated',
        'authenticated'
    );

    -- 2. Update Profile (Upgrade from default student to specific role)
    UPDATE public.profiles
    SET 
        role = p_role,
        assigned_lab_id = v_lab_id, -- Assign specific lab
        reliability_score = CASE WHEN p_role = 'student' THEN 80 ELSE NULL END, -- Start students at 80
        reg_no = CASE WHEN p_role = 'student' THEN 'ST-' || floor(random()*10000)::text ELSE NULL END
    WHERE id = v_auth_id;

    RAISE NOTICE 'Created User: % (%)', p_email, p_role;
END;
$$ LANGUAGE plpgsql;

-- EXECUTE SEEDING
DO $$
BEGIN
    -- Admin Staff
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'hod') THEN
        PERFORM public.seed_user('hod@nutech.edu.pk', 'Dr. System HOD', 'hod');
        PERFORM public.seed_user('prohod@nutech.edu.pk', 'Dr. Pro HOD', 'pro_hod');
    END IF;

    -- Lab Incharges (Heads)
    PERFORM public.seed_user('incharge.robo@nutech.edu.pk', 'Engr. Robo Head', 'lab_incharge', 'ROBO');
    PERFORM public.seed_user('incharge.dld@nutech.edu.pk', 'Engr. DLD Head', 'lab_incharge', 'DLD');
    PERFORM public.seed_user('incharge.iot@nutech.edu.pk', 'Engr. IOT Head', 'lab_incharge', 'IOT');
    PERFORM public.seed_user('incharge.emb@nutech.edu.pk', 'Engr. Embed Head', 'lab_incharge', 'EMB');
    PERFORM public.seed_user('incharge.cnet@nutech.edu.pk', 'Engr. Network Head', 'lab_incharge', 'CNET');

    -- Lab Assistants (Techs)
    PERFORM public.seed_user('assist.robo@nutech.edu.pk', 'Mr. Robo Tech', 'lab_assistant', 'ROBO');
    PERFORM public.seed_user('assist.dld@nutech.edu.pk', 'Mr. DLD Tech', 'lab_assistant', 'DLD');
    
    -- Students
    PERFORM public.seed_user('student1@nutech.edu.pk', 'Ali Khan', 'student');
    PERFORM public.seed_user('student2@nutech.edu.pk', 'Sara Ahmed', 'student');

END $$;

-- Cleanup
DROP FUNCTION public.seed_user;

SELECT email, role, full_name FROM public.profiles ORDER BY role;
