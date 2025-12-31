'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Admin Client (Service Role)
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export type CreateUserState = {
    success?: boolean;
    message?: string;
    error?: string;
    logs?: string[];
};

export async function createDevUser(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as string;
    const labCode = formData.get('lab_code') as string | null;

    const logs: string[] = [];
    logs.push(`🚀 Starting creation for: ${email} (${role})`);

    try {
        // 1. CLEANUP (Delete existing)
        logs.push(`1. Checking for existing user...`);

        // Check Public Profile first
        const { data: profiles } = await adminClient.from('profiles').select('id').eq('email', email);
        if (profiles && profiles.length > 0) {
            for (const p of profiles) {
                logs.push(`   - Found existing profile ${p.id}. Deleting...`);
                await adminClient.from('profiles').delete().eq('id', p.id);
                // Also delete from auth
                await adminClient.auth.admin.deleteUser(p.id).catch(err => logs.push(`   Warning: Auth delete error: ${err.message}`));
            }
        } else {
            // Double check Auth (if profile was missing)
            const { data: { users } } = await adminClient.auth.admin.listUsers();
            const existingAuth = users.find(u => u.email === email);
            if (existingAuth) {
                logs.push(`   - Found orphan auth user ${existingAuth.id}. Deleting...`);
                await adminClient.auth.admin.deleteUser(existingAuth.id);
            }
        }

        // 2. CREATE AUTH USER
        logs.push(`2. Creating Fresh Auth User...`);
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (createError) throw createError;
        const userId = authData.user.id;
        logs.push(`   - Created Auth ID: ${userId}`);

        // 3. RESOLVE LAB ID (if needed)
        let labId = null;
        if (labCode && role.includes('lab')) {
            const { data: lab } = await adminClient.from('labs').select('id').eq('code', labCode).single();
            if (lab) {
                labId = lab.id;
                logs.push(`   - Resolved Lab ${labCode} to ${labId}`);
            } else {
                logs.push(`   - Warning: Lab ${labCode} not found.`);
            }
        }

        // 4. UPSERT PROFILE
        logs.push(`3. Creating Profile record...`);
        const { error: profileError } = await adminClient.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName,
            role,
            assigned_lab_id: labId,
            reliability_score: role === 'student' ? 80 : 100,
            is_active: true
        });

        if (profileError) throw profileError;
        logs.push(`   - Profile created successfully.`);

        return { success: true, message: `User ${email} created successfully!`, logs };

    } catch (error: any) {
        console.error("Dev User Creation Failed:", error);
        logs.push(`❌ ERROR: ${error.message}`);
        return { success: false, error: error.message, logs };
    }
}
