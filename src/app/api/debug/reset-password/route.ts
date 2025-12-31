
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("🛠️ Starting User Repair (Nuke & Rebirth)...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const targetEmail = 'hod@nutech.edu.pk';
    const password = 'password123';

    try {
        // STEP 1: CLEANUP (Delete everything related to this email)
        console.log(`1. cleanup: checking for existing profiles/users for ${targetEmail}`);

        // A. Delete from Public Profile (Direct DB)
        const { data: profiles } = await supabaseAdmin.from('profiles').select('id').eq('email', targetEmail);
        if (profiles && profiles.length > 0) {
            for (const p of profiles) {
                console.log(`   - Deleting Zombie Profile: ${p.id}`);
                await supabaseAdmin.from('profiles').delete().eq('id', p.id);

                // Also try deleting from Auth (by ID) just in case
                await supabaseAdmin.auth.admin.deleteUser(p.id).catch(() => { });
            }
        }

        // B. Delete from Auth (Search by Email) - Double Check
        // Sometimes listUsers doesn't find it, but clean slate is good.
        // We'll proceed to create. If it says "User already exists", we'll know.

        // STEP 2: CREATE FRESH USER
        console.log("2. Creating Fresh Auth User...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: targetEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: 'Dr. System HOD' }
        });

        if (createError) {
            console.error("   - Creation Failed:", createError.message);
            // Fallback: If it says 'User already registered', maybe we missed it in Step 1.
            // Try to find it again and force update password?
            throw createError;
        }

        const newUserId = newUser.user.id;
        console.log(`   - Created User ID: ${newUserId}`);

        // STEP 3: ENSURE PROFILE & ROLE
        // The Trigger 'on_auth_user_created' should have created a 'student' profile. 
        // We need to upgrade it to 'hod'.

        console.log("3. Upgrading Profile to HOD...");
        // Wait a small moment for trigger? Usually instant in Postgres.

        const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
            id: newUserId,
            email: targetEmail,
            full_name: 'Dr. System HOD',
            role: 'hod', // FORCE HOD
            reliability_score: 100,
            is_active: true
        });

        if (upsertError) {
            console.error("   - Profile Upgrade Failed:", upsertError);
            throw upsertError;
        }

        console.log("✅ Repair Complete!");
        return NextResponse.json({
            success: true,
            message: `User ${targetEmail} repaired successfully.`,
            user: { id: newUserId, email: targetEmail, role: 'hod' }
        });

    } catch (error: any) {
        console.error("❌ Repair Failed:", error);
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
}
