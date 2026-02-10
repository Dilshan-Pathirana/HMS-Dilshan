import axios from 'axios';
import React, { useEffect, useState } from "react";
import api from "../../../utils/api/axios";
import Select from "react-select";
import alert from "../../../utils/alert";
import {
    IDropdownOption,
    IDoctorData,
} from "../../../utils/types/DoctorSession/IDoctorSession.ts";
import { IDoctorCreatedDiseaseFormTypes } from "../../../utils/types/DoctorDisease/DoctorDisease.ts";

interface DoctorCreatedDiseaseProps {
    onCreated?: () => void;
}

const DoctorCreatedDisease: React.FC<DoctorCreatedDiseaseProps> = ({ onCreated }) => {
    const [formData, setFormData] = useState<IDoctorCreatedDiseaseFormTypes>({
        doctor_id: "",
        disease_name: "",
        description: "",
        priority: "",
    });

    const [doctorOptions, setDoctorOptions] = useState<IDropdownOption[]>([]);
    const [selectedDoctor, setSelectedDoctor] =
        useState<IDropdownOption | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);

    const priorityOptions: IDropdownOption[] = Array.from(
        { length: 10 },
        (_, i) => ({
            value: (i + 1).toString(),
            label: `Priority ${i + 1}`,
        }),
    );

    const [selectedPriority, setSelectedPriority] =
        useState<IDropdownOption | null>(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            setIsLoading(true);
            try {
                const doctorResponse = await api.get("api/get-doctors");
                if (doctorResponse.data.status === 200) {
                    const doctorOpts = doctorResponse.data.doctors.map(
                        (doctor: IDoctorData) => ({
                            value: doctor.user_id,
                            label: `Dr. ${doctor.first_name} ${doctor.last_name}`,
                        }),
                    );
                    setDoctorOptions(doctorOpts);
                }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    alert.warn("Failed to fetch doctors: " + error.message);
                } else {
                    alert.warn("Failed to fetch doctors.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const handleDoctorChange = (selectedOption: IDropdownOption | null) => {
        setSelectedDoctor(selectedOption);
        setFormData((prev) => ({
            ...prev,
            doctor_id: selectedOption?.value ?? "",
        }));
    };

    const handlePriorityChange = (selectedOption: IDropdownOption | null) => {
        setSelectedPriority(selectedOption);
        setFormData((prev) => ({
            ...prev,
            priority: selectedOption?.value
                ? parseInt(selectedOption.value)
                : "",
        }));
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.doctor_id || !formData.disease_name.trim()) {
            alert.warn("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);
        try {
            const submitData = {
                ...formData,
                priority: formData.priority || undefined,
            };

            const response = await api.post(
                "api/create-doctor-disease",
                submitData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message ??
                        "Doctor disease created successfully!",
                );
                setFormData({
                    doctor_id: "",
                    disease_name: "",
                    description: "",
                    priority: "",
                });
                setSelectedDoctor(null);
                setSelectedPriority(null);
                setErrors({});
                onCreated?.();
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
            } else {
                alert.warn(
                    "Failed to create doctor disease: " +
                        (error as Error).message,
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && doctorOptions.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-lg text-neutral-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <form onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-neutral-800">
                        Create Doctor Disease
                    </h2>
                    <p className="text-neutral-600 mt-2">
                        Add a new disease entry for a doctor
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="doctor_select"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Select Doctor *
                        </label>
                        <Select
                            id="doctor_select"
                            value={selectedDoctor}
                            onChange={handleDoctorChange}
                            options={doctorOptions}
                            placeholder="Choose a doctor..."
                            isClearable
                            isSearchable
                            className="text-sm"
                        />
                        {errors.doctor_id && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.doctor_id[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="disease_name"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Disease Name *
                        </label>
                        <input
                            id="disease_name"
                            type="text"
                            name="disease_name"
                            value={formData.disease_name}
                            onChange={handleInputChange}
                            placeholder="Enter disease name..."
                            maxLength={255}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                        {errors.disease_name && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.disease_name[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter disease description (optional)..."
                            rows={4}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-vertical"
                        />
                        {errors.description && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.description[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="priority"
                            className="block text-sm font-medium text-neutral-700 mb-2"
                        >
                            Priority (1-10)
                        </label>
                        <Select
                            id="priority"
                            value={selectedPriority}
                            onChange={handlePriorityChange}
                            options={priorityOptions}
                            placeholder="Choose priority level (optional)..."
                            isClearable
                            isSearchable
                            className="text-sm"
                        />
                        {errors.priority && (
                            <p className="text-error-500 text-sm mt-1">
                                {errors.priority[0]}
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
                                ? "Creating Disease..."
                                : "Create Doctor Disease"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DoctorCreatedDisease;
