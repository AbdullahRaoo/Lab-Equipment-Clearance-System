/**
 * Permission and Role Management System
 * Defines role hierarchy, permissions, and access control logic
 */

// =====================================================
// ROLE DEFINITIONS
// =====================================================

export const ROLES = {
  ADMIN: 'admin',
  LAB_ADMIN: 'lab_admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// =====================================================
// PERMISSION DEFINITIONS
// =====================================================

export const PERMISSIONS = {
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_LAB: 'user:assign_lab',
  USER_CHANGE_ROLE: 'user:change_role',

  // Equipment Management
  EQUIPMENT_CREATE: 'equipment:create',
  EQUIPMENT_READ: 'equipment:read',
  EQUIPMENT_UPDATE: 'equipment:update',
  EQUIPMENT_DELETE: 'equipment:delete',
  EQUIPMENT_BORROW: 'equipment:borrow',
  EQUIPMENT_RETURN: 'equipment:return',

  // Issue Management
  ISSUE_CREATE: 'issue:create',
  ISSUE_READ: 'issue:read',
  ISSUE_UPDATE: 'issue:update',
  ISSUE_RESOLVE: 'issue:resolve',
  ISSUE_DELETE: 'issue:delete',

  // Clearance Management
  CLEARANCE_CREATE: 'clearance:create',
  CLEARANCE_READ: 'clearance:read',
  CLEARANCE_APPROVE: 'clearance:approve',
  CLEARANCE_REJECT: 'clearance:reject',
  CLEARANCE_READ_ALL: 'clearance:read_all',

  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',

  // Lab Management
  LAB_MANAGE: 'lab:manage',
  LAB_VIEW_ALL: 'lab:view_all',

  // Audit Logs
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// =====================================================
// ROLE-PERMISSION MAPPING
// =====================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.ADMIN]: [
    // Admins have ALL permissions
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ASSIGN_LAB,
    PERMISSIONS.USER_CHANGE_ROLE,
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_UPDATE,
    PERMISSIONS.EQUIPMENT_DELETE,
    PERMISSIONS.EQUIPMENT_BORROW,
    PERMISSIONS.EQUIPMENT_RETURN,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.ISSUE_UPDATE,
    PERMISSIONS.ISSUE_RESOLVE,
    PERMISSIONS.ISSUE_DELETE,
    PERMISSIONS.CLEARANCE_CREATE,
    PERMISSIONS.CLEARANCE_READ,
    PERMISSIONS.CLEARANCE_APPROVE,
    PERMISSIONS.CLEARANCE_REJECT,
    PERMISSIONS.CLEARANCE_READ_ALL,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.LAB_MANAGE,
    PERMISSIONS.LAB_VIEW_ALL,
    PERMISSIONS.AUDIT_VIEW,
  ],

  [ROLES.LAB_ADMIN]: [
    // Lab admins can manage their assigned lab(s)
    PERMISSIONS.USER_READ,
    PERMISSIONS.EQUIPMENT_CREATE,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_UPDATE,
    PERMISSIONS.EQUIPMENT_DELETE,
    PERMISSIONS.EQUIPMENT_BORROW,
    PERMISSIONS.EQUIPMENT_RETURN,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.ISSUE_UPDATE,
    PERMISSIONS.ISSUE_RESOLVE,
    PERMISSIONS.CLEARANCE_READ,
    PERMISSIONS.CLEARANCE_APPROVE,
    PERMISSIONS.CLEARANCE_REJECT,
    PERMISSIONS.CLEARANCE_READ_ALL, // Can see all requests for their lab
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.LAB_MANAGE,
  ],

  [ROLES.FACULTY]: [
    // Faculty can view and borrow equipment, report issues
    PERMISSIONS.USER_READ,
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_BORROW,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.CLEARANCE_CREATE,
    PERMISSIONS.CLEARANCE_READ,
  ],

  [ROLES.STUDENT]: [
    // Students have limited permissions
    PERMISSIONS.EQUIPMENT_READ,
    PERMISSIONS.EQUIPMENT_BORROW,
    PERMISSIONS.ISSUE_CREATE,
    PERMISSIONS.ISSUE_READ,
    PERMISSIONS.CLEARANCE_CREATE,
    PERMISSIONS.CLEARANCE_READ,
  ],
};

// =====================================================
// ROLE HIERARCHY
// =====================================================

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.ADMIN]: 4,
  [ROLES.LAB_ADMIN]: 3,
  [ROLES.FACULTY]: 2,
  [ROLES.STUDENT]: 1,
};

// =====================================================
// PERMISSION CHECKING FUNCTIONS
// =====================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions
 */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every((permission) => rolePermissions.includes(permission));
}

/**
 * Check if a role has ANY of the specified permissions
 */
export function roleHasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some((permission) => rolePermissions.includes(permission));
}

/**
 * Check if one role has higher authority than another
 */
export function roleIsHigherThan(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Check if one role has higher or equal authority to another
 */
export function roleIsHigherOrEqualTo(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Validate if a role exists
 */
export function isValidRole(role: string): role is Role {
  return Object.values(ROLES).includes(role as Role);
}
