import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user profile
    const { data: currentUserData } = await supabase.rpc('get_user_by_auth_id', {
      p_auth_id: authUser.id,
    });

    const currentUser = currentUserData?.[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // userId already destructured above

    // Users can view their own profile, admins can view any profile
    if (currentUser.id !== parseInt(userId) && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch user by ID
    const { data: user, error } = await supabase
      .schema('central')
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user profile
    const { data: currentUserData } = await supabase.rpc('get_user_by_auth_id', {
      p_auth_id: authUser.id,
    });

    const currentUser = currentUserData?.[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // userId already destructured above

    // Users can update their own profile (limited fields), admins can update any profile
    const isOwnProfile = currentUser.id === parseInt(userId);
    const isAdmin = currentUser.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { full_name, department, student_id, role } = body;

    // Build update object
    const updates: any = {};

    if (full_name !== undefined) updates.full_name = full_name;
    if (department !== undefined) updates.department = department;
    if (student_id !== undefined) updates.student_id = student_id;

    // Only admins can update role
    if (role !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden: Only admins can change user roles' },
          { status: 403 }
        );
      }
      updates.role = role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .schema('central')
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.rpc('log_action', {
      p_action: 'update_user_profile',
      p_entity_type: 'user',
      p_entity_id: userId,
      p_details: { updated_fields: Object.keys(updates), updated_by: currentUser.id },
    });

    return NextResponse.json(
      { message: 'User updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PUT /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user profile
    const { data: currentUserData } = await supabase.rpc('get_user_by_auth_id', {
      p_auth_id: authUser.id,
    });

    const currentUser = currentUserData?.[0];

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // userId already destructured above

    // Prevent self-deletion
    if (currentUser.id === parseInt(userId)) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get user to delete (to get auth_id)
    const { data: userToDelete, error: fetchError } = await supabase
      .schema('central')
      .from('users')
      .select('auth_id, email')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete from central.users (this will cascade to related records if triggers are set)
    const { error: deleteProfileError } = await supabase
      .schema('central')
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      return NextResponse.json({ error: deleteProfileError.message }, { status: 500 });
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userToDelete.auth_id);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Profile already deleted, but log the auth deletion error
    }

    // Log the action
    await supabase.rpc('log_action', {
      p_action: 'admin_delete_user',
      p_entity_type: 'user',
      p_entity_id: userId,
      p_details: { email: userToDelete.email, deleted_by: currentUser.id },
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
