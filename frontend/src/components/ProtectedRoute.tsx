import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    allowedRoles?: string[];
}

// Map numeric role IDs to string role names
const roleIdToName: { [key: number]: string } = {
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

/**
 * A wrapper component that protects routes requiring authentication.
 * Optionally restricts access to specific roles.
 * This component properly uses hooks at the top level to avoid
 * the "Rendered more hooks than during the previous render" error.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    redirectTo = '/',
    allowedRoles
}) => {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const userRoleId = useSelector((state: RootState) => state.auth.userRole);

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Check role-based access if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        // Get role name from the numeric role ID
        const userRoleName = roleIdToName[userRoleId] || '';

        if (!allowedRoles.includes(userRoleName)) {
            // Redirect unauthorized users to their appropriate dashboard
            const dashboardRedirects: { [key: string]: string } = {
                'super_admin': '/dashboard/branch',
                'branch_admin': '/branch-admin/dashboard',
                'doctor': '/doctor/dashboard',
                'nurse': '/nurse-dashboard',
                'pharmacist': '/pharmacy-dashboard',
                'cashier': '/cashier/pos',
                'receptionist': '/reception/dashboard',
                'patient': '/my-appointments',
            };
            const fallbackPath = dashboardRedirects[userRoleName] || '/';
            return <Navigate to={fallbackPath} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
