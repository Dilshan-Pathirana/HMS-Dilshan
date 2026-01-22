/**
 * POS Context Provider
 * 
 * Provides centralized state management for the POS system including:
 * - Current branch context
 * - User permissions
 * - POS configuration
 * - Low stock alerts
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { usePOSAccess } from '../../hooks/useRBAC';

interface Branch {
    id: number;
    name: string;
    type?: string;
    address?: string;
    city?: string;
    phone?: string;
}

interface LowStockItem {
    name: string;
    code: string;
    current_stock: number;
    reorder_level: number;
}

interface POSStats {
    total_sales: number;
    transaction_count: number;
    cash_in: number;
    cash_out: number;
    net_cash: number;
}

interface POSContextType {
    // Branch context
    currentBranch: Branch | null;
    availableBranches: Branch[];
    setCurrentBranch: (branch: Branch | null) => void;
    
    // Stats
    todayStats: POSStats | null;
    refreshStats: () => Promise<void>;
    
    // Permissions (from RBAC)
    canCreateTransaction: boolean;
    canVoidTransaction: boolean;
    canApplyDiscount: boolean;
    canSubmitEOD: boolean;
    canApproveEOD: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    
    // Low stock alerts
    lowStockItems: LowStockItem[];
    addLowStockAlert: (items: LowStockItem[]) => void;
    clearLowStockAlerts: () => void;
    
    // EOD status
    isEodLocked: boolean;
    setIsEodLocked: (locked: boolean) => void;
    
    // Loading state
    isLoading: boolean;
    error: string | null;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

interface POSProviderProps {
    children: ReactNode;
}

export const POSProvider: React.FC<POSProviderProps> = ({ children }) => {
    const { user, isSuperAdmin: isSuperAdminUser, isBranchAdmin: isBranchAdminUser, branchId } = useAuth();
    const posAccess = usePOSAccess();
    
    // State
    const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
    const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
    const [todayStats, setTodayStats] = useState<POSStats | null>(null);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
    const [isEodLocked, setIsEodLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Get API endpoint based on user role
    const getApiEndpoint = useCallback(() => {
        if (isSuperAdminUser) {
            return '/api/super-admin/pos';
        } else if (isBranchAdminUser) {
            return '/api/branch-admin/pos';
        } else {
            return '/api/cashier-billing';
        }
    }, [isSuperAdminUser, isBranchAdminUser]);
    
    // Fetch available branches (for super admin)
    const fetchBranches = useCallback(async () => {
        if (!isSuperAdminUser) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/super-admin/pos/branches', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.status === 200) {
                setAvailableBranches(response.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching branches:', err);
        }
    }, [isSuperAdminUser]);
    
    // Refresh stats
    const refreshStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = `${getApiEndpoint()}/dashboard-stats`;
            
            const params: Record<string, any> = {};
            if (isSuperAdminUser && currentBranch) {
                params.branch_id = currentBranch.id;
            }
            
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            
            if (response.data.status === 200) {
                const data = response.data.data;
                setTodayStats(data.today_stats);
                setIsEodLocked(data.is_eod_locked || false);
                
                // Set branch info if available
                if (data.branch && !currentBranch) {
                    setCurrentBranch({
                        id: data.branch.id,
                        name: data.branch.name,
                        type: data.branch.type,
                        address: data.branch.address,
                        city: data.branch.city,
                        phone: data.branch.phone,
                    });
                }
            }
        } catch (err: any) {
            console.error('Error refreshing stats:', err);
            setError(err.response?.data?.message || 'Failed to fetch POS data');
        } finally {
            setIsLoading(false);
        }
    }, [getApiEndpoint, isSuperAdminUser, currentBranch]);
    
    // Add low stock alerts
    const addLowStockAlert = useCallback((items: LowStockItem[]) => {
        setLowStockItems(prev => {
            // Avoid duplicates
            const existing = new Set(prev.map(i => i.code));
            const newItems = items.filter(i => !existing.has(i.code));
            return [...prev, ...newItems];
        });
    }, []);
    
    // Clear low stock alerts
    const clearLowStockAlerts = useCallback(() => {
        setLowStockItems([]);
    }, []);
    
    // Initialize on mount
    useEffect(() => {
        if (user) {
            fetchBranches();
            refreshStats();
        }
    }, [user, fetchBranches, refreshStats]);
    
    // Set default branch for non-super-admin users
    useEffect(() => {
        if (!isSuperAdminUser && branchId && !currentBranch) {
            // For non-super-admin, set their assigned branch
            setCurrentBranch({
                id: parseInt(branchId as string, 10) || 0,
                name: '', // Will be populated from API
            });
        }
    }, [isSuperAdminUser, branchId, currentBranch]);
    
    const value: POSContextType = {
        // Branch context
        currentBranch,
        availableBranches,
        setCurrentBranch,
        
        // Stats
        todayStats,
        refreshStats,
        
        // Permissions
        canCreateTransaction: posAccess.canCreateTransaction,
        canVoidTransaction: posAccess.canVoidTransaction,
        canApplyDiscount: posAccess.canApplyDiscount,
        canSubmitEOD: posAccess.canSubmitEOD,
        canApproveEOD: posAccess.canApproveEOD,
        isAdmin: posAccess.isAdmin,
        isSuperAdmin: isSuperAdminUser,
        
        // Low stock
        lowStockItems,
        addLowStockAlert,
        clearLowStockAlerts,
        
        // EOD
        isEodLocked,
        setIsEodLocked,
        
        // Loading
        isLoading,
        error,
    };
    
    return (
        <POSContext.Provider value={value}>
            {children}
        </POSContext.Provider>
    );
};

/**
 * Hook to use POS context
 */
export const usePOS = (): POSContextType => {
    const context = useContext(POSContext);
    if (context === undefined) {
        throw new Error('usePOS must be used within a POSProvider');
    }
    return context;
};

export default POSProvider;
