import React, { ChangeEvent } from "react";
import Select from "react-select";
import { PharmacistEditFormProps } from "../../../../../utils/types/users/IUserEdit.ts";

export const PharmacistEditForm: React.FC<PharmacistEditFormProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
    handleBranchChange,
}) => {
    if (!userDetails) {
        return <div>Loading user details...</div>;
    }

    const selectedBranch = branchOptions.find(
        (option) => option.value === userDetails?.pharmacists_branch_id,
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

    const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        handleInputChange({
            target: {
                name,
                value,
            },
        } as ChangeEvent<HTMLInputElement>);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Edit Pharmacist Details</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        First Name
                    </label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={userDetails?.first_name || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Last Name
                    </label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={userDetails?.last_name || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_email"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="pharmacists_email"
                        name="pharmacists_email"
                        value={userDetails?.pharmacists_email || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_branch_id"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Branch
                    </label>
                    <Select
                        id="pharmacists_branch_id"
                        name="pharmacists_branch_id"
                        options={branchOptions}
                        value={selectedBranch}
                        onChange={handleBranchChange}
                        className="mt-1"
                        placeholder="Select Branch"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_contact_number_mobile"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        id="pharmacists_contact_number_mobile"
                        name="pharmacists_contact_number_mobile"
                        value={
                            userDetails?.pharmacists_contact_number_mobile || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_contact_number_landline"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Landline Number
                    </label>
                    <input
                        type="tel"
                        id="pharmacists_contact_number_landline"
                        name="pharmacists_contact_number_landline"
                        value={
                            userDetails?.pharmacists_contact_number_landline ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_date_of_birth"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        id="pharmacists_date_of_birth"
                        name="pharmacists_date_of_birth"
                        value={userDetails?.pharmacists_date_of_birth || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_gender"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Gender
                    </label>
                    <select
                        id="pharmacists_gender"
                        name="pharmacists_gender"
                        value={userDetails?.pharmacists_gender || ""}
                        onChange={handleSelectChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_nic_number"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        NIC Number
                    </label>
                    <input
                        type="text"
                        id="pharmacists_nic_number"
                        name="pharmacists_nic_number"
                        value={userDetails?.pharmacists_nic_number || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_pharmacist_registration_number"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Registration Number
                    </label>
                    <input
                        type="text"
                        id="pharmacists_pharmacist_registration_number"
                        name="pharmacists_pharmacist_registration_number"
                        value={
                            userDetails?.pharmacists_pharmacist_registration_number ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_license_validity_date"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        License Validity Date
                    </label>
                    <input
                        type="date"
                        id="pharmacists_license_validity_date"
                        name="pharmacists_license_validity_date"
                        value={
                            userDetails?.pharmacists_license_validity_date || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_qualifications"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Qualifications
                    </label>
                    <input
                        type="text"
                        id="pharmacists_qualifications"
                        name="pharmacists_qualifications"
                        value={userDetails?.pharmacists_qualifications || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_years_of_experience"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Years of Experience
                    </label>
                    <input
                        type="number"
                        id="pharmacists_years_of_experience"
                        name="pharmacists_years_of_experience"
                        value={
                            userDetails?.pharmacists_years_of_experience || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_employee_id"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Employee ID
                    </label>
                    <input
                        type="text"
                        id="pharmacists_employee_id"
                        name="pharmacists_employee_id"
                        value={userDetails?.pharmacists_employee_id || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                        readOnly
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_joining_date"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Joining Date
                    </label>
                    <input
                        type="date"
                        id="pharmacists_joining_date"
                        name="pharmacists_joining_date"
                        value={userDetails?.pharmacists_joining_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_contract_type"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Contract Type
                    </label>
                    <select
                        id="pharmacists_contract_type"
                        name="pharmacists_contract_type"
                        value={userDetails?.pharmacists_contract_type || ""}
                        onChange={handleSelectChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    >
                        <option value="">Select Contract Type</option>
                        <option value="full-time">Full-Time</option>
                        <option value="part-time">Part-Time</option>
                        <option value="consultant">Consultant</option>
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_contract_duration"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Contract Duration
                    </label>
                    <input
                        type="text"
                        id="pharmacists_contract_duration"
                        name="pharmacists_contract_duration"
                        value={userDetails?.pharmacists_contract_duration || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_compensation_package"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Compensation Package
                    </label>
                    <input
                        type="number"
                        id="pharmacists_compensation_package"
                        name="pharmacists_compensation_package"
                        value={
                            userDetails?.pharmacists_compensation_package || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                        step="0.01"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_probation_start_date"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Probation Start Date
                    </label>
                    <input
                        type="date"
                        id="pharmacists_probation_start_date"
                        name="pharmacists_probation_start_date"
                        value={
                            userDetails?.pharmacists_probation_start_date || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_probation_end_date"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Probation End Date
                    </label>
                    <input
                        type="date"
                        id="pharmacists_probation_end_date"
                        name="pharmacists_probation_end_date"
                        value={
                            userDetails?.pharmacists_probation_end_date || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="pharmacists_home_address"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Home Address
                    </label>
                    <textarea
                        id="pharmacists_home_address"
                        name="pharmacists_home_address"
                        value={userDetails?.pharmacists_home_address || ""}
                        onChange={handleTextAreaChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_emergency_contact_info"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Emergency Contact Info
                    </label>
                    <input
                        type="text"
                        id="pharmacists_emergency_contact_info"
                        name="pharmacists_emergency_contact_info"
                        value={
                            userDetails?.pharmacists_emergency_contact_info ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="pharmacists_previous_employment"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Previous Employment
                    </label>
                    <input
                        type="text"
                        id="pharmacists_previous_employment"
                        name="pharmacists_previous_employment"
                        value={
                            userDetails?.pharmacists_previous_employment || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                    />
                </div>
            </div>
        </div>
    );
};
