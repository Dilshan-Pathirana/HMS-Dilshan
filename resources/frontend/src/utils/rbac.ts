/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides consistent role checking and permission management
 * for the frontend application.
 */

// Role definitions
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    BRANCH_ADMIN: 'branch_admin',
    CASHIER: 'cashier',
    PHARMACIST: 'pharmacist',
    DOCTOR: 'doctor',
    NURSE: 'nurse',
    RECEPTIONIST: 'receptionist',
    PATIENT: 'patient',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY: Record<string, number> = {
    super_admin: 100,
    branch_admin: 80,
    pharmacist: 60,
    cashier: 50,
    doctor: 50,
    nurse: 40,
    receptionist: 30,
    patient: 10,
};

// Permission definitions
export const PERMISSIONS = {
    // POS Permissions
    POS_VIEW: 'pos:view',
    POS_CREATE_TRANSACTION: 'pos:create_transaction',
    POS_VOID_TRANSACTION: 'pos:void_transaction',
    POS_APPLY_DISCOUNT: 'pos:apply_discount',
    POS_ACCESS_ALL_BRANCHES: 'pos:access_all_branches',
    
    // EOD Permissions
    EOD_SUBMIT: 'eod:submit',
    EOD_APPROVE: 'eod:approve',
    EOD_REJECT: 'eod:reject',
    EOD_FLAG: 'eod:flag',
    EOD_VIEW_ALL: 'eod:view_all',
    
    // Inventory Permissions
    INVENTORY_VIEW: 'inventory:view',
    INVENTORY_ADJUST: 'inventory:adjust',
    INVENTORY_TRANSFER: 'inventory:transfer',
    
    // User Management
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',
    USER_VIEW_ALL_BRANCHES: 'user:view_all_branches',
    
    // Reports
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    REPORTS_ALL_BRANCHES: 'reports:all_branches',
    
    // Audit
    AUDIT_VIEW: 'audit:view',
    AUDIT_VIEW_ALL_BRANCHES: 'audit:view_all_branches',
    
    // Branch Management
    BRANCH_VIEW: 'branch:view',
    BRANCH_CREATE: 'branch:create',
    BRANCH_EDIT: 'branch:edit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    super_admin: Object.values(PERMISSIONS), // Super admin has all permissions
    
    branch_admin: [
        PERMISSIONS.POS_VIEW,
        PERMISSIONS.POS_CREATE_TRANSACTION,
        PERMISSIONS.POS_VOID_TRANSACTION,
        PERMISSIONS.POS_APPLY_DISCOUNT,
        PERMISSIONS.EOD_APPROVE,
        PERMISSIONS.EOD_REJECT,
        PERMISSIONS.EOD_FLAG,
        PERMISSIONS.EOD_VIEW_ALL,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.INVENTORY_TRANSFER,
        PERMISSIONS.USER_CREATE,
        PERMISSIONS.USER_EDIT,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.AUDIT_VIEW,
        PERMISSIONS.BRANCH_VIEW,
    ],
    
    cashier: [
        PERMISSIONS.POS_VIEW,
        PERMISSIONS.POS_CREATE_TRANSACTION,
        PERMISSIONS.EOD_SUBMIT,
        PERMISSIONS.REPORTS_VIEW,
    ],
    
    pharmacist: [
        PERMISSIONS.POS_VIEW,
        PERMISSIONS.POS_CREATE_TRANSACTION,
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_ADJUST,
        PERMISSIONS.REPORTS_VIEW,
    ],
    
    doctor: [
        PERMISSIONS.REPORTS_VIEW,
    ],
    
    nurse: [
        PERMISSIONS.REPORTS_VIEW,
    ],
    
    receptionist: [
        PERMISSIONS.POS_VIEW,
        PERMISSIONS.REPORTS_VIEW,
    ],
    
    patient: [],
};

/**
 * User interface for role checking
 */
export interface AuthUser {
    id: number;
    role: string;
    role_as?: number;
    branch_id?: number;
    first_name?: string;
    last_name?: string;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole | UserRole[]): boolean {
    if (!user) return false;
    
    const userRole = normalizeRole(user);
    
    if (Array.isArray(role)) {
        return role.some(r => r === userRole);
    }
    
    return userRole === role;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
    if (!user) return false;
    
    const userRole = normalizeRole(user);
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    
    return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
    if (!user) return false;
    
    return permissions.some(p => hasPermission(user, p));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: AuthUser | null, permissions: Permission[]): boolean {
    if (!user) return false;
    
    return permissions.every(p => hasPermission(user, p));
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
    return hasRole(user, ROLES.SUPER_ADMIN);
}

/**
 * Check if user is branch admin
 */
export function isBranchAdmin(user: AuthUser | null): boolean {
    return hasRole(user, ROLES.BRANCH_ADMIN);
}

/**
 * Check if user is any admin (super or branch)
 */
export function isAdmin(user: AuthUser | null): boolean {
    return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN]);
}

/**
 * Check if user can access all branches
 */
export function canAccessAllBranches(user: AuthUser | null): boolean {
    return hasPermission(user, PERMISSIONS.POS_ACCESS_ALL_BRANCHES);
}

/**
 * Check if user can access a specific branch
 */
export function canAccessBranch(user: AuthUser | null, branchId: number): boolean {
    if (!user) return false;
    
    // Super admins can access any branch
    if (isSuperAdmin(user)) return true;
    
    // Others can only access their own branch
    return user.branch_id === branchId;
}

/**
 * Get the effective branch ID for a user
 * For super admins, returns null (can select any)
 * For others, returns their assigned branch
 */
export function getEffectiveBranchId(user: AuthUser | null): number | null {
    if (!user) return null;
    
    if (isSuperAdmin(user)) return null; // Can select any
    
    return user.branch_id || null;
}

/**
 * Normalize user role from different formats
 */
function normalizeRole(user: AuthUser): string {
    // If role is already a string, use it
    if (user.role && typeof user.role === 'string') {
        return user.role.toLowerCase();
    }
    
    // Map role_as to role string
    const roleAsMap: Record<number, string> = {
        1: 'super_admin',
        2: 'branch_admin',
        3: 'cashier',
        4: 'pharmacist',
        5: 'doctor',
        6: 'nurse',
        7: 'patient',
    };
    
    if (user.role_as && roleAsMap[user.role_as]) {
        return roleAsMap[user.role_as];
    }
    
    return 'unknown';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
    const displayNames: Record<string, string> = {
        super_admin: 'Super Admin',
        branch_admin: 'Branch Admin',
        cashier: 'Cashier',
        pharmacist: 'Pharmacist',
        doctor: 'Doctor',
        nurse: 'Nurse',
        receptionist: 'Receptionist',
        patient: 'Patient',
    };
    
    return displayNames[role.toLowerCase()] || role;
}

/**
 * Compare role hierarchy levels
 * Returns positive if role1 > role2, negative if role1 < role2, 0 if equal
 */
export function compareRoles(role1: string, role2: string): number {
    const level1 = ROLE_HIERARCHY[role1.toLowerCase()] || 0;
    const level2 = ROLE_HIERARCHY[role2.toLowerCase()] || 0;
    return level1 - level2;
}

/**
 * Check if user role is at least a certain level
 */
export function hasMinimumRole(user: AuthUser | null, minimumRole: UserRole): boolean {
    if (!user) return false;
    
    const userRole = normalizeRole(user);
    return compareRoles(userRole, minimumRole) >= 0;
}

export default {
    ROLES,
    PERMISSIONS,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    isBranchAdmin,
    isAdmin,
    canAccessAllBranches,
    canAccessBranch,
    getEffectiveBranchId,
    getRoleDisplayName,
    compareRoles,
    hasMinimumRole,
};
