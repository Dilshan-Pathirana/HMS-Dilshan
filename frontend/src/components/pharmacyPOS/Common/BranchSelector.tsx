import React from "react";
import { Building2, Lock } from "lucide-react";
import { useBranchContext } from "../../../context/POS/BranchContext";

interface BranchSelectorProps {
    className?: string;
    showLabel?: boolean;
    compact?: boolean;
}

/**
 * Branch Selector Component for POS
 * 
 * Behavior based on user role:
 * - Super Admin: Dropdown to select any branch
 * - Branch Admin & Cashier: Read-only display of assigned branch
 */
const BranchSelector: React.FC<BranchSelectorProps> = ({ 
    className = "", 
    showLabel = true,
    compact = false 
}) => {
    const {
        selectedBranch,
        setSelectedBranch,
        branches,
        isLoadingBranches,
        canChangeBranch,
        userBranchName
    } = useBranchContext();

    // For Super Admin - Dropdown selector
    if (canChangeBranch) {
        return (
            <div className={`${className}`}>
                {showLabel && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Building2 className="w-4 h-4 inline-block mr-1" />
                        Select Branch
                    </label>
                )}
                <select
                    value={selectedBranch?.id || ""}
                    onChange={(e) => {
                        const branch = branches.find(b => b.id === e.target.value);
                        setSelectedBranch(branch || null);
                    }}
                    disabled={isLoadingBranches}
                    className={`border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        compact ? "px-2 py-1 text-sm" : "px-3 py-2"
                    } ${isLoadingBranches ? "bg-gray-100" : "bg-white"} w-full`}
                >
                    <option value="">-- Select Branch --</option>
                    {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                            {branch.center_name || branch.name} - {branch.city}
                        </option>
                    ))}
                </select>
                {selectedBranch && !compact && (
                    <p className="text-xs text-gray-500 mt-1">
                        {selectedBranch.address}, {selectedBranch.city}
                    </p>
                )}
            </div>
        );
    }

    // For Branch Admin & Cashier - Read-only display
    return (
        <div className={`${className}`}>
            {showLabel && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="w-4 h-4 inline-block mr-1" />
                    Your Branch
                </label>
            )}
            <div className={`flex items-center border rounded-lg bg-gray-50 ${
                compact ? "px-2 py-1" : "px-3 py-2"
            }`}>
                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                <span className={`text-gray-700 font-medium ${compact ? "text-sm" : ""}`}>
                    {selectedBranch?.name || userBranchName || "No Branch Assigned"}
                </span>
            </div>
            {!compact && (
                <p className="text-xs text-gray-500 mt-1">
                    Branch is automatically assigned based on your account
                </p>
            )}
        </div>
    );
};

/**
 * Compact Branch Badge - Shows current branch in a badge format
 */
export const BranchBadge: React.FC<{ className?: string }> = ({ className = "" }) => {
    const { selectedBranch, userBranchName, canChangeBranch } = useBranchContext();
    
    const branchName = selectedBranch?.name || userBranchName || "No Branch";
    
    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            canChangeBranch 
                ? "bg-blue-100 text-blue-700" 
                : "bg-green-100 text-green-700"
        } ${className}`}>
            <Building2 className="w-4 h-4 mr-1" />
            <span className="font-medium">{branchName}</span>
            {!canChangeBranch && <Lock className="w-3 h-3 ml-1 opacity-60" />}
        </div>
    );
};

export default BranchSelector;
