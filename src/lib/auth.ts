/**
 * Authentication and Authorization Utilities
 * Helper functions for checking user permissions and roles
 */

import { createClient } from '@/lib/supabase/server';
import {
  Role,
  Permission,
  roleHasPermission,
  roleHasAllPermissions,
  roleHasAnyPermission,
  isValidRole,
} from './permissions';

// =====================================================
// USER CONTEXT
// =====================================================

export interface UserContext {
  id: number;
  auth_id: string;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get current authenticated user with profile
 */
export async function getCurrentUser(): Promise<UserContext | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const { data: userData, error } = await supabase.rpc('get_user_by_auth_id', {
      p_auth_id: authUser.id,
    });

    if (error || !userData || userData.length === 0) {
      return null;
    }

    return userData[0] as UserContext;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication - throws if user not authenticated
 */
export async function requireAuth(): Promise<UserContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// =====================================================
// PERMISSION CHECKS
// =====================================================

/**
 * Check if current user has a specific permission
 */
export async function userHasPermission(permission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !isValidRole(user.role)) {
    return false;
  }
  return roleHasPermission(user.role, permission);
}

/**
 * Check if current user has ALL specified permissions
 */
export async function userHasAllPermissions(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !isValidRole(user.role)) {
    return false;
  }
  return roleHasAllPermissions(user.role, permissions);
}

/**
 * Check if current user has ANY of the specified permissions
 */
export async function userHasAnyPermission(permissions: Permission[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !isValidRole(user.role)) {
    return false;
  }
  return roleHasAnyPermission(user.role, permissions);
}

/**
 * Require specific permission - throws if user doesn't have it
 */
export async function requirePermission(permission: Permission): Promise<UserContext> {
  const user = await requireAuth();
  if (!isValidRole(user.role) || !roleHasPermission(user.role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
  return user;
}

/**
 * Require ALL of the specified permissions - throws if user doesn't have them
 */
export async function requireAllPermissions(permissions: Permission[]): Promise<UserContext> {
  const user = await requireAuth();
  if (!isValidRole(user.role) || !roleHasAllPermissions(user.role, permissions)) {
    throw new Error(`Permission denied: requires all of ${permissions.join(', ')}`);
  }
  return user;
}

/**
 * Require ANY of the specified permissions - throws if user doesn't have any
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<UserContext> {
  const user = await requireAuth();
  if (!isValidRole(user.role) || !roleHasAnyPermission(user.role, permissions)) {
    throw new Error(`Permission denied: requires one of ${permissions.join(', ')}`);
  }
  return user;
}

// =====================================================
// ROLE CHECKS
// =====================================================

/**
 * Check if current user has a specific role
 */
export async function userHasRole(role: Role): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if current user has ANY of the specified roles
 */
export async function userHasAnyRole(roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Require specific role - throws if user doesn't have it
 */
export async function requireRole(role: Role): Promise<UserContext> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error(`Role required: ${role}`);
  }
  return user;
}

/**
 * Require ANY of the specified roles - throws if user doesn't have any
 */
export async function requireAnyRole(roles: Role[]): Promise<UserContext> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(`Role required: one of ${roles.join(', ')}`);
  }
  return user;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return userHasRole('admin');
}

/**
 * Require admin role - throws if user is not admin
 */
export async function requireAdmin(): Promise<UserContext> {
  return requireRole('admin');
}
