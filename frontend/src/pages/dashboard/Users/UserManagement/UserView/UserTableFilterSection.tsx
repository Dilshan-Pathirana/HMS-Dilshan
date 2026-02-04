import React from "react";
import { Search, Building2, UserCheck } from "lucide-react";
import { MultiSelect } from "react-multi-select-component";
import { MultiSelectOption } from "../../../../../utils/types/Appointment/IAppointment.ts";
import { UserTableFilterSectionProps } from "../../../../../utils/types/users/Iuser.ts";

const UserTableFilterSection: React.FC<UserTableFilterSectionProps> = ({
    searchTerm,
    branchDropDownOptions,
    selectedBranch,
    roleDropDownOptions,
    selectedRole,
    setSearchTerm,
    setSelectedBranch,
    setSelectedRole,
}) => {
    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-gray-50 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col w-full lg:w-1/3">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Search className="mr-2 text-gray-500 w-4 h-4" />
                    Search Users
                </label>
                <div className="relative">
                    <Search className="absolute w-4 h-4 text-gray-400 left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex flex-col w-full lg:w-1/3">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Building2 className="mr-2 text-gray-500 w-4 h-4" />
                    Filter by Branch
                </label>
                <div className="relative">
                    <MultiSelect
                        options={branchDropDownOptions || []}
                        value={selectedBranch}
                        onChange={(selected: MultiSelectOption[]) => {
                            setSelectedBranch(selected.slice(-1));
                        }}
                        labelledBy="Select Branch"
                        hasSelectAll={false}
                        overrideStrings={{
                            selectSomeItems: "Select branch...",
                            allItemsAreSelected: "All branches selected",
                            selectAll: "Select All",
                            search: "Search branches",
                        }}
                        className="border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex flex-col w-full lg:w-1/3">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <UserCheck className="mr-2 text-gray-500 w-4 h-4" />
                    Filter by Role
                </label>
                <div className="relative">
                    <MultiSelect
                        options={roleDropDownOptions || []}
                        value={selectedRole}
                        onChange={(selected: MultiSelectOption[]) => {
                            setSelectedRole(selected.slice(-1));
                        }}
                        labelledBy="Select Role"
                        hasSelectAll={false}
                        overrideStrings={{
                            selectSomeItems: "Select role...",
                            allItemsAreSelected: "All roles selected",
                            selectAll: "Select All",
                            search: "Search roles",
                        }}
                        className="border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default UserTableFilterSection;
