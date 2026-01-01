'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export type DiagResult = {
    step: string;
    success: boolean;
    data?: any;
    error?: any;
};

export async function runAuthDiagnostics(email: string): Promise<DiagResult[]> {
    const results: DiagResult[] = [];
    const testPassword = 'TestPassword123!';

    // Step 1: Check if email exists in profiles
    try {
        const { data, error } = await adminClient.from('profiles').select('id, email, role').eq('email', email);
        results.push({
            step: '1. Check profiles table',
            success: !error,
            data: data?.length ? data : 'No profiles found',
            error: error?.message
        });
    } catch (e: any) {
        results.push({ step: '1. Check profiles table', success: false, error: e.message });
    }

    // Step 2: List all auth users and check for email
    try {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers();
        const found = users.filter(u => u.email === email);
        results.push({
            step: '2. Check auth.users',
            success: !error,
            data: found.length ? found.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })) : 'No auth users with this email',
            error: error?.message
        });
    } catch (e: any) {
        results.push({ step: '2. Check auth.users', success: false, error: e.message });
    }

    // Step 3: Try to clean up any existing records
    try {
        const { data: profiles } = await adminClient.from('profiles').select('id').eq('email', email);
        let cleaned = 0;
        if (profiles && profiles.length > 0) {
            for (const p of profiles) {
                await adminClient.from('profiles').delete().eq('id', p.id);
                await adminClient.auth.admin.deleteUser(p.id).catch(() => { });
                cleaned++;
            }
        }
        results.push({
            step: '3. Cleanup existing records',
            success: true,
            data: cleaned > 0 ? `Cleaned ${cleaned} records` : 'Nothing to clean'
        });
    } catch (e: any) {
        results.push({ step: '3. Cleanup', success: false, error: e.message });
    }

    // Step 4: Try minimal createUser call
    try {
        const { data, error } = await adminClient.auth.admin.createUser({
            email: email,
            password: testPassword,
            email_confirm: true
        });

        if (error) {
            results.push({
                step: '4. Minimal createUser (no metadata)',
                success: false,
                error: {
                    message: error.message,
                    status: error.status,
                    code: (error as any).code,
                    name: error.name
                }
            });
        } else {
            results.push({
                step: '4. Minimal createUser',
                success: true,
                data: { userId: data.user.id, email: data.user.email }
            });

            // Cleanup the test user
            await adminClient.auth.admin.deleteUser(data.user.id);
            results.push({ step: '4b. Cleanup test user', success: true, data: 'Deleted' });
        }
    } catch (e: any) {
        results.push({
            step: '4. Minimal createUser',
            success: false,
            error: e.message
        });
    }

    // Step 5: Check database for any triggers on auth schema
    try {
        const { data, error } = await adminClient.rpc('get_auth_triggers');
        results.push({
            step: '5. Check auth triggers (RPC)',
            success: !error,
            data: data || 'No RPC function or no data',
            error: error?.message
        });
    } catch (e: any) {
        results.push({
            step: '5. Check triggers via RPC',
            success: false,
            error: 'RPC not available (expected)'
        });
    }

    // Step 6: Check service role key starts correctly
    results.push({
        step: '6. Verify service role key',
        success: true,
        data: {
            supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
            serviceKeyPrefix: serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'MISSING',
            keyLength: serviceRoleKey?.length || 0
        }
    });

    return results;
}
