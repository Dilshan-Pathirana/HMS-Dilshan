import React from "react";
import Select from "react-select";

interface StaffEditFormProps {
    userDetails: any;
    branchOptions: any[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBranchChange: (selectedOption: any) => void;
    roleAs?: number;
}

export const StaffEditForm: React.FC<StaffEditFormProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
    handleBranchChange,
    roleAs,
}) => {
    const isSuperAdmin = roleAs === 1;
    const selectedBranch = branchOptions.find(
        (option) => option.value === userDetails.branch_id
    );

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Edit Staff User</h2>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        First Name <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="first_name"
                        value={userDetails.first_name || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Last Name <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="last_name"
                        value={userDetails.last_name || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Email <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={userDetails.email || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Phone <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={userDetails.phone || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        NIC <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="nic"
                        value={userDetails.nic || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Date of Birth <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="date"
                        name="date_of_birth"
                        value={userDetails.date_of_birth || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Gender <span className="text-error-500">*</span>
                    </label>
                    <select
                        name="gender"
                        value={userDetails.gender || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {!isSuperAdmin && (
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Branch <span className="text-error-500">*</span>
                        </label>
                        <Select
                            name="branch_id"
                            value={selectedBranch}
                            onChange={handleBranchChange}
                            options={branchOptions}
                            className="w-full"
                            placeholder="Select Branch"
                            isClearable
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Joining Date
                    </label>
                    <input
                        type="date"
                        name="joining_date"
                        value={userDetails.joining_date || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Basic Salary
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        name="basic_salary"
                        value={userDetails.basic_salary || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Address
                    </label>
                    <textarea
                        name="address"
                        value={userDetails.address || ""}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>
        </div>
    );
};
