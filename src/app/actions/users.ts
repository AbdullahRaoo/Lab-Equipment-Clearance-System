'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { UserRole, ROLE_LEVELS, canManageRole } from '@/types/clearance';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Get all users (for admin dashboard)
export async function getAllUsers() {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('profiles')
        .select(`
      *,
      labs:assigned_lab_id (id, name, code),
      secondary_labs:secondary_lab_id (id, name, code)
    `)
        .order('role')
        .order('full_name');

    if (error) {
        console.error('Error fetching users:', error);
        return { error: error.message };
    }

    return { data };
}

// Get all labs
export async function getAllLabs() {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('labs')
        .select('*')
        .order('name');

    if (error) return { error: error.message };
    return { data };
}

// Create faculty user
export async function createFacultyUser(formData: FormData) {
    const supabase = await createServerClient();

    // Get current user to check permissions
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (!currentUser) return { error: 'Profile not found' };

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as UserRole;
    const labId = formData.get('lab_id') as string | null;
    const contactNo = formData.get('contact_no') as string | null;

    // Check if current user can assign this role
    if (!canManageRole(currentUser.role as UserRole, role)) {
        return { error: `You do not have permission to create ${role} accounts` };
    }

    // Check unique constraints for singleton roles
    if (['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role)) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', role)
            .single();

        if (existing) {
            return { error: `A ${role.replace(/_/g, ' ').toUpperCase()} already exists in the system` };
        }
    }

    // For lab staff, check one per lab constraint
    if (['lab_engineer', 'lab_assistant'].includes(role) && labId) {
        const { data: existingLabStaff } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', role)
            .eq('assigned_lab_id', labId)
            .single();

        if (existingLabStaff) {
            return { error: `This lab already has a ${role.replace(/_/g, ' ')}` };
        }
    }

    try {
        // Create Auth User
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (createError) {
            console.error('Create user error:', createError);
            return { error: 'Failed to create user account' };
        }

        // Create Profile
        const { error: profileError } = await adminClient.from('profiles').upsert({
            id: authData.user.id,
            email,
            full_name: fullName,
            role,
            assigned_lab_id: labId || null,
            contact_no: contactNo || null,
            reliability_score: 100,
            is_active: true
        });

        if (profileError) {
            await adminClient.auth.admin.deleteUser(authData.user.id);
            return { error: 'Failed to create profile' };
        }

        revalidatePath('/admin/users');
        return { success: true, message: `${fullName} created successfully` };

    } catch (error: any) {
        console.error('Create faculty error:', error);
        return { error: error.message };
    }
}

// Update user role
export async function updateUserRole(userId: string, newRole: UserRole, labId?: string) {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

    if (!currentUser) return { error: 'Profile not found' };

    // Get target user's current role
    const { data: targetUser } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

    if (!targetUser) return { error: 'User not found' };

    // Check permissions
    if (!canManageRole(currentUser.role as UserRole, targetUser.role as UserRole)) {
        return { error: 'You cannot modify this user' };
    }

    if (!canManageRole(currentUser.role as UserRole, newRole)) {
        return { error: `You cannot assign the ${newRole} role` };
    }

    // Check singleton constraint
    if (['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(newRole)) {
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', newRole)
            .neq('id', userId)
            .single();

        if (existing) {
            return { error: `Another ${newRole.replace(/_/g, ' ')} already exists` };
        }
    }

    const { error } = await adminClient.from('profiles').update({
        role: newRole,
        assigned_lab_id: labId || null
    }).eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { success: true, message: `${targetUser.full_name}'s role updated to ${newRole}` };
}

// Assign secondary role (for dual-role cases)
export async function assignSecondaryRole(userId: string, secondaryRole: UserRole, labId?: string) {
    const supabase = await createServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

    // Only OIC+ can assign secondary roles
    if (!currentUser || ROLE_LEVELS[currentUser.role as UserRole] > 3) {
        return { error: 'Only OIC CEN Labs or higher can assign secondary roles' };
    }

    const { error } = await adminClient.from('profiles').update({
        secondary_role: secondaryRole,
        secondary_lab_id: labId || null
    }).eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { success: true };
}

// Toggle user active status
export async function toggleUserStatus(userId: string) {
    const supabase = await createServerClient();

    const { data: targetUser } = await supabase
        .from('profiles')
        .select('is_active, role')
        .eq('id', userId)
        .single();

    if (!targetUser) return { error: 'User not found' };

    const { error } = await adminClient.from('profiles').update({
        is_active: !targetUser.is_active
    }).eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { success: true, isActive: !targetUser.is_active };
}

// Delete user
export async function deleteUser(userId: string) {
    const supabase = await createServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return { error: 'Not authenticated' };

    const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

    const { data: targetUser } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId)
        .single();

    if (!currentUser || !targetUser) return { error: 'User not found' };

    if (!canManageRole(currentUser.role as UserRole, targetUser.role as UserRole)) {
        return { error: 'You cannot delete this user' };
    }

    // Delete profile first (cascade should handle it, but be explicit)
    await adminClient.from('profiles').delete().eq('id', userId);

    // Delete auth user
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };

    revalidatePath('/admin/users');
    return { success: true, message: `${targetUser.full_name} deleted` };
}
