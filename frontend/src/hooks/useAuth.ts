import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useMemo } from 'react';

/**
 * User interface matching what we store in Redux
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
 * Hook to access authentication state and user info
 * 
 * Usage:
 * const { user, isAuthenticated, branchId } = useAuth();
 */
export function useAuth() {
    const authState = useSelector((state: RootState) => state.auth);
    
    // Map role_as (number) to role (string) for consistency
    const roleMap: Record<number, string> = {
        1: 'super_admin',
        2: 'branch_admin',
        3: 'doctor',
        4: 'nurse',
        5: 'patient',
        6: 'cashier',
        7: 'pharmacist',
        8: 'it_support',
        9: 'center_aid',
        10: 'auditor',
    };
    
    const user = useMemo((): AuthUser | null => {
        if (!authState.isAuthenticated || !authState.userId) {
            return null;
        }
        
        // Get stored user from localStorage if available for additional details
        let storedUser: any = null;
        try {
            const userString = localStorage.getItem('user');
            if (userString) {
                storedUser = JSON.parse(userString);
            }
        } catch (e) {
            // Ignore parsing errors
        }
        
        return {
            id: typeof authState.userId === 'string' 
                ? parseInt(authState.userId, 10) 
                : authState.userId as number,
            role: roleMap[authState.userRole] || authState.userType || 'unknown',
            role_as: authState.userRole,
            branch_id: typeof authState.branchId === 'string' 
                ? parseInt(authState.branchId, 10) || undefined
                : authState.branchId as number | undefined,
            first_name: storedUser?.first_name,
            last_name: storedUser?.last_name,
        };
    }, [authState]);
    
    return {
        user,
        isAuthenticated: authState.isAuthenticated,
        loading: authState.loading,
        userRole: authState.userRole,
        userType: authState.userType,
        branchId: authState.branchId,
        branchName: authState.branchName,
        token: authState.userToken,
        
        // Convenience getters
        isSuperAdmin: authState.userRole === 1,
        isBranchAdmin: authState.userRole === 2,
        isAdmin: authState.userRole === 1 || authState.userRole === 2,
        isDoctor: authState.userRole === 3,
        isNurse: authState.userRole === 4,
        isPatient: authState.userRole === 5,
        isCashier: authState.userRole === 6,
        isPharmacist: authState.userRole === 7,
    };
}

export default useAuth;
