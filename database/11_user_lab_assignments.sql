-- =====================================================
-- User-Lab Assignment System
-- Allows assigning users to specific labs for access control
-- =====================================================

-- Create user_lab_assignments table
CREATE TABLE IF NOT EXISTS central.user_lab_assignments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES central.users(id) ON DELETE CASCADE,
    lab_name VARCHAR(50) NOT NULL CHECK (lab_name IN ('lab1', 'lab2', 'lab3', 'lab4', 'lab5')),
    can_manage BOOLEAN DEFAULT FALSE, -- Can manage lab inventory and approve clearances
    assigned_by UUID REFERENCES central.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, lab_name)
);

-- Create indexes
CREATE INDEX idx_user_lab_assignments_user_id ON central.user_lab_assignments(user_id);
CREATE INDEX idx_user_lab_assignments_lab_name ON central.user_lab_assignments(lab_name);

-- Add RLS policies
ALTER TABLE central.user_lab_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own lab assignments
CREATE POLICY "Users can view their own lab assignments"
    ON central.user_lab_assignments
    FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_id FROM central.users WHERE id = user_id
    ));

-- Admins can view all lab assignments
CREATE POLICY "Admins can view all lab assignments"
    ON central.user_lab_assignments
    FOR SELECT
    USING (auth.uid() IN (
        SELECT auth_id FROM central.users WHERE role = 'admin'
    ));

-- Admins can insert lab assignments
CREATE POLICY "Admins can insert lab assignments"
    ON central.user_lab_assignments
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT auth_id FROM central.users WHERE role = 'admin'
    ));

-- Admins can update lab assignments
CREATE POLICY "Admins can update lab assignments"
    ON central.user_lab_assignments
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT auth_id FROM central.users WHERE role = 'admin'
    ));

-- Admins can delete lab assignments
CREATE POLICY "Admins can delete lab assignments"
    ON central.user_lab_assignments
    FOR DELETE
    USING (auth.uid() IN (
        SELECT auth_id FROM central.users WHERE role = 'admin'
    ));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has access to a specific lab
CREATE OR REPLACE FUNCTION public.user_has_lab_access(
    p_user_id UUID,
    p_lab_name VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role VARCHAR(50);
    v_has_assignment BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM central.users
    WHERE id = p_user_id;
    
    -- Admins have access to all labs
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has explicit lab assignment
    SELECT EXISTS(
        SELECT 1
        FROM central.user_lab_assignments
        WHERE user_id = p_user_id
        AND lab_name = p_lab_name
    ) INTO v_has_assignment;
    
    RETURN v_has_assignment;
END;
$$;

-- Function to check if user can manage a specific lab
CREATE OR REPLACE FUNCTION public.user_can_manage_lab(
    p_user_id UUID,
    p_lab_name VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role VARCHAR(50);
    v_can_manage BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM central.users
    WHERE id = p_user_id;
    
    -- Admins can manage all labs
    IF v_user_role = 'admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Lab admins can manage if they have the assignment with can_manage = true
    IF v_user_role = 'lab_admin' THEN
        SELECT can_manage INTO v_can_manage
        FROM central.user_lab_assignments
        WHERE user_id = p_user_id
        AND lab_name = p_lab_name;
        
        RETURN COALESCE(v_can_manage, FALSE);
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Function to get all labs a user has access to
CREATE OR REPLACE FUNCTION public.get_user_labs(
    p_user_id UUID
)
RETURNS TABLE (
    lab_name VARCHAR(50),
    can_manage BOOLEAN,
    assigned_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role VARCHAR(50);
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM central.users
    WHERE id = p_user_id;
    
    -- Admins have access to all labs with management rights
    IF v_user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            unnest(ARRAY['lab1', 'lab2', 'lab3', 'lab4', 'lab5'])::VARCHAR(50) as lab_name,
            TRUE as can_manage,
            NOW() as assigned_at;
    ELSE
        -- Return user's explicit lab assignments
        RETURN QUERY
        SELECT 
            ula.lab_name,
            ula.can_manage,
            ula.assigned_at
        FROM central.user_lab_assignments ula
        WHERE ula.user_id = p_user_id
        ORDER BY ula.lab_name;
    END IF;
END;
$$;

-- Function to assign user to lab
CREATE OR REPLACE FUNCTION public.assign_user_to_lab(
    p_user_id UUID,
    p_lab_name VARCHAR(50),
    p_can_manage BOOLEAN DEFAULT FALSE,
    p_assigned_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_id INTEGER;
BEGIN
    -- Insert or update lab assignment
    INSERT INTO central.user_lab_assignments (
        user_id,
        lab_name,
        can_manage,
        assigned_by,
        notes
    ) VALUES (
        p_user_id,
        p_lab_name,
        p_can_manage,
        p_assigned_by,
        p_notes
    )
    ON CONFLICT (user_id, lab_name)
    DO UPDATE SET
        can_manage = EXCLUDED.can_manage,
        assigned_by = EXCLUDED.assigned_by,
        notes = EXCLUDED.notes,
        assigned_at = NOW()
    RETURNING id INTO v_assignment_id;
    
    RETURN v_assignment_id;
END;
$$;

-- Function to remove user from lab
CREATE OR REPLACE FUNCTION public.remove_user_from_lab(
    p_user_id UUID,
    p_lab_name VARCHAR(50)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM central.user_lab_assignments
    WHERE user_id = p_user_id
    AND lab_name = p_lab_name;
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE central.user_lab_assignments IS 
'Stores user-to-lab assignments for access control';

COMMENT ON FUNCTION public.user_has_lab_access(UUID, VARCHAR) IS 
'Check if user has access to a specific lab';

COMMENT ON FUNCTION public.user_can_manage_lab(UUID, VARCHAR) IS 
'Check if user can manage a specific lab (approve clearances, manage inventory)';

COMMENT ON FUNCTION public.get_user_labs(UUID) IS 
'Get all labs a user has access to';

COMMENT ON FUNCTION public.assign_user_to_lab(UUID, VARCHAR, BOOLEAN, UUID, TEXT) IS 
'Assign user to a lab with optional management permissions';

COMMENT ON FUNCTION public.remove_user_from_lab(UUID, VARCHAR) IS 
'Remove user from a lab';
