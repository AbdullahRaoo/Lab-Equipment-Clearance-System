'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const regNo = formData.get('reg_no') as string;
  const department = formData.get('department') as string;

  // 1. Create auth user
  // The database trigger 'on_auth_user_created' will automatically create the 'profiles' entry with role='student'
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

  // If we need to set reg_no and department
  if (regNo || department) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reg_no: regNo,
        department: department
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error("Failed to set profile details:", updateError);
    }
  }

  revalidatePath('/', 'layout');

  if (authData.session) {
    redirect('/dashboard');
  } else {
    redirect('/login?error=verification_pending');
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
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Login failed.' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
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
      console.log('getCurrentUser: No Auth User', authError);
      return null;
    }

    // Direct query to public.profiles with lab details
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        labs (
          id,
          name,
          code
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (error || !profile) {
      console.error('getCurrentUser: Profile Missing/Error', authUser.id, error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
}
