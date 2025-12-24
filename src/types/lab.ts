// Lab Equipment Types (Lab 1 & Lab 2)

export type EquipmentStatus = 'available' | 'borrowed' | 'maintenance' | 'damaged' | 'retired';
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
export type IssueType = 'damage' | 'malfunction' | 'lost' | 'late_return' | 'other';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ReturnStatus = 'pending' | 'returned' | 'overdue' | 'lost';

// Equipment Metadata structure (JSONB)
export interface EquipmentMetadata {
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  specifications?: Record<string, any>;
  warranty_expiry?: string;
  last_calibration?: string;
  next_calibration?: string;
  [key: string]: any; // Allow additional flexible properties
}

// Inventory Table
export interface Equipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  category: string;
  metadata: EquipmentMetadata;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_borrower_id: string | null;
  borrowed_at: string | null;
  expected_return_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Issues Table
export interface Issue {
  id: string;
  equipment_id: string;
  reported_by: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  status: IssueStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  damage_cost: number;
  fine_amount: number;
  paid: boolean;
  attachments: string[]; // Array of file URLs
  created_at: string;
  updated_at: string;
}

// Returns Table
export interface Return {
  id: string;
  equipment_id: string;
  borrower_id: string;
  borrowed_date: string;
  expected_return_date: string;
  actual_return_date: string | null;
  status: ReturnStatus;
  condition_on_return: EquipmentCondition | null;
  return_notes: string | null;
  inspected_by: string | null;
  is_late: boolean;
  days_overdue: number;
  late_fee: number;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface EquipmentWithBorrower extends Equipment {
  borrower?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface IssueWithDetails extends Issue {
  equipment?: Equipment;
  reporter?: {
    id: string;
    full_name: string;
    email: string;
  };
  resolver?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

export interface ReturnWithDetails extends Return {
  equipment?: Equipment;
  borrower?: {
    id: string;
    full_name: string;
    email: string;
    student_id?: string;
  };
  inspector?: {
    id: string;
    full_name: string;
  } | null;
}

// API Request/Response types
export interface BorrowEquipmentRequest {
  equipment_id: string;
  expected_return_date: string;
  notes?: string;
}

export interface ReturnEquipmentRequest {
  return_id: string;
  condition_on_return: EquipmentCondition;
  return_notes?: string;
}

export interface CreateIssueRequest {
  equipment_id: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
}

export interface ResolveIssueRequest {
  issue_id: string;
  resolution: string;
  damage_cost?: number;
  fine_amount?: number;
}

// Lab-specific types
export type LabSchema = 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5';

export interface LabInventoryStats {
  total_equipment: number;
  available: number;
  borrowed: number;
  maintenance: number;
  damaged: number;
  retired: number;
}

export interface LabIssueStats {
  total_issues: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}
