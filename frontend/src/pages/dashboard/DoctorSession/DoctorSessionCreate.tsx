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

type DoctorSessionCreateProps = {
    onCreated?: () => void;
};

const DoctorSessionCreate: React.FC<DoctorSessionCreateProps> = ({ onCreated }) => {
    const [formData, setFormData] = useState<IDoctorSessionFormTypes>({
        branch_id: "",
        doctor_id: "",
        start_time: "",
        end_time: "",
        slot_duration_minutes: 30,
        max_patients: 20,
        recurrence_type: "weekly",
        status: "active",
        valid_from: "",
        valid_until: "",
    });

    const [branchOptions, setBranchOptions] = useState<IDropdownOption[]>([]);
    const [doctorOptions, setDoctorOptions] = useState<IDropdownOption[]>([]);

    const [selectedBranch, setSelectedBranch] =
        useState<IDropdownOption | null>(null);
    const [selectedDoctor, setSelectedDoctor] =
        useState<IDropdownOption | null>(null);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const mapApiErrors = (data: any) => {
        if (!data) {
            return {};
        }

        if (data.errors && typeof data.errors === "object") {
            return data.errors;
        }

        if (Array.isArray(data.detail)) {
            const mapped: Record<string, string[]> = {};
            data.detail.forEach((item: any) => {
                const loc = Array.isArray(item.loc) ? item.loc : [];
                const field = loc.find((part: any) => typeof part === "string");
                if (!field) {
                    return;
                }
                const message = typeof item.msg === "string" ? item.msg : "Invalid value";
                if (!mapped[field]) {
                    mapped[field] = [];
                }
                mapped[field].push(message);
            });
            return mapped;
        }

        if (typeof data.detail === "string") {
            return { form: [data.detail] };
        }

        return {};
    };

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

        if (!formData.start_time || !formData.end_time) {
            alert.warn("Please provide a valid start and end time.");
            return;
        }

        if (!formData.valid_from) {
            alert.warn("Please select a valid start date.");
            return;
        }

        if (formData.start_time && formData.end_time) {
            const startMinutes = timeToMinutes(formData.start_time);
            const endMinutes = timeToMinutes(formData.end_time);
            if (endMinutes <= startMinutes) {
                setErrors({ end_time: ["End time must be after start time."] });
                alert.warn("End time must be after start time.");
                return;
            }
        }

        if (formData.valid_from && formData.valid_until) {
            const startDate = new Date(formData.valid_from);
            const endDate = new Date(formData.valid_until);
            if (endDate < startDate) {
                setErrors({ valid_until: ["Valid until must be on or after valid from."] });
                alert.warn("Valid until must be on or after valid from.");
                return;
            }
        }

        const payload = {
            ...formData,
            valid_from: formData.valid_from || undefined,
            valid_until: formData.valid_until || undefined,
        };

        setIsLoading(true);
        try {
            const response = await api.post(
                "/sessions",
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.status === 200) {
                alert.success("Session created");
                setFormData({
                    branch_id: "",
                    doctor_id: "",
                    start_time: "",
                    end_time: "",
                    slot_duration_minutes: 30,
                    max_patients: 20,
                    recurrence_type: "weekly",
                    status: "active",
                    valid_from: "",
                    valid_until: "",
                });
                setSelectedBranch(null);
                setSelectedDoctor(null);
                setErrors({});
                onCreated?.();
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const mappedErrors = mapApiErrors(error.response?.data);
                if (Object.keys(mappedErrors).length > 0) {
                    setErrors(mappedErrors);
                }
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

    const timeToMinutes = (value: string) => {
        const parts = value.split(":");
        const hours = Number(parts[0] || 0);
        const minutes = Number(parts[1] || 0);
        return hours * 60 + minutes;
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
                    {errors.form && (
                        <p className="text-error-500 text-sm mt-3">
                            {errors.form[0]}
                        </p>
                    )}
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

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Start Time *
                        </label>
                        <input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    start_time: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {errors.start_time && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.start_time[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            End Time *
                        </label>
                        <input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    end_time: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {errors.end_time && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.end_time[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Slot Duration (min) *
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={240}
                            value={formData.slot_duration_minutes}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    slot_duration_minutes: Number(e.target.value),
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {errors.slot_duration_minutes && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.slot_duration_minutes[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Max Patients *
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={formData.max_patients}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    max_patients: Number(e.target.value),
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {errors.max_patients && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.max_patients[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Recurrence *
                        </label>
                        <select
                            value={formData.recurrence_type}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recurrence_type: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="daily">Daily</option>
                            <option value="once">Once</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Status *
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    status: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Valid From *
                        </label>
                        <input
                            type="date"
                            value={formData.valid_from}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    valid_from: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            required
                        />
                        {errors.valid_from && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.valid_from[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Valid Until
                        </label>
                        <input
                            type="date"
                            value={formData.valid_until}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    valid_until: e.target.value,
                                }))
                            }
                            className="w-44 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        {errors.valid_until && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.valid_until[0]}
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
