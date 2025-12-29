import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/labs/assignments?user_id=123 - Get lab assignments for a user
// GET /api/labs/assignments - Get all lab assignments (admin only)
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    // If user_id provided, get assignments for that user
    if (userId) {
      // Users can view their own assignments, admins can view anyone's
      if (currentUser.id !== parseInt(userId) && currentUser.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get user's lab assignments
      const { data: labs, error } = await supabase.rpc('get_user_labs', {
        p_user_id: parseInt(userId),
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ labs }, { status: 200 });
    }

    // No user_id - list all assignments (admin only)
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { data: assignments, error } = await supabase
      .schema('central')
      .from('user_lab_assignments')
      .select(`
        *,
        user:user_id (
          id,
          email,
          full_name,
          role
        ),
        assigner:assigned_by (
          id,
          full_name
        )
      `)
      .order('assigned_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/labs/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/labs/assignments - Assign user to lab (admin only)
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { user_id, lab_name, can_manage, notes } = body;

    // Validate required fields
    if (!user_id || !lab_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, lab_name' },
        { status: 400 }
      );
    }

    // Validate lab_name
    const validLabs = ['lab1', 'lab2', 'lab3', 'lab4', 'lab5'];
    if (!validLabs.includes(lab_name)) {
      return NextResponse.json(
        { error: 'Invalid lab_name. Must be one of: lab1, lab2, lab3, lab4, lab5' },
        { status: 400 }
      );
    }

    // Assign user to lab
    const { data: assignmentId, error } = await supabase.rpc('assign_user_to_lab', {
      p_user_id: parseInt(user_id),
      p_lab_name: lab_name,
      p_can_manage: can_manage || false,
      p_assigned_by: currentUser.id,
      p_notes: notes || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.rpc('log_action', {
      p_action: 'assign_user_to_lab',
      p_entity_type: 'user_lab_assignment',
      p_entity_id: assignmentId?.toString(),
      p_details: { user_id, lab_name, can_manage, assigned_by: currentUser.id },
    });

    return NextResponse.json(
      { message: 'User assigned to lab successfully', assignment_id: assignmentId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/labs/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/labs/assignments?user_id=123&lab_name=lab1 - Remove user from lab
export async function DELETE(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const labName = searchParams.get('lab_name');

    if (!userId || !labName) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_id, lab_name' },
        { status: 400 }
      );
    }

    // Remove user from lab
    const { data: removed, error } = await supabase.rpc('remove_user_from_lab', {
      p_user_id: parseInt(userId),
      p_lab_name: labName,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!removed) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Log the action
    await supabase.rpc('log_action', {
      p_action: 'remove_user_from_lab',
      p_entity_type: 'user_lab_assignment',
      p_entity_id: `${userId}-${labName}`,
      p_details: { user_id: userId, lab_name: labName, removed_by: currentUser.id },
    });

    return NextResponse.json({ message: 'User removed from lab successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/labs/assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
