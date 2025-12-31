'use server';

import { createClient } from '@/lib/supabase/server';

export async function getInventory(labId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('inventory')
        .select(`
      *,
      labs (name, code)
    `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (labId) {
        query = query.eq('lab_id', labId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching inventory:', error);
        return { error: error.message };
    }

    return { data };
}

export async function addInventoryItem(formData: any) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Insert
    // Note: 'labs' relationship is Many-to-One. We store lab_id.
    const { error } = await supabase.from('inventory').insert({
        name: formData.name,
        lab_id: formData.lab_id,
        item_type: formData.item_type || 'equipment',
        model: formData.model,
        serial_no: formData.serial_no,
        asset_tag: formData.asset_tag,
        status: 'available',
        purchase_date: formData.purchase_date || null,
        price: formData.price ? parseFloat(formData.price) : null,
        qr_code_data: formData.asset_tag // Simple QR data for now
    });

    if (error) {
        console.error('Add Item Error:', error);
        return { error: error.message };
    }

    // Revalidate
    return { success: true };
}

export async function getLabs() {
    const supabase = await createClient();
    const { data } = await supabase.from('labs').select('*').order('name');
    return { data };
}
