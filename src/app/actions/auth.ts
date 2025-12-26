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
  const { data: userId, error: profileError } = await supabase.rpc('central.create_user_profile', {
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
  await supabase.rpc('central.log_action', {
    p_action: 'user_signup',
    p_entity_type: 'user',
    p_entity_id: authData.user.id,
    p_details: { email, role },
  });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
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
    return { error: error.message };
  }

  // Log the action
  await supabase.rpc('central.log_action', {
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
    await supabase.rpc('central.log_action', {
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
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const { data: user, error } = await supabase.rpc('central.get_user_by_auth_id', {
    p_auth_id: authUser.id,
  });

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user?.[0] || null;
}
