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

export type RegistrationState = {
    success?: boolean;
    message?: string;
    error?: string;
};

export async function registerStudent(
    prevState: RegistrationState,
    formData: FormData
): Promise<RegistrationState> {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;
    const fullName = formData.get('full_name') as string;
    const regNo = formData.get('reg_no') as string;
    const department = formData.get('department') as string;
    const contactNo = formData.get('contact_no') as string;

    // Validation
    if (!email || !password || !fullName || !regNo) {
        return { error: 'Please fill all required fields' };
    }

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' };
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' };
    }

    // Email format check for NUTECH domain
    if (!email.endsWith('@nutech.edu.pk') && !email.includes('@')) {
        return { error: 'Please use a valid email address' };
    }

    try {
        // Check if email already exists
        const { data: existingUser } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return { error: 'An account with this email already exists' };
        }

        // Check if registration number already exists
        const { data: existingRegNo } = await adminClient
            .from('profiles')
            .select('id')
            .eq('reg_no', regNo)
            .single();

        if (existingRegNo) {
            return { error: 'This registration number is already registered' };
        }

        // Create Auth User
        const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (createError) {
            console.error('Registration Error:', createError);
            return { error: 'Failed to create account. Please try again.' };
        }

        const userId = authData.user.id;

        // Create/Update Profile with student details
        const { error: profileError } = await adminClient.from('profiles').upsert({
            id: userId,
            email,
            full_name: fullName,
            role: 'student',
            reg_no: regNo,
            department: department || null,
            contact_no: contactNo || null,
            reliability_score: 100,
            is_active: true,
            notification_preferences: { email: true, in_app: true }
        });

        if (profileError) {
            console.error('Profile Creation Error:', profileError);
            // Try to cleanup the auth user
            await adminClient.auth.admin.deleteUser(userId);
            return { error: 'Failed to create profile. Please try again.' };
        }

        revalidatePath('/login');
        return {
            success: true,
            message: 'Account created successfully! You can now login.'
        };

    } catch (error: any) {
        console.error('Registration Failed:', error);
        return { error: error.message || 'Registration failed. Please try again.' };
    }
}
