import axios from 'axios';
import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import api from "../../../../utils/api/axios";
import alert from "../../../../utils/alert";
import {
    DiseaseFormData,
    DoctorDiseaseEditModalProps,
} from "../../../../utils/types/DoctorDisease/DoctorDisease";
import { ConfirmAlert } from "../../../../assets/Common/Alert/ConfirmAlert.tsx";

const DoctorDiseaseEditModal: React.FC<DoctorDiseaseEditModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    disease,
}) => {
    const [formData, setFormData] = useState<DiseaseFormData>({
        doctor_id: "",
        disease_name: "",
        description: "",
        priority: "",
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen && disease) {
            setFormData({
                doctor_id: disease.doctor_id,
                disease_name: disease.disease_name,
                description: disease.description || "",
                priority: disease.priority || "",
            });
            setErrors({});
            setHasChanges(false);
        }
    }, [isOpen, disease]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        const newValue =
            name === "priority" ? (value ? parseInt(value) : "") : value;

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
        setHasChanges(true);
    };

    const handleClose = async () => {
        if (hasChanges) {
            const confirmed = await ConfirmAlert(
                "Unsaved Changes",
                "You have unsaved changes. Are you sure you want to close without saving?",
            );
            if (!confirmed) return;
        }
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!disease) return;

        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                priority: formData.priority || undefined,
            };

            const response = await api.put(
                `/update-doctor-disease/${disease.id}`,
                submitData,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.status === 200) {
                alert.success(
                    response.data.message || "Disease updated successfully!",
                );
                setHasChanges(false);
                onSuccess();
                onClose();
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert.error("Failed to update disease.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            Edit Disease
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Doctor: Dr. {disease.doctor_first_name}{" "}
                            {disease.doctor_last_name}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        disabled={isSubmitting}
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Disease Name *
                        </label>
                        <input
                            type="text"
                            name="disease_name"
                            value={formData.disease_name}
                            onChange={handleInputChange}
                            placeholder="Enter disease name..."
                            maxLength={255}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {errors.disease_name && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.disease_name[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter disease description (optional)..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.description[0]}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority (1-10)
                        </label>
                        <input
                            type="number"
                            name="priority"
                            value={formData.priority}
                            onChange={handleInputChange}
                            placeholder="Enter priority level (optional)..."
                            min="1"
                            max="10"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        {errors.priority && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.priority[0]}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-between pt-6 border-t border-gray-200">
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !hasChanges}
                                className={`px-6 py-2 rounded-md transition-colors text-sm font-medium ${
                                    isSubmitting || !hasChanges
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600"
                                } text-white`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    "Update Disease"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DoctorDiseaseEditModal;
