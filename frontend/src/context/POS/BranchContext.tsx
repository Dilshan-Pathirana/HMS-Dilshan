import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "../../utils/api/axios";
import { useUserRole, useUserBranch } from "../../utils/state/checkAuthenticatedUserStates";

// Role constants
const SUPER_ADMIN = 1;
const BRANCH_ADMIN = 2;
const CASHIER = 3;

export interface Branch {
    id: string;
    name: string;
    center_name?: string;
    city: string;
    address: string;
    phone: string;
}

export interface BranchContextType {
    // Selected branch for operations
    selectedBranch: Branch | null;
    setSelectedBranch: (branch: Branch | null) => void;

    // All available branches (for Super Admin dropdown)
    branches: Branch[];
    isLoadingBranches: boolean;

    // Whether branch can be changed (Super Admin: true, others: false)
    canChangeBranch: boolean;

    // User's own branch (for Branch Admin / Cashier)
    userBranchId: string;
    userBranchName: string;

    // Refresh branches list
    refreshBranches: () => Promise<void>;

    // Helper to get the active branch ID for API calls
    getActiveBranchId: () => string;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
    children: ReactNode;
}

/**
 * Branch Context Provider for POS System
 *
 * Handles branch context based on user role:
 * - Super Admin: Can select any branch from dropdown
 * - Branch Admin & Cashier: Branch is auto-selected based on their assignment (read-only)
 */
export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
    const userRole = useUserRole();
    const { branchId: userBranchId, branchName: userBranchName } = useUserBranch();

    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Determine if user can change branch (only Super Admin)
    const canChangeBranch = userRole === SUPER_ADMIN;

    // Load branches for Super Admin
    useEffect(() => {
        if (canChangeBranch) {
            loadBranches();
        }
    }, [canChangeBranch]);

    // Auto-select branch for Branch Admin / Cashier
    useEffect(() => {
        if (!canChangeBranch && userBranchId) {
            // For non-super-admin users, auto-set their branch
            setSelectedBranch({
                id: userBranchId,
                name: userBranchName || "My Branch",
                city: "",
                address: "",
                phone: ""
            });
        }
    }, [canChangeBranch, userBranchId, userBranchName]);

    const loadBranches = async () => {
        setIsLoadingBranches(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("authToken");
            // Axios interceptor returns response.data directly (not wrapped in AxiosResponse)
            const data: any = await api.get("/super-admin/pos/branches", {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle different response formats - data might be { branches: [] } or just []
            const branchList = data?.branches || data || [];
            console.log("Loaded branches:", branchList);
            setBranches(branchList);
            // Auto-select first branch if none selected
            if (!selectedBranch && branchList.length > 0) {
                setSelectedBranch(branchList[0]);
            }
        } catch (err) {
            console.error("Error loading branches:", err);
            setBranches([]);
        } finally {
            setIsLoadingBranches(false);
        }
    };

    const refreshBranches = async () => {
        if (canChangeBranch) {
            await loadBranches();
        }
    };

    // Get the active branch ID for API calls
    const getActiveBranchId = (): string => {
        if (canChangeBranch) {
            return selectedBranch?.id || "";
        }
        return userBranchId || "";
    };

    const value: BranchContextType = {
        selectedBranch,
        setSelectedBranch,
        branches,
        isLoadingBranches,
        canChangeBranch,
        userBranchId,
        userBranchName,
        refreshBranches,
        getActiveBranchId
    };

    return (
        <BranchContext.Provider value={value}>
            {children}
        </BranchContext.Provider>
    );
};

/**
 * Hook to use the branch context
 */
export const useBranchContext = (): BranchContextType => {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranchContext must be used within a BranchProvider");
    }
    return context;
};

/**
 * Hook to check if user is Super Admin
 */
export const useIsSuperAdmin = (): boolean => {
    const userRole = useUserRole();
    return userRole === SUPER_ADMIN;
};

/**
 * Hook to check if user is Branch Admin
 */
export const useIsBranchAdmin = (): boolean => {
    const userRole = useUserRole();
    return userRole === BRANCH_ADMIN;
};

/**
 * Hook to check if user is Cashier
 */
export const useIsCashier = (): boolean => {
    const userRole = useUserRole();
    return userRole === CASHIER;
};

export default BranchContext;
