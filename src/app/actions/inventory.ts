'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getInventory(labId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('inventory')
        .select(`
      *,
      labs (name, code)
    `)
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

export async function getInventoryItem(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('inventory')
        .select(`
      *,
      labs (name, code)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching item:', error);
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
        quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        qr_code_data: formData.asset_tag
    });

    if (error) {
        console.error('Add Item Error:', error);
        return { error: error.message };
    }

    revalidatePath('/inventory');
    return { success: true };
}

export async function updateInventoryItem(id: string, formData: FormData) {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const updateData: any = {
        name: formData.get('name'),
        model: formData.get('model') || null,
        serial_no: formData.get('serial_no') || null,
        asset_tag: formData.get('asset_tag') || null,
        quantity: parseInt(formData.get('quantity') as string) || 1,
        lab_id: formData.get('lab_id'),
        status: formData.get('status'),
        condition: formData.get('condition') || null,
        purchase_date: formData.get('purchase_date') || null,
        price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
        supplier: formData.get('supplier') || null,
    };

    const { error } = await supabase
        .from('inventory')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Update Item Error:', error);
        return { error: error.message };
    }

    revalidatePath('/inventory');
    return { success: true };
}

export async function getLabs() {
    const supabase = await createClient();
    const { data } = await supabase.from('labs').select('*').order('name');
    return { data };
}
