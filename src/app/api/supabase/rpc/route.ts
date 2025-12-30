import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API Route: /api/supabase/rpc
 * Purpose: Execute Supabase RPC functions for testing Stage 2 M2 triggers
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { function: functionName, params = {} } = body;

    if (!functionName) {
      return NextResponse.json(
        { error: 'Function name is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute the RPC function
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`RPC Error [${functionName}]:`, error);
      return NextResponse.json(
        { error: error.message || 'RPC function failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'RPC endpoint. Use POST with { function, params }',
      examples: [
        { function: 'lab1.get_equipment_availability', params: {} },
        { function: 'lab1.get_currently_borrowed_equipment', params: {} },
        { function: 'lab1.auto_resolve_old_issues', params: {} },
        { function: 'lab1.schedule_maintenance', params: { p_equipment_id: 'uuid', p_maintenance_notes: 'text' } }
      ]
    },
    { status: 200 }
  );
}
