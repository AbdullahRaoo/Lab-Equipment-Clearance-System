/**
 * Higher-Order Component (HOC) for route protection
 * Wraps page components to enforce authentication and authorization
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Role, Permission, roleHasPermission, roleHasAllPermissions } from '@/lib/permissions';

// =====================================================
// AUTHENTICATION GUARDS
// =====================================================

/**
 * Protect a page component - requires authentication
 * Usage: export default withAuth(YourPageComponent);
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>
) {
  return async function AuthenticatedComponent(props: P) {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Protect a page component - requires specific role
 * Usage: export default withRole(YourPageComponent, 'admin');
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>,
  requiredRole: Role
) {
  return async function RoleProtectedComponent(props: P) {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    if (user.role !== requiredRole) {
      redirect('/unauthorized');
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Protect a page component - requires ANY of the specified roles
 * Usage: export default withAnyRole(YourPageComponent, ['admin', 'lab_admin']);
 */
export function withAnyRole<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>,
  requiredRoles: Role[]
) {
  return async function RoleProtectedComponent(props: P) {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    if (!requiredRoles.includes(user.role)) {
      redirect('/unauthorized');
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Protect a page component - requires specific permission
 * Usage: export default withPermission(YourPageComponent, PERMISSIONS.USER_CREATE);
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>,
  requiredPermission: Permission
) {
  return async function PermissionProtectedComponent(props: P) {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    if (!roleHasPermission(user.role, requiredPermission)) {
      redirect('/unauthorized');
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Protect a page component - requires ALL specified permissions
 * Usage: export default withAllPermissions(YourPageComponent, [PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE]);
 */
export function withAllPermissions<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>,
  requiredPermissions: Permission[]
) {
  return async function PermissionsProtectedComponent(props: P) {
    const user = await getCurrentUser();

    if (!user) {
      redirect('/login');
    }

    if (!roleHasAllPermissions(user.role, requiredPermissions)) {
      redirect('/unauthorized');
    }

    return <Component {...props} user={user} />;
  };
}

/**
 * Admin-only page protection
 * Usage: export default withAdmin(YourPageComponent);
 */
export function withAdmin<P extends object>(
  Component: React.ComponentType<P & { user: Awaited<ReturnType<typeof getCurrentUser>> }>
) {
  return withRole(Component, 'admin');
}
