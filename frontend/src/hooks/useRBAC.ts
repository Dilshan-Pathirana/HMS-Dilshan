import { useMemo } from 'react';
import { useAuth } from './useAuth';
import {
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isBranchAdmin,
    isAdmin,
    canAccessBranch,
    canAccessAllBranches,
    getEffectiveBranchId,
    getRoleDisplayName,
    hasMinimumRole,
    UserRole,
    Permission,
    AuthUser,
    ROLES,
    PERMISSIONS,
} from '../utils/rbac';

interface UseRBACResult {
    // User info
    user: AuthUser | null;
    role: string | null;
    roleDisplayName: string;
    branchId: number | null;
    
    // Role checks
    isSuperAdmin: boolean;
    isBranchAdmin: boolean;
    isAdmin: boolean;
    
    // Permission checks
    hasRole: (role: UserRole | UserRole[]) => boolean;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
    hasMinimumRole: (minimumRole: UserRole) => boolean;
    
    // Branch access
    canAccessBranch: (branchId: number) => boolean;
    canAccessAllBranches: boolean;
    effectiveBranchId: number | null;
    
    // POS-specific permissions
    canCreateTransaction: boolean;
    canVoidTransaction: boolean;
    canApplyDiscount: boolean;
    canSubmitEOD: boolean;
    canApproveEOD: boolean;
    canViewAuditLogs: boolean;
    canManageInventory: boolean;
    
    // Constants for reference
    ROLES: typeof ROLES;
    PERMISSIONS: typeof PERMISSIONS;
}

/**
 * Hook for role-based access control in React components
 * 
 * Usage:
 * const { isSuperAdmin, hasPermission, canAccessBranch } = useRBAC();
 * 
 * if (isSuperAdmin) {
 *   // Show super admin features
 * }
 * 
 * if (hasPermission('pos:void_transaction')) {
 *   // Show void button
 * }
 */
export function useRBAC(): UseRBACResult {
    const { user } = useAuth();
    
    return useMemo(() => {
        const authUser = user as AuthUser | null;
        
        // Memoized role checks
        const isSuperAdminCheck = isSuperAdmin(authUser);
        const isBranchAdminCheck = isBranchAdmin(authUser);
        const isAdminCheck = isAdmin(authUser);
        
        // Get normalized role
        const normalizedRole = authUser?.role?.toLowerCase() || null;
        
        return {
            // User info
            user: authUser,
            role: normalizedRole,
            roleDisplayName: normalizedRole ? getRoleDisplayName(normalizedRole) : 'Unknown',
            branchId: authUser?.branch_id || null,
            
            // Role checks
            isSuperAdmin: isSuperAdminCheck,
            isBranchAdmin: isBranchAdminCheck,
            isAdmin: isAdminCheck,
            
            // Permission checks (functions)
            hasRole: (role: UserRole | UserRole[]) => hasRole(authUser, role),
            hasPermission: (permission: Permission) => hasPermission(authUser, permission),
            hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(authUser, permissions),
            hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(authUser, permissions),
            hasMinimumRole: (minimumRole: UserRole) => hasMinimumRole(authUser, minimumRole),
            
            // Branch access
            canAccessBranch: (branchId: number) => canAccessBranch(authUser, branchId),
            canAccessAllBranches: canAccessAllBranches(authUser),
            effectiveBranchId: getEffectiveBranchId(authUser),
            
            // POS-specific permissions (pre-computed for convenience)
            canCreateTransaction: hasPermission(authUser, PERMISSIONS.POS_CREATE_TRANSACTION),
            canVoidTransaction: hasPermission(authUser, PERMISSIONS.POS_VOID_TRANSACTION),
            canApplyDiscount: hasPermission(authUser, PERMISSIONS.POS_APPLY_DISCOUNT),
            canSubmitEOD: hasPermission(authUser, PERMISSIONS.EOD_SUBMIT),
            canApproveEOD: hasPermission(authUser, PERMISSIONS.EOD_APPROVE),
            canViewAuditLogs: hasPermission(authUser, PERMISSIONS.AUDIT_VIEW),
            canManageInventory: hasPermission(authUser, PERMISSIONS.INVENTORY_ADJUST),
            
            // Constants for reference
            ROLES,
            PERMISSIONS,
        };
    }, [user]);
}

/**
 * Hook specifically for branch access control
 * Useful when working with multi-branch operations
 */
export function useBranchAccess() {
    const { user } = useAuth();
    
    return useMemo(() => {
        const authUser = user as AuthUser | null;
        
        return {
            // Current user's branch
            userBranchId: authUser?.branch_id || null,
            
            // Can access any branch
            isMultiBranch: canAccessAllBranches(authUser),
            
            // Get effective branch ID (null for super admin = can select)
            effectiveBranchId: getEffectiveBranchId(authUser),
            
            // Check specific branch access
            canAccess: (branchId: number) => canAccessBranch(authUser, branchId),
            
            // Get the branch ID to use for API calls
            // For super admin, will need to select; for others, use their branch
            getApibranchId: (selectedBranchId?: number) => {
                if (isSuperAdmin(authUser)) {
                    return selectedBranchId || null;
                }
                return authUser?.branch_id || null;
            },
            
            // Validate that a branch selection is valid for this user
            validateSelection: (branchId: number) => {
                if (!branchId) return false;
                return canAccessBranch(authUser, branchId);
            },
        };
    }, [user]);
}

/**
 * Hook for checking if user can perform POS operations
 */
export function usePOSAccess() {
    const { user } = useAuth();
    
    return useMemo(() => {
        const authUser = user as AuthUser | null;
        
        return {
            canView: hasPermission(authUser, PERMISSIONS.POS_VIEW),
            canCreateTransaction: hasPermission(authUser, PERMISSIONS.POS_CREATE_TRANSACTION),
            canVoidTransaction: hasPermission(authUser, PERMISSIONS.POS_VOID_TRANSACTION),
            canApplyDiscount: hasPermission(authUser, PERMISSIONS.POS_APPLY_DISCOUNT),
            canAccessAllBranches: hasPermission(authUser, PERMISSIONS.POS_ACCESS_ALL_BRANCHES),
            
            // EOD permissions
            canSubmitEOD: hasPermission(authUser, PERMISSIONS.EOD_SUBMIT),
            canApproveEOD: hasPermission(authUser, PERMISSIONS.EOD_APPROVE),
            canRejectEOD: hasPermission(authUser, PERMISSIONS.EOD_REJECT),
            canFlagEOD: hasPermission(authUser, PERMISSIONS.EOD_FLAG),
            
            // User's role for specific UI variations
            isCashier: hasRole(authUser, ROLES.CASHIER),
            isPharmacist: hasRole(authUser, ROLES.PHARMACIST),
            isAdmin: isAdmin(authUser),
        };
    }, [user]);
}

export default useRBAC;
