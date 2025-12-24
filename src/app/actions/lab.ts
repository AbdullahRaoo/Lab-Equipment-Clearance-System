'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { LabSchema } from '@/types/lab';

// =====================================================
// INVENTORY ACTIONS
// =====================================================

export async function getLabInventory(lab: LabSchema) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from(`${lab}.inventory`)
    .select('*')
    .order('equipment_name');
  
  if (error) {
    console.error('Error fetching inventory:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function searchEquipment(
  lab: LabSchema,
  searchTerm?: string,
  category?: string,
  status?: string,
  metadataFilter?: Record<string, any>
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.search_equipment`, {
    p_search_term: searchTerm || null,
    p_category: category || null,
    p_status: status || null,
    p_metadata_filter: metadataFilter ? JSON.stringify(metadataFilter) : null,
  });
  
  if (error) {
    console.error('Error searching equipment:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function getAvailableEquipment(lab: LabSchema) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.get_available_equipment`);
  
  if (error) {
    console.error('Error fetching available equipment:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function checkEquipmentAvailability(lab: LabSchema, equipmentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.check_equipment_availability`, {
    p_equipment_id: equipmentId,
  });
  
  if (error) {
    console.error('Error checking availability:', error);
    return { error: error.message };
  }
  
  return { data: data?.[0] };
}

export async function borrowEquipment(
  lab: LabSchema,
  equipmentId: string,
  userId: string,
  expectedReturnDate: string
) {
  const supabase = await createClient();
  
  // Check if equipment is available
  const availCheck = await checkEquipmentAvailability(lab, equipmentId);
  if (availCheck.error || !availCheck.data?.is_available) {
    return { error: 'Equipment is not available' };
  }
  
  const { error } = await supabase
    .from(`${lab}.inventory`)
    .update({
      borrowed_by: userId,
      expected_return_date: expectedReturnDate,
    })
    .eq('id', equipmentId);
  
  if (error) {
    console.error('Error borrowing equipment:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}`);
  return { success: true };
}

export async function getUserBorrowedEquipment(lab: LabSchema, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.get_user_borrowed_equipment`, {
    p_user_id: userId,
  });
  
  if (error) {
    console.error('Error fetching borrowed equipment:', error);
    return { error: error.message };
  }
  
  return { data };
}

// =====================================================
// ISSUE ACTIONS
// =====================================================

export async function registerIssue(
  lab: LabSchema,
  equipmentId: string,
  reportedBy: string,
  issueType: string,
  severity: string,
  title: string,
  description: string,
  attachments?: any[]
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.register_issue`, {
    p_equipment_id: equipmentId,
    p_reported_by: reportedBy,
    p_issue_type: issueType,
    p_severity: severity,
    p_title: title,
    p_description: description,
    p_attachments: attachments ? JSON.stringify(attachments) : '[]',
  });
  
  if (error) {
    console.error('Error registering issue:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}/issues`);
  return { data };
}

export async function getLabIssues(lab: LabSchema, status?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from(`${lab}.issues`)
    .select('*, equipment:equipment_id(*), reporter:reported_by(*)')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching issues:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function updateIssueStatus(
  lab: LabSchema,
  issueId: string,
  status: string,
  resolutionNotes?: string
) {
  const supabase = await createClient();
  
  const updateData: any = { status };
  
  if (status === 'resolved' || status === 'closed') {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    updateData.resolved_by = user?.id;
    updateData.resolved_at = new Date().toISOString();
    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }
  }
  
  const { error } = await supabase
    .from(`${lab}.issues`)
    .update(updateData)
    .eq('id', issueId);
  
  if (error) {
    console.error('Error updating issue:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}/issues`);
  return { success: true };
}

// =====================================================
// RETURN ACTIONS
// =====================================================

export async function processReturn(
  lab: LabSchema,
  equipmentId: string,
  userId: string,
  conditionOnReturn: string,
  conditionNotes?: string
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc(`${lab}.process_return`, {
    p_equipment_id: equipmentId,
    p_user_id: userId,
    p_condition_on_return: conditionOnReturn,
    p_condition_notes: conditionNotes || null,
  });
  
  if (error) {
    console.error('Error processing return:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}`);
  revalidatePath(`/labs/${lab}/returns`);
  return { data };
}

export async function getLabReturns(lab: LabSchema, userId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from(`${lab}.returns`)
    .select('*, equipment:equipment_id(*), user:user_id(*)')
    .order('returned_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching returns:', error);
    return { error: error.message };
  }
  
  return { data };
}

export async function verifyReturn(
  lab: LabSchema,
  returnId: string,
  verifierId: string,
  status: string,
  verificationNotes?: string,
  penaltyAmount?: number,
  penaltyReason?: string
) {
  const supabase = await createClient();
  
  const updateData: any = {
    status,
    verified_by: verifierId,
    verified_at: new Date().toISOString(),
    verification_notes: verificationNotes || null,
  };
  
  if (penaltyAmount && penaltyAmount > 0) {
    updateData.penalty_applied = true;
    updateData.penalty_amount = penaltyAmount;
    updateData.penalty_reason = penaltyReason || null;
  }
  
  const { error } = await supabase
    .from(`${lab}.returns`)
    .update(updateData)
    .eq('id', returnId);
  
  if (error) {
    console.error('Error verifying return:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}/returns`);
  return { success: true };
}

// =====================================================
// EQUIPMENT MANAGEMENT (Admin Only)
// =====================================================

export async function addEquipment(
  lab: LabSchema,
  equipmentData: {
    equipment_code: string;
    equipment_name: string;
    category: string;
    metadata: Record<string, any>;
    location?: string;
    condition?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from(`${lab}.inventory`)
    .insert({
      ...equipmentData,
      status: 'available',
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding equipment:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}`);
  return { data };
}

export async function updateEquipment(
  lab: LabSchema,
  equipmentId: string,
  updateData: Partial<{
    equipment_name: string;
    category: string;
    metadata: Record<string, any>;
    location: string;
    condition: string;
    notes: string;
    status: string;
  }>
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from(`${lab}.inventory`)
    .update(updateData)
    .eq('id', equipmentId);
  
  if (error) {
    console.error('Error updating equipment:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}`);
  return { success: true };
}

export async function deleteEquipment(lab: LabSchema, equipmentId: string) {
  const supabase = await createClient();
  
  // Soft delete by setting status to retired
  const { error } = await supabase
    .from(`${lab}.inventory`)
    .update({ status: 'retired' })
    .eq('id', equipmentId);
  
  if (error) {
    console.error('Error deleting equipment:', error);
    return { error: error.message };
  }
  
  revalidatePath(`/labs/${lab}`);
  return { success: true };
}
