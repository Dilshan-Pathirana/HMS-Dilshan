import React, { useState, useEffect } from "react";
import Select, { MultiValue } from "react-select";
import {
    qualificationsOptions,
    specializationOptions,
} from "../../../../../utils/api/user/DoctorData.ts";
import { DoctorEditFormProps } from "../../../../../utils/types/users/IUserEdit.ts";
import DoctorEditFormStructure from "./DoctorEditFormStructure.tsx";

type SelectOption = {
    label: string;
    value: string;
};

export const DoctorEditForm: React.FC<DoctorEditFormProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
}) => {
    const [selectedSpecializations, setSelectedSpecializations] = useState<
        readonly SelectOption[]
    >([]);
    const [selectedQualification, setSelectedQualification] =
        useState<SelectOption | null>(null);
    const [selectedBranches, setSelectedBranches] = useState<
        readonly SelectOption[]
    >([]);

    const qualificationsSelectOptions = qualificationsOptions.map(
        (qualification) => ({
            label: qualification,
            value: qualification,
        }),
    );

    useEffect(() => {
        if (userDetails?.doctors_areas_of_specialization) {
            let specializations: string[] = [];
            if (
                typeof userDetails?.doctors_areas_of_specialization === "string"
            ) {
                specializations = userDetails?.doctors_areas_of_specialization
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter((s: string) => s !== "");
            } else if (
                Array.isArray(userDetails?.doctors_areas_of_specialization)
            ) {
                specializations = userDetails?.doctors_areas_of_specialization;
            }

            const mappedSpecializations = specializations.map(
                (spec: string) => {
                    const foundOption = specializationOptions.find(
                        (option) =>
                            option.value === spec || option.label === spec,
                    );
                    return (
                        foundOption || {
                            label:
                                spec.charAt(0).toUpperCase() +
                                spec.slice(1).toLowerCase(),
                            value: spec.toLowerCase(),
                        }
                    );
                },
            );

            setSelectedSpecializations(mappedSpecializations);
        }
        if ("doctors_branches" in userDetails || userDetails?.branch_ids) {
            let branches = [];

            if (userDetails?.branch_ids) {
                branches = Array.isArray(userDetails.branch_ids)
                    ? userDetails.branch_ids
                    : [userDetails.branch_ids];
            } else if (
                "doctors_branches" in userDetails &&
                userDetails.doctors_branches
            ) {
                if (Array.isArray(userDetails.doctors_branches)) {
                    branches = userDetails.doctors_branches;
                } else if (typeof userDetails.doctors_branches === "string") {
                    try {
                        branches = JSON.parse(userDetails.doctors_branches);
                    } catch {
                        branches = userDetails.doctors_branches.split(",");
                    }
                }
            }

            const mappedBranches = branches.map((branch: any) => {
                const branchId = branch.branch_id || branch.value || branch;
                const branchName =
                    branch.branch_center_name ||
                    branch.label ||
                    `Branch ${branchId}`;

                return (
                    branchOptions.find((opt) => opt.value === branchId) || {
                        value: branchId,
                        label: branchName,
                    }
                );
            });

            setSelectedBranches(mappedBranches);
        }
        if (userDetails?.doctors_qualifications) {
            const qual = userDetails.doctors_qualifications;
            const foundOption = qualificationsSelectOptions.find(
                (option) => option.value === qual || option.label === qual,
            );
            setSelectedQualification(
                foundOption || {
                    label: qual,
                    value: qual,
                },
            );
        }
    }, [
        userDetails?.branch_ids,
        branchOptions,
        userDetails?.doctors_qualifications,
        userDetails?.doctors_areas_of_specialization,
    ]);

    const handleSpecializationChange = (selectedOptions: any) => {
        const specializations = selectedOptions.map(
            (option: any) => option.value,
        );
        handleInputChange({
            target: {
                name: "doctors_areas_of_specialization",
                value: specializations,
            },
        } as React.ChangeEvent<HTMLInputElement>);
    };
    const handleMultiBranchChange = (newValue: MultiValue<SelectOption>) => {
        setSelectedBranches(newValue);
        const branchIds = newValue.map((option) => String(option.value));

        handleInputChange({
            target: {
                name: "branch_ids",
                value: branchIds,
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleQualificationChange = (newValue: SelectOption | null) => {
        setSelectedQualification(newValue);
        handleInputChange({
            target: {
                name: "doctors_qualifications",
                value: newValue ? newValue.value : "",
            },
        } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        handleInputChange({
            target: {
                name,
                value,
            },
        } as React.ChangeEvent<HTMLInputElement>);
    };

    if (!userDetails) {
        return <div>Loading user details...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Edit Doctor Details</h2>
            <DoctorEditFormStructure
                userDetails={{
                    ...userDetails,
                    photo: undefined,
                    nic_photo: undefined,
                }}
            />

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
                        value={userDetails.first_name || ""}
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
                        value={userDetails.last_name || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={userDetails.email || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="branches"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Branches
                    </label>
                    {branchOptions.length > 0 ? (
                        <Select
                            isMulti
                            id="branches"
                            name="branches"
                            options={branchOptions}
                            value={selectedBranches || []}
                            onChange={handleMultiBranchChange}
                            className="mt-1"
                            placeholder="Select Branches"
                        />
                    ) : (
                        <div className="mt-1 p-2 text-sm text-gray-500">
                            Loading branches...
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="date_of_birth"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Date of Birth
                    </label>
                    <input
                        type="date"
                        id="date_of_birth"
                        name="doctors_date_of_birth"
                        value={userDetails.doctors_date_of_birth || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Gender
                    </label>
                    <select
                        id="gender"
                        name="doctors_gender"
                        value={userDetails.doctors_gender || ""}
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
                        htmlFor="nic_number"
                        className="block text-sm font-medium text-gray-700"
                    >
                        NIC Number
                    </label>
                    <input
                        type="text"
                        id="nic_number"
                        name="doctors_nic_number"
                        value={userDetails.doctors_nic_number || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="contact_number_mobile"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Mobile Number
                    </label>
                    <input
                        type="tel"
                        id="contact_number_mobile"
                        name="doctors_contact_number_mobile"
                        value={userDetails.doctors_contact_number_mobile || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="contact_number_landline"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Landline Number
                    </label>
                    <input
                        type="tel"
                        id="contact_number_landline"
                        name="doctors_contact_number_landline"
                        value={
                            userDetails.doctors_contact_number_landline || ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>

                <div>
                    <label
                        htmlFor="emergency_contact_info"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Emergency Contact
                    </label>
                    <input
                        type="text"
                        id="emergency_contact_info"
                        name="doctors_emergency_contact_info"
                        value={userDetails.doctors_emergency_contact_info || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label
                    htmlFor="home_address"
                    className="block text-sm font-medium text-gray-700"
                >
                    Home Address
                </label>
                <input
                    type="text"
                    id="home_address"
                    name="doctors_home_address"
                    value={userDetails.doctors_home_address || ""}
                    onChange={handleInputChange}
                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="qualifications"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Qualifications
                    </label>

                    <Select
                        id="qualifications"
                        name="qualifications"
                        options={qualificationsSelectOptions}
                        value={selectedQualification}
                        onChange={handleQualificationChange}
                        className="mt-1"
                        placeholder="Select Qualification"
                        isClearable
                        isSearchable
                        noOptionsMessage={() => "No qualifications found"}
                    />
                </div>
                <div>
                    <label
                        htmlFor="areas_of_specialization"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Areas of Specialization
                    </label>
                    <Select
                        isMulti
                        id="areas_of_specialization"
                        name="areas_of_specialization"
                        options={specializationOptions}
                        value={selectedSpecializations}
                        onChange={handleSpecializationChange}
                        className="mt-1"
                        placeholder="Select Specializations"
                        isSearchable
                        closeMenuOnSelect={false}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="years_of_experience"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Years of Experience
                    </label>
                    <input
                        type="number"
                        id="years_of_experience"
                        name="doctors_years_of_experience"
                        value={userDetails.doctors_years_of_experience || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="previous_employment"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Previous Employment
                    </label>
                    <input
                        type="text"
                        id="previous_employment"
                        name="doctors_previous_employment"
                        value={userDetails.doctors_previous_employment || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="license_validity_date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        License Validity Date
                    </label>
                    <input
                        type="date"
                        id="license_validity_date"
                        name="doctors_license_validity_date"
                        value={userDetails.doctors_license_validity_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="employee_id"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Employee ID
                    </label>
                    <input
                        type="text"
                        id="employee_id"
                        name="doctors_employee_id"
                        value={userDetails.doctors_employee_id || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                        readOnly
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="medical_registration_number"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Medical registration number
                    </label>
                    <input
                        type="text"
                        id="medical_registration_number"
                        name="doctors_medical_registration_number"
                        value={
                            userDetails.doctors_medical_registration_number ||
                            ""
                        }
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="joining_date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Joining Date
                    </label>
                    <input
                        type="date"
                        id="joining_date"
                        name="doctors_joining_date"
                        value={userDetails.doctors_joining_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="contract_type"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Contract Type
                    </label>
                    <select
                        id="contract_type"
                        name="doctors_contract_type"
                        value={userDetails.doctors_contract_type || ""}
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
                        htmlFor="contract_duration"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Contract Duration
                    </label>
                    <input
                        type="text"
                        id="contract_duration"
                        name="doctors_contract_duration"
                        value={userDetails.doctors_contract_duration || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="compensation_package"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Compensation Package
                    </label>
                    <input
                        type="text"
                        id="compensation_package"
                        name="doctors_compensation_package"
                        value={userDetails.doctors_compensation_package || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="probation_start_date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Probation Start Date
                    </label>
                    <input
                        type="date"
                        id="probation_start_date"
                        name="doctors_probation_start_date"
                        value={userDetails.doctors_probation_start_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
                <div>
                    <label
                        htmlFor="probation_end_date"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Probation End Date
                    </label>
                    <input
                        type="date"
                        id="probation_end_date"
                        name="doctors_probation_end_date"
                        value={userDetails.doctors_probation_end_date || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-gray-300 rounded-md"
                    />
                </div>
            </div>
        </div>
    );
};

export default DoctorEditForm;
