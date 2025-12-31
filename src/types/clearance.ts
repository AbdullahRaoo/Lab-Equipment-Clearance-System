// =====================================================
// TypeScript Type Definitions for Clearance System
// =====================================================

export type ClearanceStatus = 'pending' | 'in_review' | 'approved' | 'rejected';
export type LabClearanceStatus = 'pending' | 'cleared' | 'issues_found';
export type ClearanceRequestType = 'graduation' | 'transfer' | 'withdrawal' | 'course_completion';

// Lab schema identifier
export type LabSchema = 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5';

// Clearance Request entity
export interface ClearanceRequest {
  id: string;
  user_id: string;
  status: ClearanceStatus;
  request_type: ClearanceRequestType;
  reason?: string;

  // Individual lab statuses
  lab1_status: LabClearanceStatus;
  lab2_status: LabClearanceStatus;
  lab3_status: LabClearanceStatus;
  lab4_status: LabClearanceStatus;
  lab5_status: LabClearanceStatus;

  // Lab-specific notes
  lab1_notes?: string;
  lab2_notes?: string;
  lab3_notes?: string;
  lab4_notes?: string;
  lab5_notes?: string;

  // Review tracking
  lab1_reviewed_by?: string;
  lab2_reviewed_by?: string;
  lab3_reviewed_by?: string;
  lab4_reviewed_by?: string;
  lab5_reviewed_by?: string;

  lab1_reviewed_at?: Date;
  lab2_reviewed_at?: Date;
  lab3_reviewed_at?: Date;
  lab4_reviewed_at?: Date;
  lab5_reviewed_at?: Date;

  // Final approval
  final_approved_by?: string;
  final_approved_at?: Date;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  valid_until?: Date;
}

// Clearance eligibility check result
export interface ClearanceEligibility {
  lab_schema: LabSchema;
  is_eligible: boolean;
  borrowed_equipment_count: number;
  overdue_returns_count: number;
  unpaid_issues_count: number;
  total_unpaid_amount: number;
  issues: string[];
}

// Full clearance request details with user info
export interface ClearanceRequestDetails extends ClearanceRequest {
  user_name: string;
  user_email: string;
  borrowed_equipment_count: number;
  unpaid_issues_count: number;
  total_unpaid_amount: number;
}

// Borrowed equipment across all labs
export interface BorrowedEquipmentAllLabs {
  lab_schema: LabSchema;
  equipment_id: string;
  equipment_name: string;
  category: string;
  borrowed_at: Date;
  due_date: Date;
  is_overdue: boolean;
  days_overdue: number;
}

// Unpaid issues across all labs
export interface UnpaidIssueAllLabs {
  lab_schema: LabSchema;
  issue_id: string;
  issue_type: string;
  description: string;
  severity: string;
  fine_amount: number;
  total_amount: number;
  reported_at: Date;
  equipment_name?: string;
}

// Cross-lab statistics
export interface CrossLabStatistics {
  lab_schema: LabSchema;
  total_equipment: number;
  available_equipment: number;
  borrowed_equipment: number;
  in_maintenance_equipment: number;
  active_issues: number;
  active_users: number;
  total_fines_collected: number;
}

// Lab statistics aggregate
export interface LabStatisticsAggregate {
  total_equipment_all_labs: number;
  total_available_all_labs: number;
  total_borrowed_all_labs: number;
  total_maintenance_all_labs: number;
  total_active_issues_all_labs: number;
  total_active_users_all_labs: number;
  total_fines_collected_all_labs: number;
  lab_breakdown: CrossLabStatistics[];
}

// Clearance report summary
export interface ClearanceReportSummary {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  in_review_requests: number;
  avg_processing_days: number;
}

// Active clearance request view
export interface ActiveClearanceRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  student_id?: string;
  status: ClearanceStatus;
  request_type: ClearanceRequestType;
  lab1_status: LabClearanceStatus;
  lab2_status: LabClearanceStatus;
  lab3_status: LabClearanceStatus;
  lab4_status: LabClearanceStatus;
  lab5_status: LabClearanceStatus;
  created_at: Date;
  valid_until?: Date;
  all_labs_cleared: boolean;
}

// Form data for creating clearance request
export interface CreateClearanceRequestData {
  request_type: ClearanceRequestType;
  reason?: string;
}

// Form data for updating lab clearance status
export interface UpdateLabClearanceStatusData {
  request_id: string;
  lab_schema: LabSchema;
  status: LabClearanceStatus;
  notes?: string;
}

// Lab name mapping
export const LAB_NAMES: Record<LabSchema, string> = {
  lab1: 'Robotic Lab',
  lab2: 'DLD Lab',
  lab3: 'IOT Lab',
  lab4: 'Embedded Design Lab',
  lab5: 'Computer & Network Lab'
};

// Request type labels
export const REQUEST_TYPE_LABELS: Record<ClearanceRequestType, string> = {
  graduation: 'Graduation',
  transfer: 'Transfer to Another Institution',
  withdrawal: 'Course Withdrawal',
  course_completion: 'Course Completion'
};

// Status badges
export const STATUS_COLORS: Record<ClearanceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export const LAB_STATUS_COLORS: Record<LabClearanceStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  cleared: 'bg-green-100 text-green-800',
  issues_found: 'bg-red-100 text-red-800'
};
