import React from "react";
import { CommonFormFields } from "./CommonFormFields";
import { PatientEditFormProps } from "../../../../../utils/types/users/IUserEdit.ts";

export const PatientEditForm: React.FC<PatientEditFormProps> = ({
    userDetails,
    branchOptions,
    handleInputChange,
    handleBranchChange,
}) => {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Edit Patient Details</h2>

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
            </div>

            <CommonFormFields
                userDetails={userDetails}
                branchOptions={branchOptions}
                handleInputChange={handleInputChange}
                handleBranchChange={handleBranchChange}
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label
                        htmlFor="patient_id"
                        className="block text-sm font-medium text-neutral-700"
                    >
                        Patient ID
                    </label>
                    <input
                        type="text"
                        id="patient_id"
                        name="patient_id"
                        value={userDetails?.patient_id || ""}
                        onChange={handleInputChange}
                        className="mt-1 p-2 block w-full border border-neutral-300 rounded-md"
                        readOnly
                    />
                </div>
            </div>
        </div>
    );
};
