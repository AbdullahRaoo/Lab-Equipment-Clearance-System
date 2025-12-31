'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();

    // Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const updates = {
        full_name: formData.get('full_name') as string,
        contact_no: formData.get('contact_no') as string,
        department: formData.get('department') as string,
        reg_no: formData.get('reg_no') as string, // Only for students
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

    if (error) {
        console.error('Profile Update Error:', error);
        return { error: error.message };
    }

    revalidatePath('/settings/profile');
    revalidatePath('/dashboard');
    return { success: true };
}
