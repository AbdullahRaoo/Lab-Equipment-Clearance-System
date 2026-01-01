'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { BorrowRequest, RequestStatus, UserRole } from '@/types/clearance';

// Create a new equipment request
export async function createEquipmentRequest(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'student') {
        return { error: 'Only students can submit equipment requests' };
    }

    const labId = formData.get('lab_id') as string;
    const purpose = formData.get('purpose') as string;
    const requestType = formData.get('request_type') as 'university' | 'home';
    const startTime = formData.get('start_time') as string;
    const endTime = formData.get('end_time') as string;
    const supervisorName = formData.get('supervisor_name') as string | null;
    const isGroupProject = formData.get('is_group_project') === 'true';
    const groupMembersRaw = formData.get('group_members') as string;
    const itemIds = formData.getAll('item_ids') as string[];

    if (!labId || !purpose || !startTime || !endTime || itemIds.length === 0) {
        return { error: 'Please fill all required fields and select at least one item' };
    }

    let groupMembers = [];
    if (isGroupProject && groupMembersRaw) {
        try {
            groupMembers = JSON.parse(groupMembersRaw);
        } catch {
            groupMembers = [];
        }
    }

    // Create the request
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .insert({
            user_id: profile.id,
            lab_id: labId,
            purpose,
            request_type: requestType,
            start_time: startTime,
            end_time: endTime,
            supervisor_name: supervisorName || null,
            is_group_project: isGroupProject,
            group_members: groupMembers,
            status: 'submitted',
            current_stage: 1
        })
        .select()
        .single();

    if (requestError) {
        console.error('Create request error:', requestError);
        return { error: 'Failed to create request' };
    }

    // Add items to the request
    const itemInserts = itemIds.map(itemId => ({
        request_id: request.id,
        inventory_id: itemId
    }));

    const { error: itemsError } = await supabase
        .from('borrow_request_items')
        .insert(itemInserts);

    if (itemsError) {
        console.error('Add items error:', itemsError);
        // Cleanup the request
        await supabase.from('borrow_requests').delete().eq('id', request.id);
        return { error: 'Failed to add items to request' };
    }

    // TODO: Create notifications for Lab Engineer & Lab Assistant

    revalidatePath('/clearance');
    revalidatePath('/requests');
    return { success: true, requestId: request.id };
}

// Get pending requests for approval (filtered by role)
export async function getPendingRequestsForApproval() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, assigned_lab_id')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const role = profile.role as UserRole;
    let query = supabase
        .from('borrow_requests')
        .select(`
      *,
      profiles:user_id (id, full_name, email, reg_no),
      labs:lab_id (id, name, code),
      borrow_request_items (
        inventory:inventory_id (id, name, model, asset_tag)
      )
    `)
        .neq('status', 'rejected')
        .neq('status', 'returned')
        .order('created_at', { ascending: false });

    // Filter based on role
    switch (role) {
        case 'lab_engineer':
        case 'lab_assistant':
            // Stage 1: Only requests for their lab
            query = query
                .eq('current_stage', 1)
                .in('status', ['submitted', 'stage1_pending']);
            if (profile.assigned_lab_id) {
                query = query.eq('lab_id', profile.assigned_lab_id);
            }
            break;

        case 'oic_cen_labs':
        case 'asst_oic_cen_labs':
            // Stage 2: Requests that passed stage 1
            query = query
                .eq('current_stage', 2)
                .in('status', ['stage1_approved', 'stage2_pending']);
            break;

        case 'hod':
        case 'pro_hod':
            // Stage 3: Requests that passed stage 2
            query = query
                .eq('current_stage', 3)
                .in('status', ['stage2_approved', 'stage3_pending']);
            break;

        default:
            return { data: [] };
    }

    const { data, error } = await query;
    if (error) return { error: error.message };

    return { data };
}

// Approve request at current stage
export async function approveRequest(requestId: string, notes?: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (!request) return { error: 'Request not found' };

    const role = profile.role as UserRole;
    const stage = request.current_stage;

    // Validate approver has permission for this stage
    if (!canApproveAtStage(role, stage)) {
        return { error: 'You are not authorized to approve at this stage' };
    }

    let updates: Record<string, any> = {};

    // Stage-specific logic
    switch (stage) {
        case 1:
            // Lab Engineer/Assistant - any one can approve
            updates = {
                ...updates,
                stage1_approved_by: profile.id,
                stage1_approved_at: new Date().toISOString(),
                status: 'stage1_approved',
                current_stage: 2
            };
            break;

        case 2:
            // OIC AND Asst. OIC both must approve
            if (role === 'oic_cen_labs') {
                updates = {
                    ...updates,
                    stage2_oic_approved_by: profile.id,
                    stage2_oic_approved_at: new Date().toISOString()
                };
                // Check if Asst. already approved
                if (request.stage2_asst_approved_by) {
                    updates.status = 'stage2_approved';
                    updates.current_stage = 3;
                } else {
                    updates.status = 'stage2_pending';
                }
            } else if (role === 'asst_oic_cen_labs') {
                updates = {
                    ...updates,
                    stage2_asst_approved_by: profile.id,
                    stage2_asst_approved_at: new Date().toISOString()
                };
                // Check if OIC already approved
                if (request.stage2_oic_approved_by) {
                    updates.status = 'stage2_approved';
                    updates.current_stage = 3;
                } else {
                    updates.status = 'stage2_pending';
                }
            }
            break;

        case 3:
            // HOD/Pro-HOD - any one can approve
            updates = {
                ...updates,
                stage3_approved_by: profile.id,
                stage3_approved_at: new Date().toISOString(),
                status: 'approved',
                current_stage: 4 // Complete
            };
            // TODO: Notify student
            break;

        default:
            return { error: 'Invalid approval stage' };
    }

    const { error } = await supabase
        .from('borrow_requests')
        .update(updates)
        .eq('id', requestId);

    if (error) return { error: error.message };

    revalidatePath('/requests');
    revalidatePath('/clearance');
    return { success: true };
}

// Reject request
export async function rejectRequest(requestId: string, reason: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('current_stage')
        .eq('id', requestId)
        .single();

    if (!request) return { error: 'Request not found' };

    if (!canApproveAtStage(profile.role as UserRole, request.current_stage)) {
        return { error: 'You are not authorized to reject at this stage' };
    }

    const { error } = await supabase
        .from('borrow_requests')
        .update({
            status: 'rejected',
            rejected_by: profile.id,
            rejected_at: new Date().toISOString(),
            rejection_stage: request.current_stage,
            rejection_reason: reason
        })
        .eq('id', requestId);

    if (error) return { error: error.message };

    // TODO: Notify student

    revalidatePath('/requests');
    revalidatePath('/clearance');
    return { success: true };
}

// Mark equipment as handed over
export async function markHandedOver(requestId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const role = profile.role as UserRole;
    if (!['lab_engineer', 'lab_assistant'].includes(role)) {
        return { error: 'Only Lab Engineers/Assistants can mark handover' };
    }

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('status')
        .eq('id', requestId)
        .single();

    if (!request || request.status !== 'approved') {
        return { error: 'Request must be in approved status' };
    }

    const { error } = await supabase
        .from('borrow_requests')
        .update({
            status: 'handed_over',
            handed_over_by: profile.id,
            handed_over_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) return { error: error.message };

    // Update inventory status to 'borrowed'
    const { data: items } = await supabase
        .from('borrow_request_items')
        .select('inventory_id')
        .eq('request_id', requestId);

    if (items) {
        const itemIds = items.map(i => i.inventory_id);
        await supabase
            .from('inventory')
            .update({ status: 'borrowed' })
            .in('id', itemIds);
    }

    revalidatePath('/requests');
    return { success: true };
}

// Mark equipment as returned
export async function markReturned(requestId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const role = profile.role as UserRole;
    if (!['lab_engineer', 'lab_assistant'].includes(role)) {
        return { error: 'Only Lab Engineers/Assistants can mark returns' };
    }

    const { data: request } = await supabase
        .from('borrow_requests')
        .select('status')
        .eq('id', requestId)
        .single();

    if (!request || request.status !== 'handed_over') {
        return { error: 'Request must be in handed_over status' };
    }

    const { error } = await supabase
        .from('borrow_requests')
        .update({
            status: 'returned',
            returned_received_by: profile.id,
            returned_at: new Date().toISOString(),
            return_time: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) return { error: error.message };

    // Update inventory status back to 'available'
    const { data: items } = await supabase
        .from('borrow_request_items')
        .select('inventory_id')
        .eq('request_id', requestId);

    if (items) {
        const itemIds = items.map(i => i.inventory_id);
        await supabase
            .from('inventory')
            .update({ status: 'available' })
            .in('id', itemIds);
    }

    revalidatePath('/requests');
    return { success: true };
}

// Get request by ID with all details
export async function getRequestById(requestId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
      *,
      profiles:user_id (id, full_name, email, reg_no, department),
      labs:lab_id (id, name, code),
      borrow_request_items (
        inventory:inventory_id (id, name, model, asset_tag, image_url)
      ),
      stage1_approver:stage1_approved_by (id, full_name, role),
      stage2_oic_approver:stage2_oic_approved_by (id, full_name, role),
      stage2_asst_approver:stage2_asst_approved_by (id, full_name, role),
      stage3_approver:stage3_approved_by (id, full_name, role),
      handover_staff:handed_over_by (id, full_name, role),
      return_staff:returned_received_by (id, full_name, role)
    `)
        .eq('id', requestId)
        .single();

    if (error) return { error: error.message };
    return { data };
}

// Get student's own requests
export async function getMyRequests() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
      *,
      labs:lab_id (id, name, code),
      borrow_request_items (
        inventory:inventory_id (id, name, model, asset_tag)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { data };
}

// Helper function
function canApproveAtStage(role: UserRole, stage: number): boolean {
    switch (stage) {
        case 1:
            return ['lab_engineer', 'lab_assistant'].includes(role);
        case 2:
            return ['oic_cen_labs', 'asst_oic_cen_labs'].includes(role);
        case 3:
            return ['hod', 'pro_hod'].includes(role);
        default:
            return false;
    }
}
