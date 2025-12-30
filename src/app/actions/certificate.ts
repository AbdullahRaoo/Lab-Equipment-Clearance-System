'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Certificate data interface
export interface CertificateData {
    certificate_number: string;
    student_name: string;
    student_email: string;
    student_id?: string;
    request_type: string;
    issue_date: string;
    valid_until: string;
    labs_cleared: {
        lab1: { status: string; cleared_at: string | null };
        lab2: { status: string; cleared_at: string | null };
        lab3: { status: string; cleared_at: string | null };
        lab4: { status: string; cleared_at: string | null };
        lab5: { status: string; cleared_at: string | null };
    };
    approved_by: string | null;
    approved_at: string | null;
    verification_hash: string;
}

// Generate clearance certificate
export async function generateClearanceCertificate(requestId: string): Promise<{
    data?: CertificateData;
    error?: string;
}> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('generate_clearance_certificate', {
            p_request_id: requestId,
        });

        if (error) {
            console.error('Generate certificate error:', error);
            return { error: error.message };
        }

        revalidatePath('/clearance');
        return { data: data as CertificateData };
    } catch (err) {
        console.error('Certificate generation failed:', err);
        return { error: 'Failed to generate certificate' };
    }
}

// Validate certificate
export async function validateCertificate(certificateNumber: string): Promise<{
    data?: {
        valid: boolean;
        certificate_number: string;
        student_name: string;
        student_email: string;
        request_type: string;
        issue_date: string;
        valid_until: string;
        expired: boolean;
    };
    error?: string;
}> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('validate_certificate', {
            p_certificate_number: certificateNumber,
        });

        if (error) {
            console.error('Validate certificate error:', error);
            return { error: error.message };
        }

        return { data };
    } catch (err) {
        console.error('Certificate validation failed:', err);
        return { error: 'Failed to validate certificate' };
    }
}

// Get certificate by request ID
export async function getCertificateByRequestId(requestId: string): Promise<{
    data?: {
        id: string;
        user_id: string;
        status: string;
        request_type: string;
        certificate_url: string | null;
        certificate_generated_at: string | null;
        lab1_status: string;
        lab2_status: string;
        lab3_status: string;
        lab4_status: string;
        lab5_status: string;
        lab1_reviewed_at: string | null;
        lab2_reviewed_at: string | null;
        lab3_reviewed_at: string | null;
        lab4_reviewed_at: string | null;
        lab5_reviewed_at: string | null;
        final_approved_at: string | null;
        valid_until: string | null;
        created_at: string;
        user?: {
            full_name: string;
            email: string;
            student_id: string | null;
        };
    };
    error?: string;
}> {
    const supabase = await createClient();

    try {
        // First check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: 'Not authenticated' };
        }

        // Get user profile
        const { data: profile } = await supabase.rpc('get_user_by_auth_id', {
            p_auth_id: user.id,
        });

        if (!profile || profile.length === 0) {
            return { error: 'User profile not found' };
        }

        // Get the clearance request
        const { data, error } = await supabase
            .from('clearance_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (error) {
            console.error('Get certificate error:', error);
            return { error: error.message };
        }

        // Check authorization - user can only view their own or admin can view all
        if (data.user_id !== profile[0].id && !['admin', 'lab_admin'].includes(profile[0].role)) {
            return { error: 'Not authorized to view this certificate' };
        }

        // Get user details for the certificate
        const { data: userData } = await supabase.rpc('get_user_by_id', {
            p_user_id: data.user_id,
        });

        return {
            data: {
                ...data,
                user: userData?.[0] || null,
            },
        };
    } catch (err) {
        console.error('Get certificate failed:', err);
        return { error: 'Failed to get certificate' };
    }
}

// Admin: Approve lab clearance
export async function approveLabClearance(
    requestId: string,
    labSchema: string,
    notes?: string
): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: 'Not authenticated' };
        }

        const { data: profile } = await supabase.rpc('get_user_by_auth_id', {
            p_auth_id: user.id,
        });

        if (!profile || profile.length === 0 || !['admin', 'lab_admin'].includes(profile[0].role)) {
            return { error: 'Not authorized' };
        }

        const { error } = await supabase.rpc('approve_lab_clearance', {
            p_request_id: requestId,
            p_lab_schema: labSchema,
            p_reviewer_id: profile[0].id,
            p_notes: notes || null,
        });

        if (error) {
            console.error('Approve clearance error:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/clearance');
        revalidatePath('/clearance');
        return { success: true };
    } catch (err) {
        console.error('Approve clearance failed:', err);
        return { error: 'Failed to approve clearance' };
    }
}

// Admin: Reject lab clearance
export async function rejectLabClearance(
    requestId: string,
    labSchema: string,
    rejectionNotes: string
): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { error: 'Not authenticated' };
        }

        const { data: profile } = await supabase.rpc('get_user_by_auth_id', {
            p_auth_id: user.id,
        });

        if (!profile || profile.length === 0 || !['admin', 'lab_admin'].includes(profile[0].role)) {
            return { error: 'Not authorized' };
        }

        const { error } = await supabase.rpc('reject_lab_clearance', {
            p_request_id: requestId,
            p_lab_schema: labSchema,
            p_reviewer_id: profile[0].id,
            p_rejection_notes: rejectionNotes,
        });

        if (error) {
            console.error('Reject clearance error:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/clearance');
        revalidatePath('/clearance');
        return { success: true };
    } catch (err) {
        console.error('Reject clearance failed:', err);
        return { error: 'Failed to reject clearance' };
    }
}
