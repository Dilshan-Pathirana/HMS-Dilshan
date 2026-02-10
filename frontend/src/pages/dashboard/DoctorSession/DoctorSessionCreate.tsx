import axios from 'axios';
import React, { useEffect, useState } from "react";
import api from "../../../utils/api/axios";
import Select from "react-select";
import { getAllBranches } from "../../../utils/api/branch/GetAllBranches.ts";
import { IBranchData } from "../../../utils/types/Branch/IBranchData.ts";
import alert from "../../../utils/alert";
import {
    IDoctorSessionFormTypes,
    IDropdownOption,
} from "../../../utils/types/DoctorSession/IDoctorSession.ts";

const DoctorSessionCreate = () => {
    const [formData, setFormData] = useState<IDoctorSessionFormTypes>({
        branch_id: "",
        doctor_id: "",
    });

    const [branchOptions, setBranchOptions] = useState<IDropdownOption[]>([]);
    const [doctorOptions, setDoctorOptions] = useState<IDropdownOption[]>([]);

    const [selectedBranch, setSelectedBranch] =
        useState<IDropdownOption | null>(null);
    const [selectedDoctor, setSelectedDoctor] =
        useState<IDropdownOption | null>(null);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const branchResponse = await getAllBranches();
                // Response is already IBranchData[] from axios interceptor
                const branchOpts = branchResponse.map(
                    (branch: IBranchData) => ({
                        value: branch.id,
                        label: branch.center_name,
                    }),
                );
                setBranchOptions(branchOpts);

                const doctorResponse = await api.get<any[]>("/doctors/");
                const doctorList = Array.isArray(doctorResponse)
                    ? doctorResponse
                    : [];
                const doctorOpts = doctorList.map((doctor) => {
                    const regNo = doctor?.user?.medical_registration_number;
                    const regSuffix = regNo ? ` (${regNo})` : "";
                    return {
                        value: doctor.id,
                        label: `Dr. ${doctor.first_name} ${doctor.last_name}${regSuffix}`,
                    };
                });
                setDoctorOptions(doctorOpts);
                if (doctorOpts.length === 0) {
                    alert.info("No doctors found.");
                }

            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn("Failed to fetch data: " + error.message);
                } else {
                    alert.warn("Failed to fetch data.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBranchChange = (selectedOption: IDropdownOption | null) => {
        setSelectedBranch(selectedOption);
        setFormData((prev) => ({
            ...prev,
            branch_id: selectedOption?.value || "",
        }));
    };

    const handleDoctorChange = (selectedOption: IDropdownOption | null) => {
        setSelectedDoctor(selectedOption);
        setFormData((prev) => ({
            ...prev,
            doctor_id: selectedOption?.value || "",
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.branch_id || !formData.doctor_id) {
            alert.warn("Please select all required fields.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post(
                "api/create-doctor-session",
                formData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message ||
                        "Doctor session created successfully!",
                );
                setFormData({
                    branch_id: "",
                    doctor_id: "",
                });
                setSelectedBranch(null);
                setSelectedDoctor(null);
                setErrors({});
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert.warn(
                    "Failed to create doctor session: " +
                        (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && branchOptions.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-lg text-neutral-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-6 p-6 bg-white rounded-lg shadow-md"
            >
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-neutral-800">
                        Create Session
                    </h2>
                    <p className="text-neutral-600 mt-2">
                        Open a session (patients can book after creation)
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Select Branch *
                        </label>
                        <Select
                            value={selectedBranch}
                            onChange={handleBranchChange}
                            options={branchOptions}
                            placeholder="Choose a branch..."
                            isClearable
                            isSearchable
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {errors.branch_id && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.branch_id[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Select Doctor *
                        </label>
                        <Select
                            value={selectedDoctor}
                            onChange={handleDoctorChange}
                            options={doctorOptions}
                            placeholder="Choose a doctor..."
                            isClearable
                            isSearchable
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {errors.doctor_id && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.doctor_id[0]}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors duration-200 ${
                                isLoading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-primary-500 hover:bg-primary-500 focus:ring-2 focus:ring-blue-400"
                            } text-white focus:outline-none`}
                        >
                            {isLoading
                                ? "Creating Session..."
                                : "Create Session"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DoctorSessionCreate;
