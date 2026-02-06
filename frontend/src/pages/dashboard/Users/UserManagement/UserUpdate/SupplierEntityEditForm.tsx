import React from "react";

interface SupplierEntityEditFormProps {
    userDetails: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SupplierEntityEditForm: React.FC<SupplierEntityEditFormProps> = ({
    userDetails,
    handleInputChange,
}) => {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Edit Supplier Entity User</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        First Name <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="first_name"
                        value={userDetails?.first_name || ""}
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
                        value={userDetails?.last_name || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Username <span className="text-error-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={userDetails?.username || ""}
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
                        value={userDetails?.email || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="text"
                        name="phone"
                        value={userDetails?.phone || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Status
                    </label>
                    <select
                        name="is_active"
                        value={userDetails?.is_active || "1"}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Address
                    </label>
                    <textarea
                        name="address"
                        value={userDetails?.address || ""}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>
        </div>
    );
};
