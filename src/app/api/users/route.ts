import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users - List all users (admin only)
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

    // Only admins can list all users
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Query users with filters
    let query = supabase
      .schema('central')
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create new user (admin only)
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
    const { email, password, full_name, role, department, student_id } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, role' },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createAuthError) {
      return NextResponse.json({ error: createAuthError.message }, { status: 400 });
    }

    if (!newAuthUser.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create user profile
    const { data: userId, error: profileError } = await supabase.rpc('create_user_profile', {
      p_auth_id: newAuthUser.user.id,
      p_email: email,
      p_full_name: full_name,
      p_role: role,
      p_department: department || null,
      p_student_id: student_id || null,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Log the action
    await supabase.rpc('log_action', {
      p_action: 'admin_create_user',
      p_entity_type: 'user',
      p_entity_id: newAuthUser.user.id,
      p_details: { email, role, created_by: currentUser.id },
    });

    return NextResponse.json(
      { message: 'User created successfully', user_id: userId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
