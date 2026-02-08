import React from "react";
import { IBranchData } from "../../../../utils/types/Branch/IBranchData.ts";
import { MapPin, Phone, User, Info, Building2, Hash, Trash2 } from "lucide-react";

interface BranchCardListProps {
    branches: IBranchData[];
    onViewDetails: (branch: IBranchData) => void;
    onManageBranch: (branch: IBranchData) => void;
    onAssignStaff: (branch: IBranchData) => void;
    onDeleteBranch?: (branch: IBranchData) => void;
}

const BranchCardList: React.FC<BranchCardListProps> = ({
    branches,
    onViewDetails,
    onManageBranch,
    onAssignStaff,
    onDeleteBranch,
}) => {
    if (branches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-neutral-300 shadow-sm min-h-[300px]">
                <Building2 className="w-16 h-16 text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900">No Branches Found</h3>
                <p className="text-neutral-500 text-sm mt-1">Get started by creating a new branch.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {branches.map((branch) => (
                <div
                    key={branch.id}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 flex flex-col"
                >
                    {/* Top Decorative Line */}
                    <div className={`h-1.5 w-full ${branch.center_type === 'Main' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`} />

                    <div className="p-6 flex-grow">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                                <Building2 className={`w-6 h-6 ${branch.center_type === 'Main' ? 'text-purple-600' : 'text-blue-500'}`} />
                            </div>
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${branch.center_type === 'Main'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                {branch.center_type || 'Branch'}
                            </span>
                        </div>

                        {/* Title & Register No */}
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-neutral-800 mb-1 group-hover:text-primary-700 transition-colors line-clamp-1">
                                {branch.center_name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono bg-neutral-100 px-2 py-1 rounded-md w-fit">
                                <Hash className="w-3 h-3" />
                                {branch.register_number || 'No Reg No'}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors -mx-2">
                                <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="block text-neutral-800 font-medium leading-tight">
                                        {branch.division || "No Division"}
                                    </span>
                                    {branch.division_number && (
                                        <span className="text-xs text-neutral-500">
                                            Div No: {branch.division_number}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors -mx-2">
                                <User className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                <span className="text-sm text-neutral-700 font-medium line-clamp-1">
                                    {branch.owner_full_name || "No Owner Assigned"}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors -mx-2">
                                <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                                <span className="text-sm text-neutral-500 font-mono">
                                    {branch.owner_contact_number || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 grid grid-cols-1 gap-2">
                        <button
                            onClick={() => onViewDetails(branch)}
                            className="w-full py-2 px-3 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Info className="w-4 h-4" /> View Details
                        </button>
                        <div className={`grid gap-2 ${onDeleteBranch ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <button
                                onClick={() => onManageBranch(branch)}
                                className="py-2 px-3 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Building2 className="w-4 h-4" /> Manage
                            </button>
                            <button
                                onClick={() => onAssignStaff(branch)}
                                className="py-2 px-3 bg-primary-50 border border-primary-100 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-100 hover:border-primary-200 transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-4 h-4" /> Assign Staff
                            </button>
                            {onDeleteBranch && (
                                <button
                                    onClick={() => onDeleteBranch(branch)}
                                    className="py-2 px-3 bg-red-50 border border-red-100 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BranchCardList;
