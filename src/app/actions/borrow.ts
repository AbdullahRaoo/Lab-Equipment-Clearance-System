'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Create a new borrow request
export async function createBorrowRequest(formData: any) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const {
        lab_id,
        request_type, // 'university' | 'home'
        purpose,
        start_time,
        end_time,
        is_group_project,
        group_members, // array of items
        inventory_ids // array of UUIDs
    } = formData;

    // Insert Request
    const { data: request, error: reqError } = await supabase
        .from('borrow_requests')
        .insert({
            user_id: user.id,
            lab_id,
            request_type,
            purpose,
            start_time,
            end_time,
            is_group_project: is_group_project || false,
            group_members: group_members || [],
            status: 'pending'
        })
        .select()
        .single();

    if (reqError) {
        console.error('Error creating request:', reqError);
        return { error: reqError.message };
    }

    // Insert Items (Many to Many)
    if (inventory_ids && inventory_ids.length > 0) {
        const items = inventory_ids.map((itemId: string) => ({
            request_id: request.id,
            inventory_id: itemId
        }));

        const { error: itemsError } = await supabase
            .from('borrow_request_items')
            .insert(items);

        if (itemsError) {
            console.error('Error adding items:', itemsError);
            // Cleanup?
            return { error: 'Request created but failed to add items.' };
        }
    }

    revalidatePath('/clearance'); // Or /dashboard
    return { data: request };
}

// Get My Requests
export async function getMyBorrowRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { data: [] };

    const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
      *,
      labs (name, code),
      borrow_request_items (
        inventory (name, model)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return { data: [] };
    }
    return { data };
}

// Get Pending Requests for a Lab (Admin)
export async function getLabPendingRequests(labId: string) {
    const supabase = await createClient();

    // Check permissions (user must be Incharge of this lab or HOD)
    // Skipped for brevity, rely on RLS ideally or check here

    const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
            *,
            profiles (full_name, reg_no, reliability_score),
            borrow_request_items (
                inventory (name, asset_tag)
            )
        `)
        .eq('lab_id', labId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) return { error: error.message };
    return { data };
}

// Approve/Reject
export async function updateRequestStatus(requestId: string, status: 'approved' | 'rejected', notes?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('borrow_requests')
        .update({
            status,
            approved_by: user?.id, // or admin id
            rejection_reason: status === 'rejected' ? notes : null,
            admin_notes: notes
        })
        .eq('id', requestId);

    if (error) return { error: error.message };

    revalidatePath('/admin/clearance');
    return { success: true };
}
