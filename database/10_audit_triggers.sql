-- =====================================================
-- Central Schema Audit Triggers
-- Automatically log all INSERT/UPDATE/DELETE operations
-- =====================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_users_changes ON central.users;
DROP TRIGGER IF EXISTS audit_clearance_requests_changes ON central.clearance_requests;
DROP FUNCTION IF EXISTS central.audit_trigger_function() CASCADE;

-- =====================================================
-- AUDIT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION central.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_action_details JSONB;
BEGIN
    -- Get current authenticated user ID (from auth context)
    v_user_id := auth.uid();
    
    -- Build action details based on operation type
    IF (TG_OP = 'DELETE') THEN
        v_action_details := jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', 'DELETE',
            'old_data', row_to_json(OLD),
            'timestamp', NOW()
        );
        
        -- Log the deletion
        INSERT INTO central.audit_logs (
            action,
            entity_type,
            entity_id,
            user_id,
            schema_name,
            details,
            ip_address,
            user_agent
        ) VALUES (
            'delete_' || TG_TABLE_NAME,
            TG_TABLE_NAME,
            (row_to_json(OLD)->>'id')::TEXT,
            v_user_id,
            TG_TABLE_SCHEMA,
            v_action_details,
            (NULLIF(current_setting('request.headers', true)::json->>'x-real-ip', ''))::inet,
            current_setting('request.headers', true)::json->>'user-agent'
        );
        
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only log if data actually changed
        IF (OLD IS DISTINCT FROM NEW) THEN
            v_action_details := jsonb_build_object(
                'table_name', TG_TABLE_NAME,
                'operation', 'UPDATE',
                'old_data', row_to_json(OLD),
                'new_data', row_to_json(NEW),
                'changed_fields', (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(row_to_json(NEW)::jsonb)
                    WHERE value IS DISTINCT FROM (row_to_json(OLD)::jsonb->key)
                ),
                'timestamp', NOW()
            );
            
            INSERT INTO central.audit_logs (
                action,
                entity_type,
                entity_id,
                user_id,
                schema_name,
                details,
                ip_address,
                user_agent
            ) VALUES (
                'update_' || TG_TABLE_NAME,
                TG_TABLE_NAME,
                (row_to_json(NEW)->>'id')::TEXT,
                v_user_id,
                TG_TABLE_SCHEMA,
                v_action_details,
                (NULLIF(current_setting('request.headers', true)::json->>'x-real-ip', ''))::inet,
                current_setting('request.headers', true)::json->>'user-agent'
            );
        END IF;
        
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_action_details := jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', 'INSERT',
            'new_data', row_to_json(NEW),
            'timestamp', NOW()
        );
        
        INSERT INTO central.audit_logs (
            action,
            entity_type,
            entity_id,
            user_id,
            schema_name,
            details,
            ip_address,
            user_agent
        ) VALUES (
            'create_' || TG_TABLE_NAME,
            TG_TABLE_NAME,
            (row_to_json(NEW)->>'id')::TEXT,
            v_user_id,
            TG_TABLE_SCHEMA,
            v_action_details,
            (NULLIF(current_setting('request.headers', true)::json->>'x-real-ip', ''))::inet,
            current_setting('request.headers', true)::json->>'user-agent'
        );
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- =====================================================
-- CREATE TRIGGERS ON CENTRAL SCHEMA TABLES
-- =====================================================

-- Users table audit trigger
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON central.users
    FOR EACH ROW
    EXECUTE FUNCTION central.audit_trigger_function();

-- Clearance requests table audit trigger
CREATE TRIGGER audit_clearance_requests_changes
    AFTER INSERT OR UPDATE OR DELETE ON central.clearance_requests
    FOR EACH ROW
    EXECUTE FUNCTION central.audit_trigger_function();

-- Note: clearance_items trigger will be added in Stage 2

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION central.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create updated_at triggers for all central tables
DROP TRIGGER IF EXISTS set_updated_at ON central.users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON central.users
    FOR EACH ROW
    EXECUTE FUNCTION central.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at ON central.clearance_requests;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON central.clearance_requests
    FOR EACH ROW
    EXECUTE FUNCTION central.update_updated_at_column();

-- Note: clearance_items updated_at trigger will be added in Stage 2

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION central.audit_trigger_function() IS 
'Automatically logs all INSERT/UPDATE/DELETE operations to audit_logs table';

COMMENT ON FUNCTION central.update_updated_at_column() IS 
'Automatically updates the updated_at timestamp on row modifications';

COMMENT ON TRIGGER audit_users_changes ON central.users IS 
'Audit trigger for users table - logs all changes';

COMMENT ON TRIGGER audit_clearance_requests_changes ON central.clearance_requests IS 
'Audit trigger for clearance_requests table - logs all changes';
