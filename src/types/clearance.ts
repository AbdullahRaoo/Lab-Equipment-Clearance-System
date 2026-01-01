// =====================================================
// NUTECH ECMS V3 Type Definitions
// =====================================================

// Role Hierarchy (Level 1 = Highest)
export type UserRole =
  | 'hod'                // Level 1
  | 'pro_hod'            // Level 2
  | 'oic_cen_labs'       // Level 3
  | 'asst_oic_cen_labs'  // Level 4
  | 'lab_engineer'       // Level 5
  | 'lab_assistant'      // Level 6
  | 'student';           // Level 7

export const ROLE_LEVELS: Record<UserRole, number> = {
  hod: 1,
  pro_hod: 2,
  oic_cen_labs: 3,
  asst_oic_cen_labs: 4,
  lab_engineer: 5,
  lab_assistant: 6,
  student: 7
};

export const ROLE_LABELS: Record<UserRole, string> = {
  hod: 'Head of Department',
  pro_hod: 'Pro HOD',
  oic_cen_labs: 'OIC CEN Labs',
  asst_oic_cen_labs: 'Asst. OIC CEN Labs',
  lab_engineer: 'Lab Engineer',
  lab_assistant: 'Lab Assistant',
  student: 'Student'
};

export const ROLE_COLORS: Record<UserRole, string> = {
  hod: 'bg-purple-100 text-purple-800 border-purple-300',
  pro_hod: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  oic_cen_labs: 'bg-blue-100 text-blue-800 border-blue-300',
  asst_oic_cen_labs: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  lab_engineer: 'bg-teal-100 text-teal-800 border-teal-300',
  lab_assistant: 'bg-green-100 text-green-800 border-green-300',
  student: 'bg-gray-100 text-gray-800 border-gray-300'
};

// Request Status Pipeline
export type RequestStatus =
  | 'submitted'
  | 'stage1_pending'
  | 'stage1_approved'
  | 'stage2_pending'
  | 'stage2_approved'
  | 'stage3_pending'
  | 'approved'
  | 'handed_over'
  | 'returned'
  | 'rejected';

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Submitted',
  stage1_pending: 'Awaiting Lab Staff',
  stage1_approved: 'Lab Staff Approved',
  stage2_pending: 'Awaiting OIC Approval',
  stage2_approved: 'OIC Approved',
  stage3_pending: 'Awaiting HOD Approval',
  approved: 'Approved - Ready for Pickup',
  handed_over: 'Equipment Handed Over',
  returned: 'Returned - Complete',
  rejected: 'Rejected'
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  stage1_pending: 'bg-yellow-100 text-yellow-800',
  stage1_approved: 'bg-orange-100 text-orange-800',
  stage2_pending: 'bg-purple-100 text-purple-800',
  stage2_approved: 'bg-indigo-100 text-indigo-800',
  stage3_pending: 'bg-pink-100 text-pink-800',
  approved: 'bg-green-100 text-green-800',
  handed_over: 'bg-cyan-100 text-cyan-800',
  returned: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-800'
};

export const LAB_STATUS_COLORS = STATUS_COLORS; // Alias

// Inventory Status
export type InventoryStatus = 'available' | 'borrowed' | 'maintenance' | 'lost' | 'retired';

// Entities
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
  secondary_role?: UserRole;
  reg_no?: string;
  department?: string;
  contact_no?: string;
  reliability_score?: number;
  assigned_lab_id?: string;
  secondary_lab_id?: string;
  avatar_url?: string;
  is_active?: boolean;
  notification_preferences?: {
    email: boolean;
    in_app: boolean;
  };
  // Joins
  labs?: Lab;
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
  supplier?: string;
  maintenance_interval_days?: number;
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
  group_members?: { name: string; reg_no?: string }[];
  supervisor_name?: string;

  status: RequestStatus;
  current_stage: number;
  rejection_reason?: string;
  rejection_stage?: number;

  // Stage 1 Approval (Lab Staff)
  stage1_approved_by?: string;
  stage1_approved_at?: string;

  // Stage 2 Approval (OIC - Both required)
  stage2_oic_approved_by?: string;
  stage2_oic_approved_at?: string;
  stage2_asst_approved_by?: string;
  stage2_asst_approved_at?: string;

  // Stage 3 Approval (HOD/Pro-HOD)
  stage3_approved_by?: string;
  stage3_approved_at?: string;

  // Handover/Return
  handed_over_by?: string;
  handed_over_at?: string;
  returned_received_by?: string;
  returned_at?: string;

  rejected_by?: string;
  rejected_at?: string;

  created_at: string;
  updated_at?: string;

  // Joins
  profiles?: Profile;
  labs?: Lab;
  borrow_request_items?: { inventory: InventoryItem }[];

  // Approval profile joins (for display)
  stage1_approver?: Profile;
  stage2_oic_approver?: Profile;
  stage2_asst_approver?: Profile;
  stage3_approver?: Profile;
}

// Helper Functions
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  const managerLevel = ROLE_LEVELS[managerRole];
  const targetLevel = ROLE_LEVELS[targetRole];

  if (managerRole === 'hod') return true;
  if (managerRole === 'pro_hod' && targetRole !== 'hod') return true;
  if (managerRole === 'oic_cen_labs' && targetLevel > 2) return true;
  if (managerRole === 'asst_oic_cen_labs' && targetLevel > 3) return true;

  return false;
}

export function canApproveStage(role: UserRole, stage: number): boolean {
  switch (stage) {
    case 1:
      return role === 'lab_engineer' || role === 'lab_assistant';
    case 2:
      return role === 'oic_cen_labs' || role === 'asst_oic_cen_labs';
    case 3:
      return role === 'hod' || role === 'pro_hod';
    default:
      return false;
  }
}

export function isAdminRole(role: UserRole): boolean {
  return ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);
}

export function canAccessUserManagement(role: UserRole): boolean {
  return ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);
}

// Lab Names for display
export const LAB_NAMES: Record<string, string> = {
  'ROBO': 'Robotic Lab',
  'DLD': 'DLD Lab',
  'IOT': 'IOT Lab',
  'EMB': 'Embedded Design Lab',
  'CNET': 'Computer & Network Lab'
};
