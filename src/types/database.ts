export type UserRole = 'admin' | 'lab_admin' | 'student' | 'faculty';

export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  student_id: string | null;
  phone: string | null;
  assigned_labs: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  schema_name: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuthUser {
  user: User;
  session: any;
}
