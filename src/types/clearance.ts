// =====================================================
// NUTECH ECMS V2 Type Definitions
// =====================================================

export type UserRole = 'hod' | 'pro_hod' | 'lab_incharge' | 'lab_assistant' | 'student';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'overdue' | 'cancelled';
export type InventoryStatus = 'available' | 'borrowed' | 'maintenance' | 'lost' | 'retired';

export interface Lab {
  id: string;
  name: string;
  code: string;
  description?: string;
  image_url?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  reg_no?: string;
  department?: string;
  reliability_score?: number;
  assigned_lab_id?: string;
  avatar_url?: string;
}

export interface InventoryItem {
  id: string;
  lab_id: string;
  name: string;
  model?: string;
  serial_no?: string;
  asset_tag?: string;
  qr_code?: string;
  status: InventoryStatus;
  condition?: string;
  purchase_date?: string;
  price?: number;
  image_url?: string;

  // Joins
  labs?: Lab;
}

export interface BorrowRequest {
  id: string;
  user_id: string;
  lab_id: string;
  request_type: 'university' | 'home';
  purpose: string;
  start_time: string;
  end_time: string;
  return_time?: string;

  is_group_project: boolean;
  group_members?: any[]; // JSONB
  supervisor_name?: string;

  status: RequestStatus;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;

  // Joins
  profiles?: Profile;
  labs?: Lab;
  borrow_request_items?: { inventory: InventoryItem }[];
}


// --- Legacy Support / Clearance specific (Leaving Uni) ---

export type ClearanceStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface ClearanceRequest {
  id: string;
  user_id: string;
  status: ClearanceStatus; // Final status
  approvals: Record<string, { status: 'cleared' | 'pending' | 'issues'; approved_by?: string; date?: string; }>; // JSONB Keyed by Lab ID or Code
  certificate_code?: string;
  created_at: string;

  // Join
  profiles?: Profile;
}

// UI Helpers
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  returned: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-200 text-red-900',
  cancelled: 'bg-gray-100 text-gray-600',
  cleared: 'bg-green-100 text-green-800',
  issues_found: 'bg-red-100 text-red-800'
};
