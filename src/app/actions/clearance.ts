'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  ClearanceRequest, 
  ClearanceEligibility, 
  ClearanceRequestDetails,
  BorrowedEquipmentAllLabs,
  UnpaidIssueAllLabs,
  CrossLabStatistics,
  ClearanceReportSummary,
  LabSchema,
  LabClearanceStatus,
  ClearanceRequestType
} from '@/types/clearance';

// =====================================================
// Create Clearance Request
// =====================================================
export async function createClearanceRequest(
  requestType: ClearanceRequestType,
  reason?: string
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'User profile not found' };
    }
    
    // Call the stored procedure
    const { data, error } = await supabase.rpc('create_clearance_request', {
      p_user_id: profile.id,
      p_request_type: requestType,
      p_reason: reason || null
    });
    
    if (error) {
      console.error('Error creating clearance request:', error);
      return { error: error.message };
    }
    
    return { data: data as string }; // Returns UUID
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to create clearance request' };
  }
}

// =====================================================
// Get Clearance Request Details
// =====================================================
export async function getClearanceRequestDetails(requestId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_clearance_request_details', {
      p_request_id: requestId
    });
    
    if (error) {
      console.error('Error fetching clearance request details:', error);
      return { error: error.message };
    }
    
    return { data: data[0] as ClearanceRequestDetails };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch clearance request details' };
  }
}

// =====================================================
// Get User's Latest Clearance Request
// =====================================================
export async function getUserLatestClearanceRequest() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'User profile not found' };
    }
    
    const { data, error } = await supabase.rpc('get_user_latest_clearance_request', {
      p_user_id: profile.id
    });
    
    if (error) {
      console.error('Error fetching latest clearance request:', error);
      return { error: error.message };
    }
    
    return { data: data[0] as ClearanceRequest | null };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch latest clearance request' };
  }
}

// =====================================================
// Update Lab Clearance Status
// =====================================================
export async function updateLabClearanceStatus(
  requestId: string,
  labSchema: LabSchema,
  status: LabClearanceStatus,
  notes?: string
) {
  try {
    const supabase = await createClient();
    
    // Get current user (must be admin or lab_admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }
    
    // Get user profile and verify role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return { error: 'User profile not found' };
    }
    
    if (!['admin', 'lab_admin'].includes(profile.role)) {
      return { error: 'Insufficient permissions' };
    }
    
    // Call the stored procedure
    const { data, error } = await supabase.rpc('update_lab_clearance_status', {
      p_request_id: requestId,
      p_lab_schema: labSchema,
      p_status: status,
      p_notes: notes || null,
      p_reviewer_id: profile.id
    });
    
    if (error) {
      console.error('Error updating lab clearance status:', error);
      return { error: error.message };
    }
    
    return { data: data as boolean }; // Returns true if all labs are cleared
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to update lab clearance status' };
  }
}

// =====================================================
// Check User Clearance Eligibility
// =====================================================
export async function checkUserClearanceEligibility(userId?: string) {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    
    // If no userId provided, get current user
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: 'Unauthorized' };
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (profileError || !profile) {
        return { error: 'User profile not found' };
      }
      
      targetUserId = profile.id;
    }
    
    const { data, error } = await supabase.rpc('check_user_clearance_eligibility', {
      p_user_id: targetUserId
    });
    
    if (error) {
      console.error('Error checking clearance eligibility:', error);
      return { error: error.message };
    }
    
    return { data: data as ClearanceEligibility[] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to check clearance eligibility' };
  }
}

// =====================================================
// Get All User Borrowed Equipment
// =====================================================
export async function getAllUserBorrowedEquipment(userId?: string) {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: 'Unauthorized' };
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (profileError || !profile) {
        return { error: 'User profile not found' };
      }
      
      targetUserId = profile.id;
    }
    
    const { data, error } = await supabase.rpc('get_all_user_borrowed_equipment', {
      p_user_id: targetUserId
    });
    
    if (error) {
      console.error('Error fetching borrowed equipment:', error);
      return { error: error.message };
    }
    
    return { data: data as BorrowedEquipmentAllLabs[] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch borrowed equipment' };
  }
}

// =====================================================
// Get All User Unpaid Issues
// =====================================================
export async function getAllUserUnpaidIssues(userId?: string) {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    
    if (!targetUserId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { error: 'Unauthorized' };
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      
      if (profileError || !profile) {
        return { error: 'User profile not found' };
      }
      
      targetUserId = profile.id;
    }
    
    const { data, error } = await supabase.rpc('get_all_user_unpaid_issues', {
      p_user_id: targetUserId
    });
    
    if (error) {
      console.error('Error fetching unpaid issues:', error);
      return { error: error.message };
    }
    
    return { data: data as UnpaidIssueAllLabs[] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch unpaid issues' };
  }
}

// =====================================================
// Get Cross-Lab Statistics
// =====================================================
export async function getCrossLabStatistics() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.rpc('get_cross_lab_statistics');
    
    if (error) {
      console.error('Error fetching cross-lab statistics:', error);
      return { error: error.message };
    }
    
    return { data: data as CrossLabStatistics[] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch cross-lab statistics' };
  }
}

// =====================================================
// Get Active Clearance Requests (Admin View)
// =====================================================
export async function getActiveClearanceRequests() {
  try {
    const supabase = await createClient();
    
    // Verify user is admin or lab_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError || !profile || !['admin', 'lab_admin'].includes(profile.role)) {
      return { error: 'Insufficient permissions' };
    }
    
    const { data, error } = await supabase
      .from('active_clearance_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching active clearance requests:', error);
      return { error: error.message };
    }
    
    return { data };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to fetch active clearance requests' };
  }
}

// =====================================================
// Generate Clearance Report Summary
// =====================================================
export async function generateClearanceReportSummary(
  startDate?: string,
  endDate?: string
) {
  try {
    const supabase = await createClient();
    
    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'admin') {
      return { error: 'Insufficient permissions' };
    }
    
    const { data, error } = await supabase.rpc('generate_clearance_report_summary', {
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });
    
    if (error) {
      console.error('Error generating clearance report:', error);
      return { error: error.message };
    }
    
    return { data: data[0] as ClearanceReportSummary };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'Failed to generate clearance report' };
  }
}
