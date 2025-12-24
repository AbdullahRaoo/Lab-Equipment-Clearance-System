export interface Equipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  status: 'available' | 'borrowed' | 'maintenance' | 'retired';
  metadata: Record<string, any>;
  borrowed_by: string | null;
  borrowed_at: string | null;
  expected_return_date: string | null;
  location: string | null;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  equipment_id: string;
  reported_by: string;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  equipment_id: string;
  user_id: string;
  borrowed_at: string;
  returned_at: string;
  expected_return_date: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'late';
  is_late: boolean;
  late_days: number;
  condition_on_return: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null;
  condition_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  penalty_applied: boolean;
  penalty_amount: number;
  penalty_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentWithUser extends Equipment {
  borrower?: {
    full_name: string;
    email: string;
    student_id: string | null;
  };
}

export interface IssueWithDetails extends Issue {
  equipment?: Equipment;
  reporter?: {
    full_name: string;
    email: string;
  };
}

export type LabSchema = 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5';
