'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Equipment, Issue, Return } from '@/types/lab';

// =====================================================
// INVENTORY ACTIONS
// =====================================================

export async function getLabInventory(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5') {
  const supabase = await createClient();
  
  // Use schema-qualified query with proper escaping
  const { data, error } = await supabase
    .schema(labSchema)
    .from('inventory')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching ${labSchema} inventory:`, error);
    return { error: error.message };
  }

  return { data: data as Equipment[] };
}

export async function getAvailableEquipment(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5') {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .schema(labSchema)
    .from('inventory')
    .select('*')
    .eq('status', 'available')
    .order('equipment_name');

  if (error) {
    return { error: error.message };
  }

  return { data: data as Equipment[] };
}

export async function getEquipmentById(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5', equipmentId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .schema(labSchema)
    .from('inventory')
    .select('*')
    .eq('id', equipmentId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as Equipment };
}

export async function borrowEquipment(
  labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5',
  equipmentId: string,
  expectedReturnDate: string
) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: 'Not authenticated' };
  }

  const { data: currentUser } = await supabase
    .schema('central')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) {
    return { error: 'User not found' };
  }

  // Update equipment status
  const { error: updateError } = await supabase
    .schema(labSchema)
    .from('inventory')
    .update({
      status: 'borrowed',
      current_borrower_id: currentUser.id,
      borrowed_at: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
    })
    .eq('id', equipmentId)
    .eq('status', 'available');

  if (updateError) {
    return { error: updateError.message };
  }

  // Create return record
  const { error: returnError } = await supabase
    .schema(labSchema)
    .from('returns')
    .insert({
      equipment_id: equipmentId,
      borrower_id: currentUser.id,
      borrowed_date: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
      status: 'pending',
    });

  if (returnError) {
    return { error: returnError.message };
  }

  // Log the action
  await supabase.rpc('central.log_action', {
    p_action: 'borrow_equipment',
    p_entity_type: 'equipment',
    p_entity_id: equipmentId,
    p_schema_name: labSchema,
    p_details: { expected_return_date: expectedReturnDate },
  });

  revalidatePath(`/labs/${labSchema}`);
  return { success: true };
}

export async function returnEquipment(
  labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5',
  returnId: string,
  conditionOnReturn: string,
  returnNotes?: string
) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: 'Not authenticated' };
  }

  const { data: currentUser } = await supabase
    .schema('central')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) {
    return { error: 'User not found' };
  }

  // Get return record
  const { data: returnRecord, error: fetchError } = await supabase
    .schema(labSchema)
    .from('returns')
    .select('*, equipment_id')
    .eq('id', returnId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const actualReturnDate = new Date();
  const expectedDate = new Date(returnRecord.expected_return_date);
  const isLate = actualReturnDate > expectedDate;
  const daysOverdue = isLate 
    ? Math.floor((actualReturnDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Update return record
  const { error: updateReturnError } = await supabase
    .schema(labSchema)
    .from('returns')
    .update({
      actual_return_date: actualReturnDate.toISOString(),
      status: 'returned',
      condition_on_return: conditionOnReturn,
      return_notes: returnNotes,
      inspected_by: currentUser.id,
      is_late: isLate,
      days_overdue: daysOverdue,
      late_fee: daysOverdue * 10, // $10 per day late fee
    })
    .eq('id', returnId);

  if (updateReturnError) {
    return { error: updateReturnError.message };
  }

  // Update equipment status
  const { error: updateEquipmentError } = await supabase
    .schema(labSchema)
    .from('inventory')
    .update({
      status: 'available',
      current_borrower_id: null,
      borrowed_at: null,
      expected_return_date: null,
      condition: conditionOnReturn,
    })
    .eq('id', returnRecord.equipment_id);

  if (updateEquipmentError) {
    return { error: updateEquipmentError.message };
  }

  // Log the action
  await supabase.rpc('central.log_action', {
    p_action: 'return_equipment',
    p_entity_type: 'equipment',
    p_entity_id: returnRecord.equipment_id,
    p_schema_name: labSchema,
    p_details: { 
      condition: conditionOnReturn,
      is_late: isLate,
      days_overdue: daysOverdue 
    },
  });

  revalidatePath(`/labs/${labSchema}`);
  return { success: true };
}

// =====================================================
// ISSUE ACTIONS
// =====================================================

export async function createIssue(
  labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5',
  equipmentId: string,
  issueType: string,
  severity: string,
  title: string,
  description: string
) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: 'Not authenticated' };
  }

  const { data: currentUser } = await supabase
    .schema('central')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) {
    return { error: 'User not found' };
  }

  const { data, error } = await supabase
    .schema(labSchema)
    .from('issues')
    .insert({
      equipment_id: equipmentId,
      reported_by: currentUser.id,
      issue_type: issueType,
      severity,
      title,
      description,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Log the action
  await supabase.rpc('central.log_action', {
    p_action: 'create_issue',
    p_entity_type: 'issue',
    p_entity_id: data.id,
    p_schema_name: labSchema,
    p_details: { issue_type: issueType, severity, title },
  });

  revalidatePath(`/labs/${labSchema}/issues`);
  return { data: data as Issue };
}

export async function getLabIssues(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5') {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .schema(labSchema)
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data as Issue[] };
}

export async function resolveIssue(
  labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5',
  issueId: string,
  resolution: string,
  damageCost?: number,
  fineAmount?: number
) {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: 'Not authenticated' };
  }

  const { data: currentUser } = await supabase
    .schema('central')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) {
    return { error: 'User not found' };
  }

  const { error } = await supabase
    .schema(labSchema)
    .from('issues')
    .update({
      status: 'resolved',
      resolution,
      resolved_by: currentUser.id,
      resolved_at: new Date().toISOString(),
      damage_cost: damageCost || 0,
      fine_amount: fineAmount || 0,
    })
    .eq('id', issueId);

  if (error) {
    return { error: error.message };
  }

  // Log the action
  await supabase.rpc('central.log_action', {
    p_action: 'resolve_issue',
    p_entity_type: 'issue',
    p_entity_id: issueId,
    p_schema_name: labSchema,
    p_details: { damage_cost: damageCost, fine_amount: fineAmount },
  });

  revalidatePath(`/labs/${labSchema}/issues`);
  return { success: true };
}

// =====================================================
// RETURNS ACTIONS
// =====================================================

export async function getUserReturns(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5') {
  const supabase = await createClient();
  
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return { error: 'Not authenticated' };
  }

  const { data: currentUser } = await supabase
    .schema('central')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single();

  if (!currentUser) {
    return { error: 'User not found' };
  }

  const { data, error } = await supabase
    .schema(labSchema)
    .from('returns')
    .select('*')
    .eq('borrower_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data as Return[] };
}

export async function getLabReturns(labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5') {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .schema(labSchema)
    .from('returns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data: data as Return[] };
}
