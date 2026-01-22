import React, { ChangeEvent, useEffect } from "react";
import Select from "react-select";
import { CashierEditFormProps } from "../../../../../utils/types/users/IUserEdit.ts";

export const CashierEditForm: React.FC<CashierEditFormProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
    handleBranchChange,
}) => {
    useEffect(() => {}, [userDetails]);

    const selectedBranch = branchOptions.find(
        (option) => option.value === userDetails?.cashiers_branch_id,
    );

    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        handleInputChange({
            target: {
                name,
                value,
            },
        } as ChangeEvent<HTMLInputElement>);
    };

    if (!userDetails) {
        return <div>Loading user details...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Edit Cashier Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        First Name
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={userDetails?.first_name || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Last Name
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={userDetails?.last_name || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="cashiers_email"
                        name="cashiers_email"
                        value={userDetails?.cashiers_email || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_branch_id"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Branch
                    </label>
                    <Select
                        id="cashiers_branch_id"
                        name="cashiers_branch_id"
                        options={branchOptions}
                        value={selectedBranch}
                        onChange={handleBranchChange}
                        className="mt-1"
                        placeholder="Select Branch"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_date_of_birth"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        id="cashiers_date_of_birth"
                        name="cashiers_date_of_birth"
                        value={userDetails?.cashiers_date_of_birth || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_gender"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Gender
                    </label>
                    <select
                        id="cashiers_gender"
                        name="cashiers_gender"
                        value={userDetails?.cashiers_gender || ""}
                        onChange={handleSelectChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_nic_number"
                        className="block text-sm font-medium text-gray-700"
                    >
                        NIC Number
                    </label>
                    <input
                        type="text"
                        id="cashiers_nic_number"
                        name="cashiers_nic_number"
                        value={userDetails?.cashiers_nic_number || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_contact_number_mobile"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        id="cashiers_contact_number_mobile"
                        name="cashiers_contact_number_mobile"
                        value={
                            userDetails?.cashiers_contact_number_mobile || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_contact_number_landline"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Landline Number
                    </label>
                    <input
                        type="tel"
                        id="cashiers_contact_number_landline"
                        name="cashiers_contact_number_landline"
                        value={
                            userDetails?.cashiers_contact_number_landline || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_emergency_contact_info"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Emergency Contact
                    </label>
                    <input
                        type="text"
                        id="cashiers_emergency_contact_info"
                        name="cashiers_emergency_contact_info"
                        value={
                            userDetails?.cashiers_emergency_contact_info || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label
                    htmlFor="cashiers_home_address"
                    className="block text-sm font-medium text-gray-700"
                >
                    Home Address
                </label>
                <input
                    type="text"
                    id="cashiers_home_address"
                    name="cashiers_home_address"
                    value={userDetails?.cashiers_home_address || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_employee_id"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Employee ID
                    </label>
                    <input
                        type="text"
                        id="cashiers_employee_id"
                        name="cashiers_employee_id"
                        value={userDetails?.cashiers_employee_id || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                        readOnly
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_joining_date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Joining Date
                    </label>
                    <input
                        type="date"
                        id="cashiers_joining_date"
                        name="cashiers_joining_date"
                        value={userDetails?.cashiers_joining_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_qualifications"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Qualifications
                    </label>
                    <input
                        type="text"
                        id="cashiers_qualifications"
                        name="cashiers_qualifications"
                        value={userDetails?.cashiers_qualifications || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_contract_type"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Contract Type
                    </label>
                    <select
                        id="cashiers_contract_type"
                        name="cashiers_contract_type"
                        value={userDetails?.cashiers_contract_type || ""}
                        onChange={handleSelectChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                    >
                        <option value="">Select Contract Type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="consultant">Consultant</option>
                        <option value="contract">Contract</option>
                        <option value="temporary">Temporary</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="cashiers_years_of_experience"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Years of Experience
                    </label>
                    <input
                        type="number"
                        id="cashiers_years_of_experience"
                        name="cashiers_years_of_experience"
                        value={userDetails?.cashiers_years_of_experience || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="cashiers_contract_duration"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Contract Duration (years)
                    </label>
                    <input
                        type="text"
                        id="cashiers_contract_duration"
                        name="cashiers_contract_duration"
                        value={userDetails?.cashiers_contract_duration || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label
                    htmlFor="cashiers_compensation_package"
                    className="block text-sm font-medium text-gray-700"
                >
                    Compensation Package
                </label>
                <input
                    type="text"
                    id="cashiers_compensation_package"
                    name="cashiers_compensation_package"
                    value={userDetails?.cashiers_compensation_package || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                />
            </div>
        </div>
    );
};
