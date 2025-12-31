'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Log Maintenance
export async function logMaintenance(formData: any) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Insert Log
    const { error } = await supabase.from('maintenance_logs').insert({
        inventory_id: formData.inventory_id,
        maintenance_type: formData.maintenance_type, // preventive, corrective, calibration
        performed_by: formData.performed_by || 'Internal Staff',
        service_date: formData.service_date || new Date().toISOString(),
        cost: parseFloat(formData.cost) || 0,
        technician_notes: formData.notes,
        next_due_date_set: formData.next_due_date
    });

    if (error) {
        console.error('Maintenance Log Error:', error);
        return { error: error.message };
    }

    // Update Inventory Next Due Date & Status
    if (formData.next_due_date) {
        await supabase
            .from('inventory')
            .update({
                next_maintenance_date: formData.next_due_date,
                status: 'available', // Assume fixed
                last_maintenance_date: formData.service_date
            })
            .eq('id', formData.inventory_id);
    }

    revalidatePath('/maintenance');
    revalidatePath('/inventory');
    return { success: true };
}

// Get Maintenance Overview
export async function getMaintenanceOverview() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null };

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role, assigned_lab_id').eq('id', user.id).single();
    if (!profile) return { data: null };

    // 1. Get Overdue Items
    let overdueQuery = supabase
        .from('inventory')
        .select('*, labs(name)')
        .lt('next_maintenance_date', new Date().toISOString())
        .order('next_maintenance_date', { ascending: true });

    if (['lab_incharge', 'lab_assistant'].includes(profile.role) && profile.assigned_lab_id) {
        overdueQuery = overdueQuery.eq('lab_id', profile.assigned_lab_id);
    }

    const { data: overdueItems } = await overdueQuery;

    // 2. Get Recent Logs
    let logsQuery = supabase
        .from('maintenance_logs')
        .select('*, inventory(name, asset_tag, labs(name))')
        .order('service_date', { ascending: false })
        .limit(10);

    // Provide simplified response
    return {
        overdue: overdueItems || [],
        recentLogs: (await logsQuery).data || []
    };
}
