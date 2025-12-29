'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as string;
  const department = formData.get('department') as string;
  const studentId = formData.get('student_id') as string;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user' };
  }

  // 2. Create user profile in central schema
  const { data: userId, error: profileError } = await supabase.rpc('create_user_profile', {
    p_auth_id: authData.user.id,
    p_email: email,
    p_full_name: fullName,
    p_role: role || 'student',
    p_department: department || null,
    p_student_id: studentId || null,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // 3. Log the action
  await supabase.rpc('log_action', {
    p_action: 'user_signup',
    p_entity_type: 'user',
    p_entity_id: authData.user.id,
    p_details: { email, role },
  });

  revalidatePath('/', 'layout');
  
  // Check if email confirmation is required
  if (authData.session) {
    // User is auto-logged in (email confirmation disabled)
    redirect('/dashboard');
  } else {
    // Email confirmation required
    redirect('/verify-email');
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email before logging in. Check your inbox for the confirmation link.' };
    }
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Login failed. Please try again.' };
  }

  // Log the action
  await supabase.rpc('log_action', {
    p_action: 'user_login',
    p_entity_type: 'user',
    p_entity_id: data.user.id,
    p_details: { email },
  });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.rpc('log_action', {
      p_action: 'user_logout',
      p_entity_type: 'user',
      p_entity_id: user.id,
    });
  }

  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const { data: user, error } = await supabase.rpc('get_user_by_auth_id', {
      p_auth_id: authUser.id,
    });

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!user || user.length === 0) {
      console.error('User profile not found for auth user:', authUser.id);
      return null;
    }

    return user[0];
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
}
