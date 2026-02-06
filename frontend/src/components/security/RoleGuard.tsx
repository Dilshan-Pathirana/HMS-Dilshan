import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
    hasRole, 
    hasPermission, 
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isBranchAdmin,
    isAdmin,
    canAccessBranch,
    UserRole,
    Permission,
    AuthUser
} from '../../utils/rbac';

interface RoleGuardProps {
    children: React.ReactNode;
    /**
     * Single role or array of roles required (user must have one of them)
     */
    roles?: UserRole | UserRole[];
    /**
     * Single permission or array of permissions required
     * By default, user must have ANY of the permissions
     */
    permissions?: Permission | Permission[];
    /**
     * If true, user must have ALL specified permissions (not just any)
     */
    requireAll?: boolean;
    /**
     * Fallback content when access is denied
     */
    fallback?: React.ReactNode;
    /**
     * If true, render nothing when access denied (instead of fallback)
     */
    hideOnly?: boolean;
    /**
     * Optional branch ID to check access for
     */
    branchId?: number;
}

/**
 * Component that conditionally renders children based on user role/permissions
 * 
 * Usage:
 * <RoleGuard roles="super_admin">
 *   <SuperAdminPanel />
 * </RoleGuard>
 * 
 * <RoleGuard permissions={['pos:view', 'pos:create_transaction']} requireAll>
 *   <POSInterface />
 * </RoleGuard>
 */
export function RoleGuard({
    children,
    roles,
    permissions,
    requireAll = false,
    fallback = null,
    hideOnly = false,
    branchId,
}: RoleGuardProps): React.ReactElement | null {
    const { user } = useAuth();
    
    // Check branch access if branchId is provided
    if (branchId && !canAccessBranch(user as AuthUser, branchId)) {
        return hideOnly ? null : <>{fallback}</>;
    }
    
    // Check roles
    if (roles) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        if (!hasRole(user as AuthUser, roleArray)) {
            return hideOnly ? null : <>{fallback}</>;
        }
    }
    
    // Check permissions
    if (permissions) {
        const permArray = Array.isArray(permissions) ? permissions : [permissions];
        
        if (requireAll) {
            if (!hasAllPermissions(user as AuthUser, permArray)) {
                return hideOnly ? null : <>{fallback}</>;
            }
        } else {
            if (!hasAnyPermission(user as AuthUser, permArray)) {
                return hideOnly ? null : <>{fallback}</>;
            }
        }
    }
    
    return <>{children}</>;
}

/**
 * Guard for Super Admin only content
 */
export function SuperAdminGuard({ 
    children, 
    fallback = null 
}: { 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { user } = useAuth();
    
    if (!isSuperAdmin(user as AuthUser)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

/**
 * Guard for Branch Admin only content
 */
export function BranchAdminGuard({ 
    children, 
    fallback = null 
}: { 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { user } = useAuth();
    
    if (!isBranchAdmin(user as AuthUser)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

/**
 * Guard for any admin (super or branch) content
 */
export function AdminGuard({ 
    children, 
    fallback = null 
}: { 
    children: React.ReactNode; 
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { user } = useAuth();
    
    if (!isAdmin(user as AuthUser)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

/**
 * Guard that shows content only if user can access a specific branch
 */
export function BranchAccessGuard({ 
    children, 
    branchId,
    fallback = null 
}: { 
    children: React.ReactNode; 
    branchId: number;
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { user } = useAuth();
    
    if (!canAccessBranch(user as AuthUser, branchId)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

/**
 * Permission-based guard component
 */
export function PermissionGuard({
    children,
    permission,
    fallback = null,
}: {
    children: React.ReactNode;
    permission: Permission;
    fallback?: React.ReactNode;
}): React.ReactElement | null {
    const { user } = useAuth();
    
    if (!hasPermission(user as AuthUser, permission)) {
        return <>{fallback}</>;
    }
    
    return <>{children}</>;
}

/**
 * Access denied component for displaying instead of protected content
 */
export function AccessDenied({ 
    message = 'You do not have permission to access this content.',
    showBackButton = true,
}: {
    message?: string;
    showBackButton?: boolean;
}): React.ReactElement {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 mb-4 text-error-500">
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Access Denied
            </h3>
            <p className="text-neutral-600 mb-4">
                {message}
            </p>
            {showBackButton && (
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    Go Back
                </button>
            )}
        </div>
    );
}

export default RoleGuard;
