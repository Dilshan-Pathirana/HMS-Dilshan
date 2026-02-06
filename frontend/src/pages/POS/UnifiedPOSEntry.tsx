/**
 * Unified POS Entry Point
 * 
 * This component serves as the single entry point for the POS system.
 * It automatically routes users to the appropriate POS interface based on their role:
 * - Super Admin: Global POS dashboard with branch selection
 * - Branch Admin: Branch-specific POS dashboard with analytics
 * - Cashier: Direct access to billing interface
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const UnifiedPOSEntry = () => {
    const navigate = useNavigate();
    const { isAuthenticated, userRole, loading, isSuperAdmin, isBranchAdmin, isCashier, isPharmacist } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Route based on role
        if (isSuperAdmin) {
            // Super Admin gets global POS view with branch selection
            navigate('/super-admin/pos');
        } else if (isBranchAdmin) {
            // Branch Admin gets branch-specific dashboard
            navigate('/branch-admin/pos');
        } else if (isCashier) {
            // Cashier goes directly to billing
            navigate('/cashier/billing');
        } else if (isPharmacist) {
            // Pharmacist goes to pharmacy POS
            navigate('/pharmacist/pos');
        } else {
            // Fallback for other roles
            navigate('/dashboard');
        }
    }, [isAuthenticated, userRole, loading, navigate, isSuperAdmin, isBranchAdmin, isCashier, isPharmacist]);

    // Show loading while determining role
    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
            <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-neutral-600">Loading POS System...</p>
            </div>
        </div>
    );
};

export default UnifiedPOSEntry;
