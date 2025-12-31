'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Create Request
export async function createProcurementRequest(formData: any) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get User Profile to check lab assignment
    const { data: profile } = await supabase.from('profiles').select('assigned_lab_id').eq('id', user.id).single();

    if (!profile?.assigned_lab_id) {
        return { error: 'You are not assigned to a lab. Cannot make requests.' };
    }

    const { error } = await supabase.from('procurement_requests').insert({
        requester_id: user.id,
        lab_id: profile.assigned_lab_id,
        item_name: formData.item_name,
        specification: formData.specification,
        quantity: parseInt(formData.quantity) || 1,
        estimated_cost_per_unit: parseFloat(formData.estimated_cost),
        justification: formData.justification,
        status: 'pending_hod'
    });

    if (error) {
        console.error('Procurement Error:', error);
        return { error: error.message };
    }

    revalidatePath('/procurement');
    return { success: true };
}

// Get Requests
export async function getProcurementRequests() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };

    const { data: profile } = await supabase.from('profiles').select('role, assigned_lab_id').eq('id', user.id).single();
    if (!profile) return { data: [] };

    let query = supabase
        .from('procurement_requests')
        .select(`
            *,
            labs (name, code),
            profiles (full_name)
        `)
        .order('created_at', { ascending: false });

    // If HOD/ProHOD -> See ALL (or maybe filter by status?)
    // If Lab Incharge -> See OWN Lab's requests
    if (['lab_incharge', 'lab_assistant'].includes(profile.role)) {
        if (!profile.assigned_lab_id) return { data: [] };
        query = query.eq('lab_id', profile.assigned_lab_id);
    }
    // If student, shouldn't see anything (protected by page)

    const { data, error } = await query;

    if (error) return { error: error.message };
    return { data };
}

// Update Status (HOD)
export async function updateProcurementStatus(requestId: string, status: string, comments?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify HOD role? RLS handles it?
    // We should double check role here to fail fast
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    if (!['hod', 'pro_hod'].includes(profile?.role)) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('procurement_requests')
        .update({
            status,
            admin_comments: comments
        })
        .eq('id', requestId);

    if (error) return { error: error.message };

    revalidatePath('/procurement');
    return { success: true };
}
